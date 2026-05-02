const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

function getRequiredUserSecret() {
  const value = process.env.JWT_USER_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      'La variable JWT_USER_SECRET es obligatoria y debe tener al menos 32 caracteres.'
    );
  }

  return value;
}

const userSecret = getRequiredUserSecret();

/**
 * Middleware de autenticación para usuarios del ecommerce.
 * Verifica el Bearer token emitido al hacer login como usuario.
 * Establece req.usuario = { id, email, nombre }
 */
function usuarioAuthMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Token de acceso requerido.');
    }

    const payload = jwt.verify(token, userSecret, { algorithms: ['HS256'] });

    if (payload.type !== 'user_access') {
      throw new HttpError(401, 'Token de acceso inválido.');
    }

    req.usuario = {
      id: Number(payload.sub),
      email: payload.email,
      nombre: payload.nombre,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Token expirado.'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new HttpError(401, 'Token inválido.'));
    }

    return next(error);
  }
}

module.exports = usuarioAuthMiddleware;
