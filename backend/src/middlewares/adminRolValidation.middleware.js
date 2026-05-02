const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parseRoleId(value) {
  const roleId = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return null;
  }
  return roleId;
}

function validateRoleIdParam(req, _res, next) {
  const roleId = parseRoleId(req.params?.roleId);

  if (!roleId) {
    return next(new HttpError(400, 'Id de rol invalido.'));
  }

  req.params.roleId = String(roleId);
  return next();
}

function validateCreateRole(req, _res, next) {
  const rawNombre = req.body?.NOMBRE || req.body?.nombreRol || '';
  const rawDesc = req.body?.DESCRIPCION || req.body?.descripcion || '';
  const nombreRol = sanitizeText(rawNombre, 100);
  const descripcion = sanitizeText(rawDesc, 255) || null;

  if (!nombreRol) {
    return next(new HttpError(400, 'El nombre del rol es obligatorio.'));
  }

  if (nombreRol.length < 2) {
    return next(new HttpError(400, 'El nombre del rol debe tener al menos 2 caracteres.'));
  }

  req.body.nombreRol = nombreRol;
  req.body.descripcion = descripcion;

  return next();
}

function validateUpdateRole(req, _res, next) {
  return validateCreateRole(req, _res, next);
}

function validateRoleStatus(req, _res, next) {
  const roleId = parseRoleId(req.params?.roleId);
  if (!roleId) {
    return next(new HttpError(400, 'Id de rol invalido.'));
  }

  const estadoRaw = req.body?.estado;
  const estado = Number.parseInt(String(estadoRaw), 10);

  if (![0, 1].includes(estado)) {
    return next(new HttpError(400, 'Estado invalido. Usa 1 (activo) o 0 (inactivo).'));
  }

  const motivo = sanitizeText(req.body?.motivo || '', 100) || null;

  req.params.roleId = String(roleId);
  req.body.estado = estado;
  req.body.motivo = motivo;

  return next();
}

function validateListRolesQuery(req, _res, next) {
  const raw = req.query?.include_inactive;

  if (raw === undefined) {
    return next();
  }

  const clean = String(raw).trim().toLowerCase();
  const allowed = ['true', 'false', '1', '0'];

  if (!allowed.includes(clean)) {
    return next(new HttpError(400, 'include_inactive invalido. Usa true o false.'));
  }

  req.query.include_inactive = clean;
  return next();
}

module.exports = {
  validateRoleIdParam,
  validateCreateRole,
  validateUpdateRole,
  validateRoleStatus,
  validateListRolesQuery,
};
