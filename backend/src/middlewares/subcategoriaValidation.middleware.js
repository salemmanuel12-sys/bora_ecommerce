const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parsePositiveInt(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
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

function validateSubcategoriaIdParam(req, _res, next) {
  const subcategoriaId = parsePositiveInt(req.params?.subcategoriaId, { min: 1 });

  if (!subcategoriaId) {
    return next(new HttpError(400, 'Id de subcategoria invalido.'));
  }

  req.params.subcategoriaId = String(subcategoriaId);
  return next();
}

function validateCreateSubcategoria(req, _res, next) {
  const categoriaId = parsePositiveInt(req.body?.categoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 120);
  const description = sanitizeText(req.body?.description || '', 255) || null;
  const status = parseOptionalStatus(req.body?.status);

  if (!categoriaId) {
    return next(new HttpError(400, 'categoriaId es obligatorio y debe ser valido.'));
  }

  if (!name) {
    return next(new HttpError(400, 'El nombre de la subcategoria es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre de la subcategoria debe tener al menos 2 caracteres.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.categoriaId = categoriaId;
  req.body.name = name;
  req.body.description = description;
  req.body.status = status === null ? true : status;

  return next();
}

function validateUpdateSubcategoria(req, _res, next) {
  const categoriaId = req.body?.categoriaId === undefined
    ? null
    : parsePositiveInt(req.body?.categoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 120);
  const description = sanitizeText(req.body?.description || '', 255) || null;
  const status = parseOptionalStatus(req.body?.status);

  if (!name) {
    return next(new HttpError(400, 'El nombre de la subcategoria es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre de la subcategoria debe tener al menos 2 caracteres.'));
  }

  if (req.body?.categoriaId !== undefined && !categoriaId) {
    return next(new HttpError(400, 'categoriaId invalido.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  if (categoriaId) {
    req.body.categoriaId = categoriaId;
  }

  req.body.name = name;
  req.body.description = description;

  if (status !== null) {
    req.body.status = status;
  }

  return next();
}

function validateSubcategoriaStatus(req, _res, next) {
  const subcategoriaId = parsePositiveInt(req.params?.subcategoriaId, { min: 1 });
  const status = parseOptionalStatus(req.body?.status);

  if (!subcategoriaId) {
    return next(new HttpError(400, 'Id de subcategoria invalido.'));
  }

  if (status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.params.subcategoriaId = String(subcategoriaId);
  req.body.status = status;

  return next();
}

function validateListSubcategoriasQuery(req, _res, next) {
  const page = req.query?.page === undefined
    ? 1
    : parsePositiveInt(req.query?.page, { min: 1, max: 100000 });
  const limit = req.query?.limit === undefined
    ? 10
    : parsePositiveInt(req.query?.limit, { min: 1, max: 100 });
  const categoriaId = req.query?.categoriaId === undefined
    ? null
    : parsePositiveInt(req.query?.categoriaId, { min: 1 });
  const search = sanitizeText(req.query?.search || '', 120);
  const includeInactiveRaw = req.query?.include_inactive;

  if (page === null || limit === null) {
    return next(new HttpError(400, 'Paginacion invalida.'));
  }

  if (req.query?.categoriaId !== undefined && !categoriaId) {
    return next(new HttpError(400, 'categoriaId invalido.'));
  }

  if (includeInactiveRaw !== undefined) {
    const includeInactive = String(includeInactiveRaw).trim().toLowerCase();

    if (!['true', 'false', '1', '0'].includes(includeInactive)) {
      return next(new HttpError(400, 'include_inactive invalido. Usa true o false.'));
    }

    req.query.include_inactive = includeInactive;
  }

  req.query.page = page;
  req.query.limit = limit;
  req.query.search = search;

  if (categoriaId) {
    req.query.categoriaId = categoriaId;
  }

  return next();
}

module.exports = {
  validateSubcategoriaIdParam,
  validateCreateSubcategoria,
  validateUpdateSubcategoria,
  validateSubcategoriaStatus,
  validateListSubcategoriasQuery,
};
