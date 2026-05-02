const HttpError = require('../utils/httpError');
const {
  normalizeEmail,
  isValidEmail,
  isSafePassword,
  isJwtToken,
  isValidResetCode,
} = require('../utils/adminAuth.validation');

function validateLogin(req, _res, next) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!isValidEmail(email) || !isSafePassword(password, { minLength: 1 })) {
    return next(new HttpError(400, 'Credenciales invalidas.'));
  }

  req.body.email = email;
  return next();
}

function validateRefreshToken(req, _res, next) {
  const refreshToken = String(req.body?.refreshToken || '').trim();

  if (!isJwtToken(refreshToken)) {
    return next(new HttpError(400, 'Refresh token invalido.'));
  }

  req.body.refreshToken = refreshToken;
  return next();
}

function validateRequestReset(req, _res, next) {
  const email = normalizeEmail(req.body?.email);

  if (!isValidEmail(email)) {
    return next(new HttpError(400, 'Correo invalido.'));
  }

  req.body.email = email;
  return next();
}

function validateVerifyResetCode(req, _res, next) {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || '').trim();

  if (!isValidEmail(email) || !isValidResetCode(code)) {
    return next(new HttpError(400, 'Datos invalidos.'));
  }

  req.body.email = email;
  req.body.code = code;
  return next();
}

function validateResetPassword(req, _res, next) {
  const resetToken = String(req.body?.resetToken || '').trim();
  const newPassword = req.body?.newPassword;

  if (!isJwtToken(resetToken)) {
    return next(new HttpError(400, 'Token de reset invalido.'));
  }

  if (!isSafePassword(newPassword)) {
    return next(new HttpError(400, 'La contrasena debe tener entre 8 y 72 caracteres sin caracteres de control.'));
  }

  req.body.resetToken = resetToken;
  return next();
}

function validateChangePassword(req, _res, next) {
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;

  if (!isSafePassword(currentPassword, { minLength: 1 })) {
    return next(new HttpError(400, 'La contrasena actual es invalida.'));
  }

  if (!isSafePassword(newPassword)) {
    return next(new HttpError(400, 'La nueva contrasena debe tener entre 8 y 72 caracteres sin caracteres de control.'));
  }

  return next();
}

module.exports = {
  validateLogin,
  validateRefreshToken,
  validateRequestReset,
  validateVerifyResetCode,
  validateResetPassword,
  validateChangePassword,
};