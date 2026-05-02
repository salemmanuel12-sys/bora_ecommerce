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

function parseDecimal(value) {
  const parsed = Number.parseFloat(String(value || ''));

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function parseNonNegativeInt(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
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

function validateProductoIdParam(req, _res, next) {
  const productoId = parsePositiveInt(req.params?.productoId, { min: 1 });

  if (!productoId) {
    return next(new HttpError(400, 'Id de producto invalido.'));
  }

  req.params.productoId = String(productoId);
  return next();
}

function validateCreateProducto(req, _res, next) {
  const subcategoriaId = parsePositiveInt(req.body?.subcategoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 150);
  const description = sanitizeText(req.body?.description || '', 2000) || null;
  const price = parseDecimal(req.body?.price);
  const stock = req.body?.stock === undefined ? 0 : parseNonNegativeInt(req.body?.stock);
  const sku = sanitizeText(req.body?.sku || '', 100);
  const status = parseOptionalStatus(req.body?.status);

  if (!subcategoriaId) {
    return next(new HttpError(400, 'subcategoriaId es obligatorio y debe ser valido.'));
  }

  if (!name) {
    return next(new HttpError(400, 'El nombre del producto es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre del producto debe tener al menos 2 caracteres.'));
  }

  if (price === null) {
    return next(new HttpError(400, 'El precio es obligatorio y debe ser un numero positivo o cero.'));
  }

  if (stock === null) {
    return next(new HttpError(400, 'El stock debe ser un entero no negativo.'));
  }

  if (!sku) {
    return next(new HttpError(400, 'El SKU es obligatorio.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.subcategoriaId = subcategoriaId;
  req.body.name = name;
  req.body.description = description;
  req.body.price = price;
  req.body.stock = stock;
  req.body.sku = sku;
  req.body.status = status === null ? true : status;

  return next();
}

function validateUpdateProducto(req, _res, next) {
  const subcategoriaId = req.body?.subcategoriaId === undefined
    ? null
    : parsePositiveInt(req.body?.subcategoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 150);
  const description = sanitizeText(req.body?.description || '', 2000) || null;
  const price = parseDecimal(req.body?.price);
  const stock = req.body?.stock === undefined ? null : parseNonNegativeInt(req.body?.stock);
  const sku = sanitizeText(req.body?.sku || '', 100);
  const status = parseOptionalStatus(req.body?.status);

  if (req.body?.subcategoriaId !== undefined && !subcategoriaId) {
    return next(new HttpError(400, 'subcategoriaId invalido.'));
  }

  if (!name) {
    return next(new HttpError(400, 'El nombre del producto es obligatorio.'));
  }

  if (name.length < 2) {
    return next(new HttpError(400, 'El nombre del producto debe tener al menos 2 caracteres.'));
  }

  if (price === null) {
    return next(new HttpError(400, 'El precio es obligatorio y debe ser un numero positivo o cero.'));
  }

  if (!sku) {
    return next(new HttpError(400, 'El SKU es obligatorio.'));
  }

  if (req.body?.stock !== undefined && stock === null) {
    return next(new HttpError(400, 'El stock debe ser un entero no negativo.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  if (subcategoriaId) {
    req.body.subcategoriaId = subcategoriaId;
  }

  req.body.name = name;
  req.body.description = description;
  req.body.price = price;
  req.body.sku = sku;

  if (stock !== null) {
    req.body.stock = stock;
  }

  if (status !== null) {
    req.body.status = status;
  }

  return next();
}

function validateProductoStatus(req, _res, next) {
  const productoId = parsePositiveInt(req.params?.productoId, { min: 1 });
  const status = parseOptionalStatus(req.body?.status);

  if (!productoId) {
    return next(new HttpError(400, 'Id de producto invalido.'));
  }

  if (status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.params.productoId = String(productoId);
  req.body.status = status;

  return next();
}

function validateListProductosQuery(req, _res, next) {
  const page = req.query?.page === undefined
    ? 1
    : parsePositiveInt(req.query?.page, { min: 1, max: 100000 });
  const limit = req.query?.limit === undefined
    ? 10
    : parsePositiveInt(req.query?.limit, { min: 1, max: 100 });
  const subcategoriaId = req.query?.subcategoriaId === undefined
    ? null
    : parsePositiveInt(req.query?.subcategoriaId, { min: 1 });
  const categoria = sanitizeText(req.query?.categoria || '', 120);
  const search = sanitizeText(req.query?.search || '', 150);
  const includeInactiveRaw = req.query?.include_inactive;

  if (page === null || limit === null) {
    return next(new HttpError(400, 'Paginacion invalida.'));
  }

  if (req.query?.subcategoriaId !== undefined && !subcategoriaId) {
    return next(new HttpError(400, 'subcategoriaId invalido.'));
  }

  if (includeInactiveRaw !== undefined) {
    const normalized = String(includeInactiveRaw).trim().toLowerCase();

    if (!['true', 'false', '1', '0'].includes(normalized)) {
      return next(new HttpError(400, 'include_inactive invalido. Usa true o false.'));
    }

    req.query.include_inactive = normalized;
  }

  req.query.page = page;
  req.query.limit = limit;
  req.query.categoria = categoria;
  req.query.search = search;

  if (subcategoriaId) {
    req.query.subcategoriaId = subcategoriaId;
  }

  return next();
}

module.exports = {
  validateProductoIdParam,
  validateCreateProducto,
  validateUpdateProducto,
  validateProductoStatus,
  validateListProductosQuery,
};
