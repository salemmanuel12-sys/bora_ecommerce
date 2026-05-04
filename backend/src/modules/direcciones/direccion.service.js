const { Address } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

function sanitize(value = '', max = 255) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, max);
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

async function createAddress(userId, body) {
  const address = await Address.create({
    userId,
    fullName: sanitize(body.fullName, 150),
    phone: sanitize(body.phone, 20),
    street: sanitize(body.street, 255),
    city: sanitize(body.city, 100),
    state: sanitize(body.state, 100),
    postalCode: sanitize(body.postalCode, 10),
    country: sanitize(body.country || 'México', 80),
    references: body.references ? sanitize(body.references, 500) : null,
  });
  return toPublic(address);
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
  if (body.state !== undefined) updated.state = sanitize(body.state, 100);
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

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
