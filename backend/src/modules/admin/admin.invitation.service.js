const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const HttpError = require('../../utils/httpError');
const { Administrador, Rol } = require('../../models/loader');
const emailService = require('../../services/emailService');

const RESET_CODE_EXP_MS = 15 * 60 * 1000;

const toAuditDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const toAuditTime = () => new Date().toTimeString().slice(0, 8).replace(/:/g, '');
const safeText = (value = '') => String(value).trim().replace(/[<>"'&]/g, '');
const generateResetCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const isValidPassword = (value = '') => /^(?=.*[a-zA-Z])(?=.*\d).{6,128}$/.test(value);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Enviar invitación (solo superadmin)
async function sendInvitation({ email, nombre, rolId, userId, userIp }) {
  // Validaciones de entrada
  if (!email || !nombre || !rolId) {
    throw new HttpError(400, 'Email, nombre y rol son obligatorios');
  }

  // Validar formato de email
  if (!isValidEmail(email.trim())) {
    throw new HttpError(400, 'Formato de email inválido');
  }

  // Validar nombre
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.trim().length > 150) {
    throw new HttpError(400, 'El nombre debe tener entre 2 y 150 caracteres');
  }

  // Sanitizar nombre
  const nombreSanitizado = nombre.trim().replace(/[<>\"'&]/g, '');

  const parsedRolId = Number.parseInt(rolId, 10);
  if (!Number.isInteger(parsedRolId)) {
    throw new HttpError(400, 'Rol inválido');
  }

  // Validar que el rol exista y esté activo
  const rol = await Rol.findOne({
    where: {
      ID_ROL: parsedRolId,
      ESTADO: 1,
    },
  });

  if (!rol) {
    throw new HttpError(400, 'El rol seleccionado no existe o está inactivo');
  }

  // Verificar si el email ya existe
  const normalizedEmail = email.toLowerCase().trim();
  const existingAdmin = await Administrador.findOne({
    where: { EMAIL: normalizedEmail }
  });

  // Si existe un admin pendiente y no verificado, permitimos reenviar invitacion.
  if (existingAdmin) {
    const canResend = existingAdmin.STATUS === 'pending' && !existingAdmin.EMAIL_VERIFICADO;

    if (!canResend) {
      throw new HttpError(400, 'Este correo ya está registrado');
    }

    const resendToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const fechaActualiza = now.toISOString().slice(0, 10).replace(/-/g, '');
    const horaActualiza = now.toTimeString().slice(0, 8).replace(/:/g, '');

    await existingAdmin.update({
      NOMBRE: nombreSanitizado,
      ROL_ID: parsedRolId,
      INVITATION_TOKEN: resendToken,
      INVITATION_EXPIRES: new Date(Date.now() + 24 * 60 * 60 * 1000),
      FEC_ACTUALIZA: fechaActualiza,
      HORA_ACTUALIZA: horaActualiza,
      CVE_USUARIO_ACTUALIZA: String(userId || ''),
      DES_IP_ACTUALIZA: userIp,
    });

    try {
      await emailService.enviarInvitacionAdmin(normalizedEmail, nombreSanitizado, resendToken);
    } catch (_error) {
      throw new HttpError(502, 'No se pudo enviar la invitacion por correo. Verifica la configuracion SMTP.');
    }

    return;
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  const uuid = crypto.randomUUID();

  // Obtener fecha y hora actuales
  const now = new Date();
  const fechaAlta = now.toISOString().slice(0, 10).replace(/-/g, '');
  const horaAlta = now.toTimeString().slice(0, 8).replace(/:/g, '');

  const createdAdmin = await Administrador.create({
    UUID_ADMIN: uuid,
    NOMBRE: nombreSanitizado,
    EMAIL: normalizedEmail,
    PASSWORD: '',
    ROL_ID: parsedRolId,
    INVITATION_TOKEN: invitationToken,
    INVITATION_EXPIRES: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    STATUS: 'pending',
    ESTADO: 1,
    FEC_ALTA: fechaAlta,
    HORA_ALTA: horaAlta,
    CVE_USUARIO_ALTA: userId.toString(),
    DES_IP_ALTA: userIp,
  });

  try {
    await emailService.enviarInvitacionAdmin(normalizedEmail, nombreSanitizado, invitationToken);
  } catch (_error) {
    try {
      await createdAdmin.destroy();
    } catch (_cleanupError) {
      // no-op: if cleanup fails, we still return explicit email error.
    }

    throw new HttpError(502, 'No se pudo enviar la invitacion por correo. Verifica la configuracion SMTP.');
  }
}

// Registro desde invitación
async function registerFromInvitation({ token, password, userIp }) {
  // Validaciones de entrada
  if (!token || !password) {
    throw new HttpError(400, 'Token y contraseña son obligatorios');
  }

  // Validar token
  if (typeof token !== 'string' || token.trim().length !== 64) {
    throw new HttpError(400, 'Token inválido');
  }

  // Validar contraseña
  if (typeof password !== 'string') {
    throw new HttpError(400, 'La contraseña debe ser un texto válido');
  }

  if (password.length < 6) {
    throw new HttpError(400, 'La contraseña debe tener mínimo 6 caracteres');
  }

  if (password.length > 128) {
    throw new HttpError(400, 'La contraseña no puede exceder 128 caracteres');
  }

  // Validar complejidad de contraseña
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    throw new HttpError(400, 'La contraseña debe contener al menos una letra y un número');
  }

  const admin = await Administrador.findOne({
    where: {
      INVITATION_TOKEN: token.trim(),
      STATUS: 'pending'
    }
  });

  if (!admin) {
    throw new HttpError(400, 'Invitación no encontrada o ya utilizada');
  }

  if (admin.INVITATION_EXPIRES < new Date()) {
    throw new HttpError(400, 'Invitación expirada. Solicita una nueva invitación');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const codigo = generateResetCode();

  // Obtener fecha y hora actuales
  const now = new Date();
  const fechaActualiza = now.toISOString().slice(0, 10).replace(/-/g, '');
  const horaActualiza = now.toTimeString().slice(0, 8).replace(/:/g, '');

  admin.PASSWORD = hashedPassword;
  admin.CODIGO_VERIFICACION = codigo;
  admin.INVITATION_TOKEN = null;
  admin.INVITATION_EXPIRES = null;
  admin.FEC_ACTUALIZA = fechaActualiza;
  admin.HORA_ACTUALIZA = horaActualiza;
  admin.CVE_USUARIO_ACTUALIZA = admin.NUM_ADMIN.toString();
  admin.DES_IP_ACTUALIZA = userIp;

  await admin.save();

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linkVerificacion = `${frontendBaseUrl}/admin/verify-email?email=${encodeURIComponent(
    admin.EMAIL
  )}&code=${encodeURIComponent(codigo)}`;

  await emailService.enviarCodigoVerificacion(admin.EMAIL, codigo, linkVerificacion);
}

// Verificar email de admin
async function verifyEmailAdmin({ email, codigo }) {
  if (!email || !codigo) {
    throw new HttpError(400, 'Email y código son obligatorios');
  }

  const admin = await Administrador.findOne({ where: { EMAIL: email.toLowerCase().trim() } });

  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado');
  }

  if (admin.EMAIL_VERIFICADO) {
    throw new HttpError(400, 'El correo ya fue verificado');
  }

  if (admin.CODIGO_VERIFICACION !== codigo) {
    throw new HttpError(400, 'Código inválido o expirado');
  }

  admin.EMAIL_VERIFICADO = true;
  admin.CODIGO_VERIFICACION = null;

  await admin.save();
}

// Aprobar administrador (solo superadmin)
async function approveAdmin({ adminId, motivo, userId, userIp }) {
  // Validar motivo
  if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
    throw new HttpError(400, 'El motivo es obligatorio');
  }

  if (motivo.length > 100) {
    throw new HttpError(400, 'El motivo no puede exceder 100 caracteres');
  }

  // Sanitizar motivo
  const motivoSanitizado = motivo.trim().replace(/[<>\"'&]/g, '');

  const admin = await Administrador.findByPk(adminId);

  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado');
  }

  // Verificar que pueda ser aprobado
  if (!admin.EMAIL_VERIFICADO) {
    throw new HttpError(400, 'El administrador debe verificar su correo antes de ser aprobado');
  }

  if (admin.STATUS === 'pending' && (!admin.PASSWORD || admin.PASSWORD.trim().length === 0)) {
    throw new HttpError(400, 'El administrador debe registrar su contraseña antes de ser aprobado');
  }

  // Obtener fecha y hora actuales
  const now = new Date();
  const fechaReactiva = now.toISOString().slice(0, 10).replace(/-/g, '');
  const horaReactiva = now.toTimeString().slice(0, 8).replace(/:/g, '');

  admin.STATUS = 'approved';
  admin.FEC_REACTIVA = fechaReactiva;
  admin.HORA_REACTIVA = horaReactiva;
  admin.CVE_USUARIO_REACTIVA = userId.toString();
  admin.DES_IP_REACTIVA = userIp;
  admin.DES_MOTIVO_REACTIVA = motivoSanitizado;

  await admin.save();
}

// Rechazar administrador (solo superadmin)
async function rejectAdmin({ adminId, motivo, userId, userIp }) {
  // Validar motivo
  if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
    throw new HttpError(400, 'El motivo es obligatorio');
  }

  if (motivo.length > 100) {
    throw new HttpError(400, 'El motivo no puede exceder 100 caracteres');
  }

  // Sanitizar motivo
  const motivoSanitizado = motivo.trim().replace(/[<>\"'&]/g, '');

  const admin = await Administrador.findByPk(adminId);

  if (!admin) {
    throw new HttpError(404, 'Administrador no encontrado');
  }

  // Verificar que pueda ser rechazado
  if (!admin.EMAIL_VERIFICADO) {
    throw new HttpError(400, 'El administrador debe verificar su correo antes de ser rechazado');
  }

  if (admin.STATUS === 'pending' && (!admin.PASSWORD || admin.PASSWORD.trim().length === 0)) {
    throw new HttpError(400, 'El administrador debe registrar su contraseña antes de ser rechazado');
  }

  // Obtener fecha y hora actuales
  const now = new Date();
  const fechaBaja = now.toISOString().slice(0, 10).replace(/-/g, '');
  const horaBaja = now.toTimeString().slice(0, 8).replace(/:/g, '');

  admin.STATUS = 'rejected';
  admin.FEC_BAJA = fechaBaja;
  admin.HORA_BAJA = horaBaja;
  admin.CVE_USUARIO_BAJA = userId.toString();
  admin.DES_IP_BAJA = userIp;
  admin.DES_MOTIVO_BAJA = motivoSanitizado;

  await admin.save();
}

// Listar administradores con filtros
async function listAdmins({ page = 1, limit = 10, nombre, email, rolId, status }) {
  // Validar límites de paginación
  if (page < 1 || page > 1000) {
    throw new HttpError(400, 'Número de página inválido (1-1000)');
  }

  if (limit < 1 || limit > 100) {
    throw new HttpError(400, 'Límite inválido (1-100)');
  }

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filtro por nombre
  if (nombre) {
    const nombreTrim = nombre.toString().trim();
    if (nombreTrim.length > 150) {
      throw new HttpError(400, 'El filtro de nombre no puede exceder 150 caracteres');
    }
    const nombreSanitizado = nombreTrim.replace(/[%_]/g, '\\$&');
    whereClause.NOMBRE = {
      [Op.like]: `%${nombreSanitizado}%`
    };
  }

  // Filtro por email
  if (email) {
    const emailTrim = email.toString().trim();
    if (emailTrim.length > 150) {
      throw new HttpError(400, 'El filtro de email no puede exceder 150 caracteres');
    }
    if (emailTrim.includes('@') && !isValidEmail(emailTrim)) {
      throw new HttpError(400, 'Formato de email inválido en el filtro');
    }
    const emailSanitizado = emailTrim.replace(/[%_]/g, '\\$&');
    whereClause.EMAIL = {
      [Op.like]: `%${emailSanitizado}%`
    };
  }

  // Filtro por rol_id
  if (rolId) {
    const parsedRolId = parseInt(rolId);
    if (isNaN(parsedRolId) || ![1, 2, 3].includes(parsedRolId)) {
      throw new HttpError(400, 'Rol inválido. Debe ser 1 (Super Admin), 2 (Administrador) o 3 (Moderador)');
    }
    whereClause.ROL_ID = parsedRolId;
  }

  // Filtro por status
  if (status) {
    const statusTrim = status.toString().trim();
    const statusValidos = ['pending', 'approved', 'rejected'];
    if (!statusValidos.includes(statusTrim)) {
      throw new HttpError(400, 'Estado inválido. Debe ser pending, approved o rejected');
    }
    whereClause.STATUS = statusTrim;
  }

  const { count, rows: admins } = await Administrador.findAndCountAll({
    where: whereClause,
    attributes: ['NUM_ADMIN', 'NOMBRE', 'EMAIL', 'ROL_ID', 'STATUS', 'FEC_ALTA', 'EMAIL_VERIFICADO', 'PASSWORD'],
    order: [['FEC_ALTA', 'DESC']],
    limit,
    offset
  });

  const safeAdmins = admins.map((admin) => {
    const item = admin.toJSON ? admin.toJSON() : admin;
    return {
      NUM_ADMIN: item.NUM_ADMIN,
      NOMBRE: item.NOMBRE,
      EMAIL: item.EMAIL,
      ROL_ID: item.ROL_ID,
      STATUS: item.STATUS,
      FEC_ALTA: item.FEC_ALTA,
      EMAIL_VERIFICADO: Boolean(item.EMAIL_VERIFICADO),
      PASSWORD_REGISTRADO: Boolean(item.PASSWORD && String(item.PASSWORD).trim().length > 0),
    };
  });

  return {
    admins: safeAdmins,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
}

module.exports = {
  sendInvitation,
  registerFromInvitation,
  verifyEmailAdmin,
  approveAdmin,
  rejectAdmin,
  listAdmins,
};
