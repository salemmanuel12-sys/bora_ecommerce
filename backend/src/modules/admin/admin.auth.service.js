const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const setupModels = require('../../models');
const { sequelize } = require('../../config/db');
const HttpError = require('../../utils/httpError');
const { Administrador, AdminRefreshToken, AdminResetCode } = require('../../models');
const { sendResetCode } = require('../../utils/email');
const emailService = require('../../services/emailService');
const {
  normalizeEmail,
  isValidEmail,
  isSafePassword,
  isJwtToken,
  isValidResetCode,
} = require('../../utils/adminAuth.validation');

const { getEnv } = require('../../config/env');

const ACCESS_SECRET = getEnv('JWT_ACCESS_SECRET', 32);
const REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET', 32);
const RESET_SECRET = getEnv('JWT_RESET_SECRET', 32);
const ACCESS_EXPIRES_IN = getEnv('JWT_ACCESS_EXPIRES_IN', 1) || '15m';
const REFRESH_EXPIRES_IN = getEnv('JWT_REFRESH_EXPIRES_IN', 1) || '7d';

function publicAdmin(admin) {
  const data = admin.get ? admin.get({ plain: true }) : admin;

  return {
    id: data.NUM_ADMIN,
    uuid: data.UUID_ADMIN,
    nombre: data.NOMBRE,
    email: data.EMAIL,
    rolId: data.ROL_ID,
    estado: Boolean(data.ESTADO),
    status: data.STATUS,
    emailVerificado: Boolean(data.EMAIL_VERIFICADO),
  };
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getPasswordVersion(passwordHash) {
  return crypto.createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16);
}

function getTokenMeta(userAgent, ipAddress) {
  return {
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
  };
}

async function issueTokens(admin, meta) {
  const accessToken = jwt.sign(
    {
      sub: admin.NUM_ADMIN,
      email: admin.EMAIL,
      rol: admin.ROL_ID,
      type: 'access',
    },
    ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { sub: admin.NUM_ADMIN, type: 'refresh', jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: REFRESH_EXPIRES_IN }
  );

  const decoded = jwt.decode(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);

  await AdminRefreshToken.create({
    adminId: admin.NUM_ADMIN,
    tokenHash,
    expiresAt: new Date(decoded.exp * 1000),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_EXPIRES_IN,
  };
}

async function requestPasswordReset(email) {
  const cleanEmail = normalizeEmail(email);

  if (!isValidEmail(cleanEmail)) {
    return;
  }

  const admin = await Administrador.findOne({ where: { EMAIL: cleanEmail } });

  if (!admin || !admin.ESTADO) {
    return;
  }

  await AdminResetCode.destroy({ where: { adminId: admin.NUM_ADMIN } });

  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await AdminResetCode.create({ adminId: admin.NUM_ADMIN, codeHash, expiresAt });
  await sendResetCode(admin.EMAIL, code);
}

async function verifyResetCode({ email, code }) {
  const cleanEmail = normalizeEmail(email);

  if (!isValidEmail(cleanEmail) || !isValidResetCode(code)) {
    throw new HttpError(400, 'Datos invalidos.');
  }

  const admin = await Administrador.findOne({ where: { EMAIL: cleanEmail } });

  if (!admin || !admin.ESTADO) {
    throw new HttpError(400, 'Codigo invalido o expirado.');
  }

  const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');

  const resetCode = await AdminResetCode.findOne({
    where: {
      adminId: admin.NUM_ADMIN,
      codeHash,
      used: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!resetCode) {
    throw new HttpError(400, 'Codigo invalido o expirado.');
  }

  await resetCode.update({ used: true, usedAt: new Date() });

  const resetToken = jwt.sign(
    {
      sub: admin.NUM_ADMIN,
      type: 'password-reset',
      jti: crypto.randomUUID(),
      pwdv: getPasswordVersion(admin.PASSWORD),
    },
    RESET_SECRET,
    { algorithm: 'HS256', expiresIn: '10m' }
  );

  return { resetToken };
}

async function resetPassword({ resetToken, newPassword }) {
  if (!isJwtToken(String(resetToken || '').trim())) {
    throw new HttpError(400, 'Token de reset requerido.');
  }

  if (!isSafePassword(newPassword)) {
    throw new HttpError(400, 'La contrasena debe tener entre 8 y 72 caracteres sin caracteres de control.');
  }

  let payload;

  try {
    payload = jwt.verify(resetToken, RESET_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Token de reset invalido o expirado.');
  }

  if (payload.type !== 'password-reset') {
    throw new HttpError(401, 'Token invalido.');
  }

  const admin = await Administrador.findByPk(payload.sub);

  if (!admin || !admin.ESTADO) {
    throw new HttpError(404, 'Administrador no encontrado.');
  }

  if (payload.pwdv !== getPasswordVersion(admin.PASSWORD)) {
    throw new HttpError(401, 'Token de reset invalido o reutilizado.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date();
  const fechaSolicitud = now.toISOString().slice(0, 10).replace(/-/g, '');
  const horaSolicitud = now.toTimeString().slice(0, 8).replace(/:/g, '');

  await admin.update({
    PASSWORD_CAMBIO_PROPUESTA: passwordHash,
    PASSWORD_CAMBIO_ESTADO: 'pending',
    PASSWORD_CAMBIO_FEC_SOLICITUD: fechaSolicitud,
    PASSWORD_CAMBIO_HORA_SOLICITUD: horaSolicitud,
    PASSWORD_CAMBIO_FEC_RESOLUCION: null,
    PASSWORD_CAMBIO_HORA_RESOLUCION: null,
    PASSWORD_CAMBIO_SUPERADMIN: null,
    PASSWORD_CAMBIO_MOTIVO: null,
  });

  await AdminRefreshToken.update(
    { revoked: true, revokedAt: new Date() },
    { where: { adminId: admin.NUM_ADMIN, revoked: false } }
  );

  await AdminResetCode.destroy({ where: { adminId: admin.NUM_ADMIN } });

  // Notify active superadmins about pending request; do not block user flow if email fails.
  try {
    const superAdmins = await Administrador.findAll({
      where: {
        ESTADO: 1,
        STATUS: 'approved',
        EMAIL_VERIFICADO: true,
        ROL_ID: 1,
      },
      attributes: ['EMAIL'],
    });

    const emails = superAdmins
      .map((item) => item.EMAIL)
      .filter((email) => Boolean(String(email || '').trim()));

    if (emails.length > 0) {
      await emailService.enviarNotificacionCambioPasswordSuperAdmin(
        emails.join(','),
        admin.NOMBRE,
        admin.EMAIL
      );
    }
  } catch (_notifyError) {
    // no-op
  }
}

async function loginAdmin({ email, password, userAgent, ipAddress }) {
  const cleanEmail = normalizeEmail(email);

  if (!isValidEmail(cleanEmail) || !isSafePassword(password, { minLength: 1 })) {
    throw new HttpError(400, 'Credenciales invalidas.');
  }

  const admin = await Administrador.findOne({
    where: { EMAIL: cleanEmail },
  });

  if (!admin || !admin.ESTADO) {
    throw new HttpError(401, 'Correo o contrasena incorrectos.');
  }

  if (admin.PASSWORD_CAMBIO_ESTADO === 'pending') {
    throw new HttpError(403, 'Tu cambio de contrasena esta pendiente de aprobacion del superadmin.');
  }

  if (admin.STATUS !== 'approved') {
    throw new HttpError(403, 'Tu cuenta no esta aprobada por el superadmin.');
  }

  if (!admin.EMAIL_VERIFICADO) {
    throw new HttpError(403, 'Debes verificar tu correo antes de iniciar sesion.');
  }

  const isPasswordOk = await bcrypt.compare(password, String(admin.PASSWORD || ''));

  if (!isPasswordOk) {
    throw new HttpError(401, 'Correo o contrasena incorrectos.');
  }

  const tokens = await issueTokens(admin, getTokenMeta(userAgent, ipAddress));

  return {
    admin: publicAdmin(admin),
    ...tokens,
  };
}

async function refreshSession({ refreshToken, userAgent, ipAddress }) {
  if (!isJwtToken(String(refreshToken || '').trim())) {
    throw new HttpError(400, 'Refresh token requerido.');
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET, { algorithms: ['HS256'] });
  } catch (_error) {
    throw new HttpError(401, 'Refresh token invalido o expirado.');
  }

  if (payload.type !== 'refresh') {
    throw new HttpError(401, 'Tipo de token invalido.');
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await AdminRefreshToken.findOne({
    where: { tokenHash },
  });

  if (!storedToken || storedToken.revoked) {
    throw new HttpError(401, 'Refresh token no autorizado.');
  }

  if (new Date(storedToken.expiresAt) < new Date()) {
    throw new HttpError(401, 'Refresh token expirado.');
  }

  const admin = await Administrador.findByPk(payload.sub);

  if (!admin || !admin.ESTADO || admin.STATUS !== 'approved' || !admin.EMAIL_VERIFICADO) {
    throw new HttpError(401, 'Administrador no autorizado.');
  }

  await AdminRefreshToken.update(
    {
      revoked: true,
      revokedAt: new Date(),
    },
    {
      where: {
        tokenHash,
        revoked: false,
      },
    }
  );

  const tokens = await issueTokens(admin, getTokenMeta(userAgent, ipAddress));

  return {
    admin: publicAdmin(admin),
    ...tokens,
  };
}

async function logoutSession(refreshToken) {
  if (!isJwtToken(String(refreshToken || '').trim())) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  await AdminRefreshToken.update(
    {
      revoked: true,
      revokedAt: new Date(),
    },
    {
      where: {
        tokenHash,
        revoked: false,
      },
    }
  );
}

async function getMe(adminId) {
  const admin = await Administrador.findByPk(adminId);

  if (!admin || !admin.ESTADO) {
    throw new HttpError(404, 'Administrador no encontrado.');
  }

  return publicAdmin(admin);
}

async function changePassword({ adminId, currentPassword, newPassword }) {
  if (!isSafePassword(currentPassword, { minLength: 1 }) || !isSafePassword(newPassword)) {
    throw new HttpError(400, 'Contrasena actual o nueva contrasena invalidas.');
  }

  const admin = await Administrador.findByPk(adminId);

  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado.');
  }

  const isCurrentPasswordOk = await bcrypt.compare(currentPassword, String(admin.PASSWORD || ''));

  if (!isCurrentPasswordOk) {
    throw new HttpError(401, 'La contrasena actual es incorrecta.');
  }

  if (currentPassword === newPassword) {
    throw new HttpError(400, 'La nueva contrasena debe ser distinta a la actual.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.update({ PASSWORD: passwordHash });

  await AdminRefreshToken.update(
    {
      revoked: true,
      revokedAt: new Date(),
    },
    {
      where: {
        adminId,
        revoked: false,
      },
    }
  );
}

async function logoutAll(adminId) {
  await AdminRefreshToken.update(
    {
      revoked: true,
      revokedAt: new Date(),
    },
    {
      where: {
        adminId,
        revoked: false,
        expiresAt: {
          [Op.gte]: new Date(),
        },
      },
    }
  );
}

async function listActiveSessions(adminId) {
  const sessions = await AdminRefreshToken.findAll({
    where: {
      adminId,
      revoked: false,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    attributes: ['id', 'expiresAt', 'createdAt', 'userAgent', 'ipAddress'],
    order: [['createdAt', 'DESC']],
  });

  return sessions.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    userAgent: item.userAgent,
    ipAddress: item.ipAddress,
  }));
}

async function revokeSessionById({ adminId, sessionId }) {
  const parsedSessionId = Number.parseInt(sessionId, 10);

  if (!Number.isInteger(parsedSessionId) || parsedSessionId <= 0) {
    throw new HttpError(400, 'Id de sesion invalido.');
  }

  const token = await AdminRefreshToken.findOne({
    where: {
      id: parsedSessionId,
      adminId,
    },
  });

  if (!token) {
    throw new HttpError(404, 'Sesion no encontrada.');
  }

  if (token.revoked) {
    return;
  }

  await token.update({ revoked: true, revokedAt: new Date() });
}

const toAuditDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const toAuditTime = () => new Date().toTimeString().slice(0, 8).replace(/:/g, '');

async function listPasswordChangeRequests() {
  const rows = await Administrador.findAll({
    where: {
      PASSWORD_CAMBIO_ESTADO: 'pending',
      ESTADO: 1,
    },
    attributes: [
      'NUM_ADMIN',
      'NOMBRE',
      'EMAIL',
      'PASSWORD_CAMBIO_FEC_SOLICITUD',
      'PASSWORD_CAMBIO_HORA_SOLICITUD',
      'PASSWORD_CAMBIO_ESTADO',
    ],
    order: [['PASSWORD_CAMBIO_FEC_SOLICITUD', 'DESC'], ['PASSWORD_CAMBIO_HORA_SOLICITUD', 'DESC']],
  });

  return rows.map((item) => (item.get ? item.get({ plain: true }) : item));
}

async function approvePasswordChangeRequest({ adminId, superAdminId }) {
  const parsedId = Number.parseInt(String(adminId || ''), 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new HttpError(400, 'Id de administrador invalido.');
  }

  const admin = await Administrador.findByPk(parsedId);
  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado.');
  }

  if (admin.PASSWORD_CAMBIO_ESTADO !== 'pending') {
    throw new HttpError(400, 'La solicitud no esta pendiente.');
  }

  if (!admin.PASSWORD_CAMBIO_PROPUESTA) {
    throw new HttpError(400, 'No existe una contrasena propuesta para aplicar.');
  }

  await admin.update({
    PASSWORD: admin.PASSWORD_CAMBIO_PROPUESTA,
    PASSWORD_CAMBIO_PROPUESTA: null,
    PASSWORD_CAMBIO_ESTADO: 'approved',
    PASSWORD_CAMBIO_FEC_RESOLUCION: toAuditDate(),
    PASSWORD_CAMBIO_HORA_RESOLUCION: toAuditTime(),
    PASSWORD_CAMBIO_SUPERADMIN: String(superAdminId || ''),
    PASSWORD_CAMBIO_MOTIVO: null,
  });

  await AdminRefreshToken.update(
    { revoked: true, revokedAt: new Date() },
    { where: { adminId: admin.NUM_ADMIN, revoked: false } }
  );
}

async function rejectPasswordChangeRequest({ adminId, superAdminId, motivo }) {
  const parsedId = Number.parseInt(String(adminId || ''), 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new HttpError(400, 'Id de administrador invalido.');
  }

  const admin = await Administrador.findByPk(parsedId);
  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado.');
  }

  if (admin.PASSWORD_CAMBIO_ESTADO !== 'pending') {
    throw new HttpError(400, 'La solicitud no esta pendiente.');
  }

  const cleanMotivo = String(motivo || '').trim().slice(0, 150) || null;

  await admin.update({
    PASSWORD_CAMBIO_PROPUESTA: null,
    PASSWORD_CAMBIO_ESTADO: 'rejected',
    PASSWORD_CAMBIO_FEC_RESOLUCION: toAuditDate(),
    PASSWORD_CAMBIO_HORA_RESOLUCION: toAuditTime(),
    PASSWORD_CAMBIO_SUPERADMIN: String(superAdminId || ''),
    PASSWORD_CAMBIO_MOTIVO: cleanMotivo,
  });
}

module.exports = {
  loginAdmin,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  refreshSession,
  logoutSession,
  getMe,
  changePassword,
  logoutAll,
  listActiveSessions,
  revokeSessionById,
  listPasswordChangeRequests,
  approvePasswordChangeRequest,
  rejectPasswordChangeRequest,
};
