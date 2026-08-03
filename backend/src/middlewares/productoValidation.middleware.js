const HttpError = require('../utils/httpError');
const { normalizeDescuentosMayoreoInput } = require('../utils/productoDescuento.utils');

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

function parseNullableDecimal(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return parseDecimal(value);
}

function parseAtributos(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  const rawValue = typeof value === 'string' ? value.trim() : value;
  let parsed = rawValue;

  if (typeof rawValue === 'string') {
    try {
      parsed = JSON.parse(rawValue);
    } catch (_error) {
      return null;
    }
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const normalized = [];
  const seen = new Set();

  for (const item of parsed) {
    const nombre = sanitizeText(item?.nombre ?? item?.name ?? '', 80);
    const valor = sanitizeText(item?.valor ?? item?.value ?? '', 120);

    if (!nombre && !valor) {
      continue;
    }

    if (!nombre || !valor) {
      return null;
    }

    const key = `${nombre.toLowerCase()}::${valor.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({ nombre, valor });
  }

  return normalized;
}

function parseDescuentosMayoreo(value) {
  if (value === undefined) {
    return [];
  }

  return normalizeDescuentosMayoreoInput(value);
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
  const categoriaId = parsePositiveInt(req.body?.categoriaId ?? req.body?.subcategoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 150);
  const description = sanitizeText(req.body?.description || '', 2000) || null;
  const price = parseDecimal(req.body?.price);
  const stock = req.body?.stock === undefined ? 0 : parseNonNegativeInt(req.body?.stock);
  const peso = parseNullableDecimal(req.body?.peso);
  const alto = parseNullableDecimal(req.body?.alto);
  const ancho = parseNullableDecimal(req.body?.ancho);
  const largo = parseNullableDecimal(req.body?.largo);
  const sku = sanitizeText(req.body?.sku || '', 100);
  const status = parseOptionalStatus(req.body?.status);
  const atributos = parseAtributos(req.body?.atributos);
  const descuentosMayoreo = parseDescuentosMayoreo(req.body?.descuentosMayoreo);

  if (!categoriaId) {
    return next(new HttpError(400, 'categoriaId es obligatorio y debe ser valido.'));
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

  if (peso === null && req.body?.peso !== undefined && req.body?.peso !== null && req.body?.peso !== '') {
    return next(new HttpError(400, 'El peso debe ser un numero positivo o cero.'));
  }

  if (alto === null && req.body?.alto !== undefined && req.body?.alto !== null && req.body?.alto !== '') {
    return next(new HttpError(400, 'El alto debe ser un numero positivo o cero.'));
  }

  if (ancho === null && req.body?.ancho !== undefined && req.body?.ancho !== null && req.body?.ancho !== '') {
    return next(new HttpError(400, 'El ancho debe ser un numero positivo o cero.'));
  }

  if (largo === null && req.body?.largo !== undefined && req.body?.largo !== null && req.body?.largo !== '') {
    return next(new HttpError(400, 'El largo debe ser un numero positivo o cero.'));
  }

  if (!sku) {
    return next(new HttpError(400, 'El SKU es obligatorio.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  if (atributos === null) {
    return next(new HttpError(400, 'atributos invalido. Usa un arreglo de { nombre, valor }.'));
  }

  if (descuentosMayoreo === null) {
    return next(new HttpError(400, 'descuentosMayoreo invalido. Usa rangos sin traslape con cantidadMin, cantidadMax, tipoDescuento y valor.'));
  }

  req.body.categoriaId = categoriaId;
  req.body.name = name;
  req.body.description = description;
  req.body.price = price;
  req.body.stock = stock;
  req.body.peso = peso;
  req.body.alto = alto;
  req.body.ancho = ancho;
  req.body.largo = largo;
  req.body.sku = sku;
  req.body.status = status === null ? true : status;
  req.body.atributos = atributos;
  req.body.descuentosMayoreo = descuentosMayoreo;

  return next();
}

function validateUpdateProducto(req, _res, next) {
  const categoriaId = req.body?.categoriaId === undefined && req.body?.subcategoriaId === undefined
    ? null
    : parsePositiveInt(req.body?.categoriaId ?? req.body?.subcategoriaId, { min: 1 });
  const name = sanitizeText(req.body?.name || '', 150);
  const description = sanitizeText(req.body?.description || '', 2000) || null;
  const price = parseDecimal(req.body?.price);
  const stock = req.body?.stock === undefined ? null : parseNonNegativeInt(req.body?.stock);
  const peso = req.body?.peso === undefined ? undefined : parseNullableDecimal(req.body?.peso);
  const alto = req.body?.alto === undefined ? undefined : parseNullableDecimal(req.body?.alto);
  const ancho = req.body?.ancho === undefined ? undefined : parseNullableDecimal(req.body?.ancho);
  const largo = req.body?.largo === undefined ? undefined : parseNullableDecimal(req.body?.largo);
  const sku = sanitizeText(req.body?.sku || '', 100);
  const status = parseOptionalStatus(req.body?.status);
  const atributos = parseAtributos(req.body?.atributos);
  const descuentosMayoreo = req.body?.descuentosMayoreo === undefined
    ? undefined
    : parseDescuentosMayoreo(req.body?.descuentosMayoreo);

  if ((req.body?.categoriaId !== undefined || req.body?.subcategoriaId !== undefined) && !categoriaId) {
    return next(new HttpError(400, 'categoriaId invalido.'));
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

  if (req.body?.peso !== undefined && peso === null && req.body?.peso !== null && req.body?.peso !== '') {
    return next(new HttpError(400, 'El peso debe ser un numero positivo o cero.'));
  }

  if (req.body?.alto !== undefined && alto === null && req.body?.alto !== null && req.body?.alto !== '') {
    return next(new HttpError(400, 'El alto debe ser un numero positivo o cero.'));
  }

  if (req.body?.ancho !== undefined && ancho === null && req.body?.ancho !== null && req.body?.ancho !== '') {
    return next(new HttpError(400, 'El ancho debe ser un numero positivo o cero.'));
  }

  if (req.body?.largo !== undefined && largo === null && req.body?.largo !== null && req.body?.largo !== '') {
    return next(new HttpError(400, 'El largo debe ser un numero positivo o cero.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  if (atributos === null) {
    return next(new HttpError(400, 'atributos invalido. Usa un arreglo de { nombre, valor }.'));
  }

  if (descuentosMayoreo === null) {
    return next(new HttpError(400, 'descuentosMayoreo invalido. Usa rangos sin traslape con cantidadMin, cantidadMax, tipoDescuento y valor.'));
  }

  if (categoriaId) {
    req.body.categoriaId = categoriaId;
  }

  req.body.name = name;
  req.body.description = description;
  req.body.price = price;
  req.body.sku = sku;

  if (stock !== null) {
    req.body.stock = stock;
  }

  if (peso !== undefined) {
    req.body.peso = peso;
  }

  if (alto !== undefined) {
    req.body.alto = alto;
  }

  if (ancho !== undefined) {
    req.body.ancho = ancho;
  }

  if (largo !== undefined) {
    req.body.largo = largo;
  }

  if (status !== null) {
    req.body.status = status;
  }

  req.body.atributos = atributos;

  if (descuentosMayoreo !== undefined) {
    req.body.descuentosMayoreo = descuentosMayoreo;
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
  const categoriaId = req.query?.categoriaId === undefined && req.query?.subcategoriaId === undefined
    ? null
    : parsePositiveInt(req.query?.categoriaId ?? req.query?.subcategoriaId, { min: 1 });
  const categoria = sanitizeText(req.query?.categoria || '', 120);
  const search = sanitizeText(req.query?.search || '', 150);
  const includeInactiveRaw = req.query?.include_inactive;

  if (page === null || limit === null) {
    return next(new HttpError(400, 'Paginacion invalida.'));
  }

  if ((req.query?.categoriaId !== undefined || req.query?.subcategoriaId !== undefined) && !categoriaId) {
    return next(new HttpError(400, 'categoriaId invalido.'));
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

  if (categoriaId) {
    req.query.categoriaId = categoriaId;
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
