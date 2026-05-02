const HttpError = require('../utils/httpError');

function sanitizeHeaderValue(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function sanitizeIpAddress(value = '') {
  return sanitizeHeaderValue(value, 45);
}

function usuarioMiddleware(req, _res, next) {
  try {
    req.usuarioRequest = {
      ipAddress: sanitizeIpAddress(req.ip),
      userAgent: sanitizeHeaderValue(req.get('user-agent'), 255),
    };

    return next();
  } catch (_error) {
    return next(new HttpError(400, 'Solicitud de usuario invalida.'));
  }
}

module.exports = usuarioMiddleware;
