const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parseCategoriaId(value) {
  const categoriaId = Number.parseInt(String(value || ''), 10);

  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    return null;
  }

  return categoriaId;
}

function parseOptionalStatus(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'activo', 'activa'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'inactivo', 'inactiva'].includes(normalized)) {
    return false;
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

function validateCategoriaIdParam(req, _res, next) {
  const categoriaId = parseCategoriaId(req.params?.categoriaId);

  if (!categoriaId) {
    return next(new HttpError(400, 'Id de categoria invalido.'));
  }

  req.params.categoriaId = String(categoriaId);
  return next();
}

function validateCreateCategoria(req, _res, next) {
  const name = sanitizeText(req.body?.name || '', 120);
  const description = sanitizeText(req.body?.description || '', 255) || null;
  const imageUrl = sanitizeText(req.body?.imageUrl || req.body?.image || '', 500) || null;
  const status = parseOptionalStatus(req.body?.status);

  if (!name) {
    return next(new HttpError(400, 'El nombre de la categoria es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre de la categoria debe tener al menos 2 caracteres.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.name = name;
  req.body.description = description;
  req.body.imageUrl = imageUrl;
  req.body.status = status === null ? true : status;

  return next();
}

function validateUpdateCategoria(req, _res, next) {
  const name = sanitizeText(req.body?.name || '', 120);
  const description = sanitizeText(req.body?.description || '', 255) || null;
  const imageUrl = sanitizeText(req.body?.imageUrl || req.body?.image || '', 500) || null;
  const status = parseOptionalStatus(req.body?.status);

  if (!name) {
    return next(new HttpError(400, 'El nombre de la categoria es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre de la categoria debe tener al menos 2 caracteres.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.name = name;
  req.body.description = description;

  if (imageUrl !== null || req.body?.imageUrl !== undefined || req.body?.image !== undefined) {
    req.body.imageUrl = imageUrl;
  }

  if (status !== null) {
    req.body.status = status;
  }

  return next();
}

function validateCategoriaStatus(req, _res, next) {
  const categoriaId = parseCategoriaId(req.params?.categoriaId);
  const status = parseOptionalStatus(req.body?.status);

  if (!categoriaId) {
    return next(new HttpError(400, 'Id de categoria invalido.'));
  }

  if (status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.params.categoriaId = String(categoriaId);
  req.body.status = status;

  return next();
}

function validateListCategoriasQuery(req, _res, next) {
  const page = req.query?.page === undefined
    ? 1
    : parsePositiveInt(req.query?.page, { min: 1, max: 100000 });
  const limit = req.query?.limit === undefined
    ? 10
    : parsePositiveInt(req.query?.limit, { min: 1, max: 100 });
  const search = sanitizeText(req.query?.search || '', 120);
  const raw = req.query?.include_inactive;

  if (page === null || limit === null) {
    return next(new HttpError(400, 'Paginacion invalida.'));
  }

  req.query.page = page;
  req.query.limit = limit;
  req.query.search = search;

  if (raw === undefined) {
    return next();
  }

  const normalized = String(raw).trim().toLowerCase();

  if (!['true', 'false', '1', '0'].includes(normalized)) {
    return next(new HttpError(400, 'include_inactive invalido. Usa true o false.'));
  }

  req.query.include_inactive = normalized;
  return next();
}

module.exports = {
  validateCategoriaIdParam,
  validateCreateCategoria,
  validateUpdateCategoria,
  validateCategoriaStatus,
  validateListCategoriasQuery,
};
