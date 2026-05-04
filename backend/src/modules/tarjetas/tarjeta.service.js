const crypto = require('crypto');
const { Tarjeta } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

let cachedKey = null;

function getEncryptionKey() {
  if (cachedKey) return cachedKey;

  const raw = String(process.env.CARD_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    throw new HttpError(500, 'CARD_ENCRYPTION_KEY no esta configurada.');
  }

  if (/^[a-fA-F0-9]{64}$/.test(raw)) {
    cachedKey = Buffer.from(raw, 'hex');
    return cachedKey;
  }

  try {
    const fromB64 = Buffer.from(raw, 'base64');
    if (fromB64.length === 32) {
      cachedKey = fromB64;
      return cachedKey;
    }
  } catch (_error) {
    // ignore and continue
  }

  const utf8 = Buffer.from(raw, 'utf8');
  if (utf8.length === 32) {
    cachedKey = utf8;
    return cachedKey;
  }

  throw new HttpError(
    500,
    'CARD_ENCRYPTION_KEY invalida. Usa 32 bytes (utf8), 64 hex o base64 equivalente.'
  );
}

function sanitizeText(value = '', max = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, max);
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function normalizeYear(value) {
  const yearRaw = Number.parseInt(String(value), 10);
  if (!Number.isFinite(yearRaw)) return NaN;
  if (yearRaw < 100) return 2000 + yearRaw;
  return yearRaw;
}

function validateExpiry(expMonth, expYear) {
  const month = Number.parseInt(String(expMonth), 10);
  const year = normalizeYear(expYear);

  if (!Number.isFinite(month) || month < 1 || month > 12) {
    throw new HttpError(400, 'Mes de expiracion invalido.');
  }

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    throw new HttpError(400, 'Anio de expiracion invalido.');
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    throw new HttpError(400, 'La tarjeta ya expiro.');
  }

  return { month, year };
}

function detectBrand(cardNumber) {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(cardNumber)) return 'visa';
  if (/^(5[1-5]\d{14}|2[2-7]\d{14})$/.test(cardNumber)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(cardNumber)) return 'amex';
  if (/^6(?:011|5\d{2})\d{12}$/.test(cardNumber)) return 'discover';
  return 'other';
}

function encryptSensitive(value) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    data: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

function cardFingerprint(cardNumber, expMonth, expYear) {
  return crypto
    .createHash('sha256')
    .update(`${cardNumber}|${expMonth}|${expYear}`)
    .digest('hex');
}

function toPublic(tarjeta) {
  const raw = tarjeta?.get ? tarjeta.get({ plain: true }) : tarjeta;
  return {
    id: raw.id,
    userId: raw.userId,
    holderName: raw.holderName,
    brand: raw.brand,
    last4: raw.last4,
    expMonth: raw.expMonth,
    expYear: raw.expYear,
    isDefault: Boolean(raw.isDefault),
    createdAt: raw.createdAt,
  };
}

function validateCardPayload(body = {}) {
  const holderName = sanitizeText(body.holderName, 120);
  const cardNumber = onlyDigits(body.cardNumber);
  const cvv = onlyDigits(body.cvv);

  if (!holderName) throw new HttpError(400, 'Nombre del titular requerido.');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    throw new HttpError(400, 'Numero de tarjeta invalido.');
  }
  if (cvv.length < 3 || cvv.length > 4) {
    throw new HttpError(400, 'CVV invalido.');
  }

  const { month, year } = validateExpiry(body.expMonth, body.expYear);

  return {
    holderName,
    cardNumber,
    cvv,
    expMonth: month,
    expYear: year,
    isDefault: Boolean(body.isDefault),
  };
}

async function listTarjetas(userId) {
  const rows = await Tarjeta.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  return rows.map(toPublic);
}

async function createTarjeta(userId, body) {
  const validated = validateCardPayload(body);
  const fingerprintHash = cardFingerprint(validated.cardNumber, validated.expMonth, validated.expYear);

  const existing = await Tarjeta.findOne({ where: { userId, fingerprintHash } });
  if (existing) {
    throw new HttpError(409, 'Esta tarjeta ya se encuentra registrada.');
  }

  const panEncrypted = encryptSensitive(validated.cardNumber);
  const cvvEncrypted = encryptSensitive(validated.cvv);

  const count = await Tarjeta.count({ where: { userId } });
  const shouldDefault = validated.isDefault || count === 0;

  if (shouldDefault) {
    await Tarjeta.update({ isDefault: false }, { where: { userId } });
  }

  const created = await Tarjeta.create({
    userId,
    holderName: validated.holderName,
    brand: detectBrand(validated.cardNumber),
    last4: validated.cardNumber.slice(-4),
    expMonth: validated.expMonth,
    expYear: validated.expYear,
    fingerprintHash,
    encryptedPan: panEncrypted.data,
    panIv: panEncrypted.iv,
    panAuthTag: panEncrypted.authTag,
    encryptedCvv: cvvEncrypted.data,
    cvvIv: cvvEncrypted.iv,
    cvvAuthTag: cvvEncrypted.authTag,
    isDefault: shouldDefault,
  });

  return toPublic(created);
}

async function updateTarjeta(userId, tarjetaId, body) {
  const tarjeta = await Tarjeta.findOne({ where: { id: tarjetaId, userId } });
  if (!tarjeta) throw new HttpError(404, 'Tarjeta no encontrada.');

  const updates = {};

  if (body.holderName !== undefined) {
    const holderName = sanitizeText(body.holderName, 120);
    if (!holderName) throw new HttpError(400, 'Nombre del titular invalido.');
    updates.holderName = holderName;
  }

  if (body.expMonth !== undefined || body.expYear !== undefined) {
    const month = body.expMonth !== undefined ? body.expMonth : tarjeta.expMonth;
    const year = body.expYear !== undefined ? body.expYear : tarjeta.expYear;
    const normalized = validateExpiry(month, year);
    updates.expMonth = normalized.month;
    updates.expYear = normalized.year;
  }

  if (body.cardNumber !== undefined || body.cvv !== undefined) {
    const cardNumber = body.cardNumber !== undefined ? onlyDigits(body.cardNumber) : null;
    const cvv = body.cvv !== undefined ? onlyDigits(body.cvv) : null;

    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      throw new HttpError(400, 'Numero de tarjeta invalido.');
    }
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      throw new HttpError(400, 'CVV invalido.');
    }

    const month = updates.expMonth || tarjeta.expMonth;
    const year = updates.expYear || tarjeta.expYear;
    const fingerprintHash = cardFingerprint(cardNumber, month, year);

    const duplicate = await Tarjeta.findOne({ where: { userId, fingerprintHash } });
    if (duplicate && duplicate.id !== tarjeta.id) {
      throw new HttpError(409, 'Esta tarjeta ya se encuentra registrada.');
    }

    const panEncrypted = encryptSensitive(cardNumber);
    const cvvEncrypted = encryptSensitive(cvv);

    updates.brand = detectBrand(cardNumber);
    updates.last4 = cardNumber.slice(-4);
    updates.fingerprintHash = fingerprintHash;
    updates.encryptedPan = panEncrypted.data;
    updates.panIv = panEncrypted.iv;
    updates.panAuthTag = panEncrypted.authTag;
    updates.encryptedCvv = cvvEncrypted.data;
    updates.cvvIv = cvvEncrypted.iv;
    updates.cvvAuthTag = cvvEncrypted.authTag;
  }

  if (body.isDefault !== undefined) {
    const isDefault = Boolean(body.isDefault);
    if (isDefault) {
      await Tarjeta.update({ isDefault: false }, { where: { userId } });
    }
    updates.isDefault = isDefault;
  }

  await tarjeta.update(updates);
  return toPublic(tarjeta);
}

async function deleteTarjeta(userId, tarjetaId) {
  const tarjeta = await Tarjeta.findOne({ where: { id: tarjetaId, userId } });
  if (!tarjeta) throw new HttpError(404, 'Tarjeta no encontrada.');

  const wasDefault = Boolean(tarjeta.isDefault);
  await tarjeta.destroy();

  if (wasDefault) {
    const next = await Tarjeta.findOne({ where: { userId }, order: [['createdAt', 'DESC']] });
    if (next) {
      await next.update({ isDefault: true });
    }
  }
}

async function getTarjeta(userId, tarjetaId) {
  const tarjeta = await Tarjeta.findOne({ where: { id: tarjetaId, userId } });
  if (!tarjeta) throw new HttpError(404, 'Tarjeta no encontrada.');
  return toPublic(tarjeta);
}

module.exports = {
  listTarjetas,
  getTarjeta,
  createTarjeta,
  updateTarjeta,
  deleteTarjeta,
};
