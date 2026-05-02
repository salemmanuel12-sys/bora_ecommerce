const { Op } = require('sequelize');
const { Usuario, UsuarioVerificationCode } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const HttpError = require('../../utils/httpError');
const emailService = require('../../services/emailService');

function getUserAccessSecret() {
  const value = process.env.JWT_USER_SECRET;

  if (!value || value.length < 32) {
    throw new Error('La variable JWT_USER_SECRET es obligatoria y debe tener al menos 32 caracteres.');
  }

  return value;
}

const USER_ACCESS_SECRET = getUserAccessSecret();
const USER_ACCESS_EXPIRES_IN = process.env.JWT_USER_EXPIRES_IN || '7d';

function sanitizeText(value = '', maxLength = 160) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function toPublicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    status: user.status,
    sessionType: 'usuario',
  };
}

function issueUserTokens(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      type: 'user_access',
    },
    USER_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: USER_ACCESS_EXPIRES_IN }
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: USER_ACCESS_EXPIRES_IN,
  };
}

async function listUsuarios({ page = 1, limit = 10, search = '', status = null } = {}) {
  const where = {};

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${normalizedSearch}%` } },
      { email: { [Op.iLike]: `%${normalizedSearch}%` } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.max(1, Number.parseInt(String(limit), 10) || 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Usuario.findAndCountAll({
    where,
    offset,
    limit: parsedLimit,
    order: [['createdAt', 'DESC']],
  });

  return {
    items: rows.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
    })),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function loginUsuario({ email, password }) {
  const normalizedEmail = sanitizeText(email, 160).toLowerCase();

  if (!normalizedEmail || !password) {
    throw new HttpError(400, 'Email y contraseña son requeridos.');
  }

  const user = await Usuario.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new HttpError(401, 'Credenciales inválidas.');
  }

  if (user.status !== 'activo') {
    throw new HttpError(403, 'Tu cuenta no está activa.');
  }

  const passwordValue = String(password);
  const passwordHash = String(user.password || '');
  const isHash = passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$');

  let passwordValid = false;

  if (isHash) {
    passwordValid = await bcrypt.compare(passwordValue, passwordHash);
  } else {
    // Compatibilidad temporal para registros heredados sin hash.
    passwordValid = passwordHash === passwordValue;
  }

  if (!passwordValid) {
    throw new HttpError(401, 'Credenciales inválidas.');
  }

  return {
    user: toPublicUser(user),
    tokens: issueUserTokens(user),
  };
}

async function socialLoginUsuario({ email, nombre, provider, providerUid }) {
  const normalizedEmail = sanitizeText(email, 160).toLowerCase();
  const normalizedName = sanitizeText(nombre || normalizedEmail.split('@')[0] || 'Cliente', 120);

  if (!normalizedEmail) {
    throw new HttpError(400, 'Email es requerido para login social.');
  }

  let user = await Usuario.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    const randomPasswordSeed = `${provider || 'social'}-${providerUid || ''}-${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(randomPasswordSeed, 10);

    user = await Usuario.create({
      nombre: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
      status: 'activo',
    });
  } else if (user.status !== 'activo') {
    throw new HttpError(403, 'Tu cuenta no está activa.');
  }

  return {
    user: toPublicUser(user),
    tokens: issueUserTokens(user),
  };
}

async function registerUsuario({ nombre, email, password }) {
  const normalizedEmail = sanitizeText(email, 160).toLowerCase();
  const normalizedName = sanitizeText(nombre, 120);

  if (!normalizedName || !normalizedEmail || !password) {
    throw new HttpError(400, 'Nombre, email y contraseña son requeridos.');
  }

  if (String(password).length < 8) {
    throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
  }

  const existing = await Usuario.findOne({ where: { email: normalizedEmail } });

  let user = existing;
  const passwordHash = await bcrypt.hash(String(password), 10);

  if (!existing) {
    user = await Usuario.create({
      nombre: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
      status: 'inactivo',
    });
  } else if (existing.status === 'activo') {
    throw new HttpError(409, 'Ya existe una cuenta activa con este correo.');
  } else {
    await existing.update({ nombre: normalizedName, password: passwordHash, status: 'inactivo' });
  }

  await UsuarioVerificationCode.destroy({ where: { userId: user.id } });

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await UsuarioVerificationCode.create({
    userId: user.id,
    codeHash,
    expiresAt,
  });

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linkVerificacion = `${frontendBaseUrl}/usuarios/verificar-email`;

  await emailService.enviarCodigoVerificacion(normalizedEmail, code, linkVerificacion);

  return {
    email: normalizedEmail,
    expiresInMinutes: 15,
  };
}

async function verifyEmailUsuario({ email, code }) {
  const normalizedEmail = sanitizeText(email, 160).toLowerCase();
  const normalizedCode = String(code || '').trim();

  if (!normalizedEmail || !normalizedCode) {
    throw new HttpError(400, 'Email y código son requeridos.');
  }

  const user = await Usuario.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

  const verification = await UsuarioVerificationCode.findOne({
    where: {
      userId: user.id,
      codeHash,
      used: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!verification) {
    throw new HttpError(400, 'Código inválido o expirado.');
  }

  await verification.update({ used: true, usedAt: new Date() });
  await user.update({ status: 'activo' });

  return {
    verified: true,
    email: user.email,
    user: toPublicUser(user),
    tokens: issueUserTokens(user),
  };
}

async function adminUpdateUsuarioStatus({ userId, status }) {
  const parsedUserId = Number.parseInt(String(userId), 10);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new HttpError(400, 'Id de usuario invalido.');
  }

  if (!['activo', 'inactivo'].includes(status)) {
    throw new HttpError(400, 'Status invalido. Usa activo o inactivo.');
  }

  const user = await Usuario.findByPk(parsedUserId);

  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado.');
  }

  await user.update({ status });

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
  };
}

module.exports = {
  listUsuarios,
  loginUsuario,
  socialLoginUsuario,
  registerUsuario,
  verifyEmailUsuario,
  adminUpdateUsuarioStatus,
};

