const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SIX_DIGIT_CODE_REGEX = /^\d{6}$/;
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return email.length > 0 && email.length <= 160 && EMAIL_REGEX.test(email);
}

function isSafePassword(password, { minLength = 8 } = {}) {
  return (
    typeof password === 'string' &&
    password.length >= minLength &&
    password.length <= 72 &&
    !CONTROL_CHAR_REGEX.test(password)
  );
}

function isJwtToken(token) {
  return typeof token === 'string' && token.length <= 2048 && JWT_REGEX.test(token);
}

function isValidResetCode(code) {
  return SIX_DIGIT_CODE_REGEX.test(String(code || '').trim());
}

function sanitizeHeaderValue(value, maxLength) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(CONTROL_CHAR_REGEX, '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function sanitizeIpAddress(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(CONTROL_CHAR_REGEX, '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 45);
}

module.exports = {
  normalizeEmail,
  isValidEmail,
  isSafePassword,
  isJwtToken,
  isValidResetCode,
  sanitizeHeaderValue,
  sanitizeIpAddress,
};