const { Address, EstadoMexico, sequelize } = require('../../models/loader');
const { addAddress: addAddressToEnviatodo } = require('../../services/enviatodo.service');
const HttpError = require('../../utils/httpError');

function sanitize(value = '', max = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, max);
}

function normalizeStateName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseAddressTypeId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}

function toBooleanString(value, fallback = 'false') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'si', 'yes'].includes(normalized)) {
    return 'true';
  }
  return 'false';
}

async function resolveState(bodyState, bodyStateCode, transaction) {
  const stateCodeInput = sanitize(bodyStateCode || '', 2).toUpperCase();
  const stateNameInput = sanitize(bodyState || '', 100);

  if (!stateCodeInput && !stateNameInput) {
    throw new HttpError(400, 'El estado es obligatorio.');
  }

  if (stateCodeInput) {
    const byCode = await EstadoMexico.findByPk(stateCodeInput, { transaction });
    if (!byCode) {
      throw new HttpError(400, 'Codigo de estado invalido para Mexico.');
    }
    return byCode;
  }

  const states = await EstadoMexico.findAll({ transaction });
  const normalizedTarget = normalizeStateName(stateNameInput);
  const byName = states.find((item) => normalizeStateName(item.name) === normalizedTarget);

  if (!byName) {
    throw new HttpError(400, 'Estado invalido para Mexico.');
  }

  return byName;
}

function buildEnviatodoPayload({ userId, userEmail, address, stateCode, body }) {
  const email = sanitize(body.email || userEmail || '', 150);
  if (!email) {
    throw new HttpError(400, 'No se encontro email para registrar la direccion en Enviatodo.');
  }

  const countryCode = sanitize(body.countryCode || body.country_code || 'MX', 2).toUpperCase() || 'MX';
  const reference =
    address.references || (body.reference ? sanitize(body.reference, 255) : '') || 'Sin referencia';

  return {
    id: Number(userId),
    lat: sanitize(body.lat || '0', 30),
    lng: sanitize(body.lng || '0', 30),
    address_type_id: parseAddressTypeId(body.addressTypeId || body.address_type_id),
    full_name: address.fullName,
    email,
    telephone: address.phone,
    street: address.street,
    ext_number: sanitize(body.extNumber || body.ext_number || 'S/N', 20),
    int_number: sanitize(body.intNumber || body.int_number || '', 20),
    zip_code: address.postalCode,
    suburb: sanitize(body.suburb || body.colonia || address.city, 120),
    municipality: sanitize(body.municipality || address.city, 120),
    town: sanitize(body.town || address.city, 120),
    state: address.state,
    state_code: stateCode,
    country_code: countryCode,
    reference,
    default_addr: toBooleanString(body.defaultAddr ?? body.default_addr, 'false'),
  };
}

function toPublic(address) {
  const raw = address?.get ? address.get({ plain: true }) : address;
  return {
    id: raw.id,
    userId: raw.userId,
    fullName: raw.fullName,
    phone: raw.phone,
    street: raw.street,
    city: raw.city,
    state: raw.state,
    stateCode: raw.stateCode || null,
    postalCode: raw.postalCode,
    country: raw.country,
    references: raw.references || null,
    createdAt: raw.createdAt,
  };
}

async function listAddresses(userId) {
  const rows = await Address.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
  return rows.map(toPublic);
}

async function listMexicanStates() {
  const rows = await EstadoMexico.findAll({
    order: [['name', 'ASC']],
  });

  return rows.map((item) => ({
    code: item.code,
    name: item.name,
  }));
}

async function createAddress(userId, body, userMeta = {}) {
  const transaction = await sequelize.transaction();

  try {
    const stateRow = await resolveState(body.state, body.stateCode || body.state_code, transaction);

    const address = await Address.create(
      {
        userId,
        fullName: sanitize(body.fullName, 150),
        phone: sanitize(body.phone, 20),
        street: sanitize(body.street, 255),
        city: sanitize(body.city, 100),
        state: sanitize(stateRow.name, 100),
        stateCode: stateRow.code,
        postalCode: sanitize(body.postalCode, 10),
        country: sanitize(body.country || 'México', 80),
        references: body.references ? sanitize(body.references, 500) : null,
      },
      { transaction }
    );

    const enviatodoPayload = buildEnviatodoPayload({
      userId,
      userEmail: userMeta.email || '',
      address,
      stateCode: stateRow.code,
      body,
    });

    await addAddressToEnviatodo(enviatodoPayload);

    await transaction.commit();
    return toPublic(address);
  } catch (error) {
    await transaction.rollback();

    if (error instanceof HttpError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new HttpError(504, 'Enviatodo tardo demasiado en responder.');
    }

    throw new HttpError(502, `No se pudo registrar la direccion en Enviatodo: ${error.message}`);
  }
}

async function updateAddress(userId, addressId, body) {
  const address = await Address.findOne({ where: { id: addressId, userId } });
  if (!address) {
    throw new HttpError(404, 'Dirección no encontrada.');
  }

  const updated = {};
  if (body.fullName !== undefined) updated.fullName = sanitize(body.fullName, 150);
  if (body.phone !== undefined) updated.phone = sanitize(body.phone, 20);
  if (body.street !== undefined) updated.street = sanitize(body.street, 255);
  if (body.city !== undefined) updated.city = sanitize(body.city, 100);
  if (body.state !== undefined || body.stateCode !== undefined || body.state_code !== undefined) {
    const stateRow = await resolveState(body.state || address.state, body.stateCode || body.state_code);
    updated.state = sanitize(stateRow.name, 100);
    updated.stateCode = stateRow.code;
  }
  if (body.postalCode !== undefined) updated.postalCode = sanitize(body.postalCode, 10);
  if (body.country !== undefined) updated.country = sanitize(body.country, 80);
  if (body.references !== undefined) updated.references = body.references ? sanitize(body.references, 500) : null;

  await address.update(updated);
  return toPublic(address);
}

async function deleteAddress(userId, addressId) {
  const address = await Address.findOne({ where: { id: addressId, userId } });
  if (!address) {
    throw new HttpError(404, 'Dirección no encontrada.');
  }
  await address.destroy();
}

module.exports = { listAddresses, listMexicanStates, createAddress, updateAddress, deleteAddress };
