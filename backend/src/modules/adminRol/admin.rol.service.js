const { Op } = require('sequelize');
const { Rol, Administrador } = require('../../models');
const HttpError = require('../../utils/httpError');

const toAuditDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const toAuditTime = () => new Date().toTimeString().slice(0, 8).replace(/:/g, '');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function toPublicRole(role) {
  const item = role?.get ? role.get({ plain: true }) : role;

  return {
    ID_ROL: item.ID_ROL,
    UUID: item.UUID_ROL,
    NOMBRE: item.NOMBRE_ROL,
    DESCRIPCION: item.DESCRIPCION,
    ESTADO: Number(item.ESTADO),
    administradores: Array.isArray(item.administradores)
      ? item.administradores.map((a) => ({
          NUM_ADMIN: a.NUM_ADMIN,
          NOMBRE: a.NOMBRE,
          EMAIL: a.EMAIL,
          STATUS: a.STATUS,
          ESTADO: Number(a.ESTADO),
        }))
      : undefined,
  };
}

async function listRoles({ page = 1, limit = 10, estado = 1, search = '' } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = { ESTADO: Number.parseInt(String(estado), 10) === 0 ? 0 : 1 };

  if (search && String(search).trim()) {
    where.NOMBRE_ROL = { [Op.like]: `%${String(search).trim().slice(0, 100)}%` };
  }

  const { count, rows } = await Rol.findAndCountAll({
    where,
    attributes: ['ID_ROL', 'UUID_ROL', 'NOMBRE_ROL', 'DESCRIPCION', 'ESTADO'],
    order: [['ID_ROL', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    roles: rows.map(toPublicRole),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function getRoleById(roleId) {
  const parsedRoleId = Number.parseInt(roleId, 10);
  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    throw new HttpError(400, 'Id de rol invalido.');
  }

  const role = await Rol.findByPk(parsedRoleId, {
    include: [
      {
        model: Administrador,
        as: 'administradores',
        required: false,
        attributes: ['NUM_ADMIN', 'NOMBRE', 'EMAIL', 'STATUS', 'ESTADO'],
      },
    ],
  });
  if (!role) {
    throw new HttpError(404, 'Rol no encontrado.');
  }

  return toPublicRole(role);
}

async function createRole({ nombreRol, descripcion, userId, userIp }) {
  const cleanName = sanitizeText(nombreRol, 100);
  const cleanDescription = sanitizeText(descripcion, 255) || null;

  if (!cleanName) {
    throw new HttpError(400, 'El nombre del rol es obligatorio.');
  }

  const exists = await Rol.findOne({
    where: { NOMBRE_ROL: cleanName },
  });

  if (exists) {
    throw new HttpError(409, 'Ya existe un rol con ese nombre.');
  }

  const role = await Rol.create({
    NOMBRE_ROL: cleanName,
    DESCRIPCION: cleanDescription,
    ESTADO: 1,
    FEC_ALTA: toAuditDate(),
    HORA_ALTA: toAuditTime(),
    CVE_USUARIO_ALTA: String(userId || ''),
    DES_IP_ALTA: sanitizeText(userIp || '', 45) || null,
  });

  return toPublicRole(role);
}

async function updateRole({ roleId, nombreRol, descripcion, userId, userIp }) {
  const parsedRoleId = Number.parseInt(roleId, 10);
  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    throw new HttpError(400, 'Id de rol invalido.');
  }

  const cleanName = sanitizeText(nombreRol, 100);
  const cleanDescription = sanitizeText(descripcion, 255) || null;

  if (!cleanName) {
    throw new HttpError(400, 'El nombre del rol es obligatorio.');
  }

  const role = await Rol.findByPk(parsedRoleId);
  if (!role) {
    throw new HttpError(404, 'Rol no encontrado.');
  }

  const duplicate = await Rol.findOne({
    where: {
      NOMBRE_ROL: cleanName,
      ID_ROL: { [Op.ne]: parsedRoleId },
    },
  });

  if (duplicate) {
    throw new HttpError(409, 'Ya existe un rol con ese nombre.');
  }

  await role.update({
    NOMBRE_ROL: cleanName,
    DESCRIPCION: cleanDescription,
    FEC_ACTUALIZA: toAuditDate(),
    HORA_ACTUALIZA: toAuditTime(),
    CVE_USUARIO_ACTUALIZA: String(userId || ''),
    DES_IP_ACTUALIZA: sanitizeText(userIp || '', 45) || null,
  });

  return toPublicRole(role);
}

async function updateRoleStatus({ roleId, estado, motivo, userId, userIp }) {
  const parsedRoleId = Number.parseInt(roleId, 10);
  if (!Number.isInteger(parsedRoleId) || parsedRoleId <= 0) {
    throw new HttpError(400, 'Id de rol invalido.');
  }

  const parsedEstado = Number.parseInt(estado, 10);
  if (![0, 1].includes(parsedEstado)) {
    throw new HttpError(400, 'Estado invalido. Usa 1 (activo) o 0 (inactivo).');
  }

  const cleanMotivo = sanitizeText(motivo || '', 100) || null;

  const role = await Rol.findByPk(parsedRoleId);
  if (!role) {
    throw new HttpError(404, 'Rol no encontrado.');
  }

  const payload = {
    ESTADO: parsedEstado,
  };

  if (parsedEstado === 0) {
    payload.FEC_BAJA = toAuditDate();
    payload.HORA_BAJA = toAuditTime();
    payload.CVE_USUARIO_BAJA = String(userId || '');
    payload.DES_IP_BAJA = sanitizeText(userIp || '', 45) || null;
    payload.DES_MOTIVO_BAJA = cleanMotivo;
  } else {
    payload.FEC_REACTIVA = toAuditDate();
    payload.HORA_REACTIVA = toAuditTime();
    payload.CVE_USUARIO_REACTIVA = String(userId || '');
    payload.DES_IP_REACTIVA = sanitizeText(userIp || '', 45) || null;
    payload.DES_MOTIVO_REACTIVA = cleanMotivo;
  }

  await role.update(payload);

  return toPublicRole(role);
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  updateRoleStatus,
};
