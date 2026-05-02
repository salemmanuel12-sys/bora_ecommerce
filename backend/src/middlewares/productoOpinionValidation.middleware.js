const HttpError = require('../utils/httpError');

function parsePositiveInt(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value || ''), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function validateProductoOpinionProductoIdParam(req, _res, next) {
  const productoId = parsePositiveInt(req.params?.productoId, { min: 1 });

  if (!productoId) {
    return next(new HttpError(400, 'Id de producto invalido.'));
  }

  req.params.productoId = String(productoId);
  return next();
}

function validateProductoOpinionIdParam(req, _res, next) {
  const opinionId = parsePositiveInt(req.params?.opinionId, { min: 1 });

  if (!opinionId) {
    return next(new HttpError(400, 'Id de opinion invalido.'));
  }

  req.params.opinionId = String(opinionId);
  return next();
}

function validateProductoOpinionBody(req, _res, next) {
  const rating = parsePositiveInt(req.body?.rating, { min: 1, max: 5 });
  const title = sanitizeText(req.body?.title || '', 150) || null;
  const comment = sanitizeText(req.body?.comment || '', 2000) || null;

  if (!rating) {
    return next(new HttpError(400, 'El rating es obligatorio y debe estar entre 1 y 5.'));
  }

  if (!comment && !title) {
    return next(new HttpError(400, 'Debes enviar al menos un titulo o comentario.'));
  }

  req.body.rating = rating;
  req.body.title = title;
  req.body.comment = comment;

  return next();
}

function validateProductoOpinionStatusBody(req, _res, next) {
  const allowedStatus = ['Pendiente', 'Aprobada', 'Rechazada'];
  const status = sanitizeText(req.body?.status || '', 20);

  if (!allowedStatus.includes(status)) {
    return next(new HttpError(400, 'Status invalido. Usa Pendiente, Aprobada o Rechazada.'));
  }

  req.body.status = status;
  return next();
}

module.exports = {
  validateProductoOpinionProductoIdParam,
  validateProductoOpinionIdParam,
  validateProductoOpinionBody,
  validateProductoOpinionStatusBody,
};
