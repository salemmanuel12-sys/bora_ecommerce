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

function parseOptionalUrl(value = '', maxLength = 500) {
  const clean = sanitizeText(value || '', maxLength);
  if (!clean) {
    return null;
  }

  if (clean.startsWith('/') || /^https?:\/\//i.test(clean)) {
    return clean;
  }

  return null;
}

function validateBannerIdParam(req, _res, next) {
  const bannerId = parsePositiveInt(req.params?.bannerId, { min: 1 });

  if (!bannerId) {
    return next(new HttpError(400, 'Id de banner invalido.'));
  }

  req.params.bannerId = String(bannerId);
  return next();
}

function validateCreateBanner(req, _res, next) {
  const title = sanitizeText(req.body?.title || '', 140);
  const description = sanitizeText(req.body?.description || '', 280) || null;
  const ctaText = sanitizeText(req.body?.ctaText || '', 80) || null;
  const ctaLink = parseOptionalUrl(req.body?.ctaLink, 500);
  const orden = req.body?.orden === undefined ? 0 : parsePositiveInt(req.body?.orden, { min: 0, max: 9999 });
  const status = parseOptionalStatus(req.body?.status);

  if (!title) {
    return next(new HttpError(400, 'El titulo del banner es obligatorio.'));
  }

  if (req.body?.ctaLink !== undefined && req.body?.ctaLink !== '' && !ctaLink) {
    return next(new HttpError(400, 'ctaLink invalido. Usa URL absoluta o ruta interna que inicie con /.'));
  }

  if (orden === null) {
    return next(new HttpError(400, 'Orden invalido. Debe ser un entero no negativo.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.title = title;
  req.body.description = description;
  req.body.ctaText = ctaText;
  req.body.ctaLink = ctaLink;
  req.body.orden = orden;
  req.body.status = status === null ? true : status;

  return next();
}

function validateUpdateBanner(req, _res, next) {
  const title = sanitizeText(req.body?.title || '', 140);
  const description = sanitizeText(req.body?.description || '', 280) || null;
  const ctaText = sanitizeText(req.body?.ctaText || '', 80) || null;
  const ctaLink = parseOptionalUrl(req.body?.ctaLink, 500);
  const orden = req.body?.orden === undefined ? null : parsePositiveInt(req.body?.orden, { min: 0, max: 9999 });
  const status = parseOptionalStatus(req.body?.status);

  if (!title) {
    return next(new HttpError(400, 'El titulo del banner es obligatorio.'));
  }

  if (req.body?.ctaLink !== undefined && req.body?.ctaLink !== '' && !ctaLink) {
    return next(new HttpError(400, 'ctaLink invalido. Usa URL absoluta o ruta interna que inicie con /.'));
  }

  if (req.body?.orden !== undefined && orden === null) {
    return next(new HttpError(400, 'Orden invalido. Debe ser un entero no negativo.'));
  }

  if (req.body?.status !== undefined && status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.body.title = title;
  req.body.description = description;
  req.body.ctaText = ctaText;
  req.body.ctaLink = ctaLink;

  if (orden !== null) {
    req.body.orden = orden;
  }

  if (status !== null) {
    req.body.status = status;
  }

  return next();
}

function validateBannerStatus(req, _res, next) {
  const bannerId = parsePositiveInt(req.params?.bannerId, { min: 1 });
  const status = parseOptionalStatus(req.body?.status);

  if (!bannerId) {
    return next(new HttpError(400, 'Id de banner invalido.'));
  }

  if (status === null) {
    return next(new HttpError(400, 'Status invalido. Usa true/false.'));
  }

  req.params.bannerId = String(bannerId);
  req.body.status = status;

  return next();
}

function validateListBannersQuery(req, _res, next) {
  const page = req.query?.page === undefined
    ? 1
    : parsePositiveInt(req.query?.page, { min: 1, max: 100000 });
  const limit = req.query?.limit === undefined
    ? 10
    : parsePositiveInt(req.query?.limit, { min: 1, max: 100 });
  const search = sanitizeText(req.query?.search || '', 140);
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
  validateBannerIdParam,
  validateCreateBanner,
  validateUpdateBanner,
  validateBannerStatus,
  validateListBannersQuery,
};
