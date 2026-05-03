const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

function getRequiredAccessSecret() {
  const value = process.env.JWT_ACCESS_SECRET;

  if (!value || value.length < 32) {
    throw new Error('La variable JWT_ACCESS_SECRET es obligatoria y debe tener al menos 32 caracteres.');
  }

  return value;
}

function adminAuthMiddleware(req, _res, next) {
  const accessSecret = getRequiredAccessSecret();
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Token de acceso requerido.');
    }

    const payload = jwt.verify(token, accessSecret, { algorithms: ['HS256'] });

    if (payload.type !== 'access') {
      throw new HttpError(401, 'Token de acceso invalido.');
    }

    req.admin = {
      id: Number(payload.sub),
      email: payload.email,
      rol: Number(payload.rol),
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Token expirado.'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new HttpError(401, 'Token invalido.'));
    }

    return next(error);
  }
}

module.exports = adminAuthMiddleware;
