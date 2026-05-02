const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 120) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parsePositiveInt(value, fallback, { min = 1, max = 100 } = {}) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function parseOptionalStatus(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['activo', 'activa', 'active', '1', 'true'].includes(normalized)) {
    return 'activo';
  }

  if (['inactivo', 'inactiva', 'inactive', '0', 'false'].includes(normalized)) {
    return 'inactivo';
  }

  return null;
}

function parsePositiveInt(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function validateListUsuariosQuery(req, _res, next) {
  const page = parsePositiveInt(req.query?.page, 1, { min: 1, max: 100000 });
  const limit = parsePositiveInt(req.query?.limit, 10, { min: 1, max: 100 });
  const search = sanitizeText(req.query?.search || '', 120);
  const status = parseOptionalStatus(req.query?.status);

  if (page === null || limit === null) {
    return next(new HttpError(400, 'Paginacion invalida.'));
  }

  if (req.query?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa activo o inactivo.'));
  }

  req.query.page = page;
  req.query.limit = limit;
  req.query.search = search;
  req.query.status = status;

  return next();
}

function validateUsuarioIdParam(req, _res, next) {
  const userId = parsePositiveInt(req.params?.userId, { min: 1 });

  if (!userId) {
    return next(new HttpError(400, 'Id de usuario invalido.'));
  }

  req.params.userId = String(userId);
  return next();
}

function validateUsuarioStatusBody(req, _res, next) {
  const status = parseOptionalStatus(req.body?.status);

  if (!status) {
    return next(new HttpError(400, 'Status invalido. Usa activo o inactivo.'));
  }

  req.body.status = status;
  return next();
}

module.exports = {
  validateListUsuariosQuery,
  validateUsuarioIdParam,
  validateUsuarioStatusBody,
};
