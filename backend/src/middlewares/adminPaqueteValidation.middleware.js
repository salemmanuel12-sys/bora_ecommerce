const HttpError = require('../utils/httpError');

function sanitizeText(value = '', maxLength = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, maxLength);
}

function parsePositiveInt(value) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function normalizeDecimal(value, fieldName) {
  const normalized = String(value ?? '').replace(/,/g, '.').trim();
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `El campo ${fieldName} debe ser un numero mayor o igual a 0.`);
  }

  return parsed.toFixed(2);
}

function normalizeBooleanString(value, fallback = 'false') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'si', 'yes'].includes(normalized) ? 'true' : 'false';
}

function validatePackageIdParam(req, _res, next) {
  const packageId = parsePositiveInt(req.params?.packageId);

  if (!packageId) {
    return next(new HttpError(400, 'Id de paquete invalido.'));
  }

  req.params.packageId = String(packageId);
  return next();
}

function validateCreatePackage(req, _res, next) {
  try {
    const body = req.body || {};

    const id = parsePositiveInt(body.id);
    if (!id) {
      throw new HttpError(400, 'El campo id es obligatorio y debe ser un entero positivo.');
    }

    const name = sanitizeText(body.name, 120);
    const productType = sanitizeText(body.product_type, 30);
    const unitType = sanitizeText(body.unit_type, 20);
    const packageContent = sanitizeText(body.package_content, 255);

    if (!name) {
      throw new HttpError(400, 'El campo name es obligatorio.');
    }

    if (!productType) {
      throw new HttpError(400, 'El campo product_type es obligatorio.');
    }

    if (!unitType) {
      throw new HttpError(400, 'El campo unit_type es obligatorio.');
    }

    if (!packageContent) {
      throw new HttpError(400, 'El campo package_content es obligatorio.');
    }

    req.body = {
      id,
      name,
      product_type: productType,
      unit_type: unitType,
      package_content: packageContent,
      amount_pkg: normalizeDecimal(body.amount_pkg, 'amount_pkg'),
      height: normalizeDecimal(body.height, 'height'),
      width: normalizeDecimal(body.width, 'width'),
      length: normalizeDecimal(body.length, 'length'),
      weight: normalizeDecimal(body.weight, 'weight'),
      real_weight: normalizeDecimal(body.real_weight, 'real_weight'),
      volumetric_weight: normalizeDecimal(body.volumetric_weight, 'volumetric_weight'),
      bill_weight: normalizeDecimal(body.bill_weight, 'bill_weight'),
      default_pkg: normalizeBooleanString(body.default_pkg, 'false'),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  validatePackageIdParam,
  validateCreatePackage,
};