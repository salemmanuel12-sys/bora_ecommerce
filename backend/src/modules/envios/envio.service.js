const { Shipment, Order, Notification } = require('../../models/loader');
const HttpError = require('../../utils/httpError');

const SHIPMENT_STATUS_MAP = {
  pending: 'Pendiente',
  shipped: 'Enviado',
  in_transit: 'En tránsito',
  'in transit': 'En tránsito',
  delivered: 'Entregado',
};

function normalizeShipmentStatus(value = '') {
  const normalized = String(value || '').trim();
  return SHIPMENT_STATUS_MAP[normalized.toLowerCase()] || normalized;
}

function sanitize(value = '', max = 100) {
  return String(value).trim().replace(/[<>"'&]/g, '').slice(0, max);
}

function toPublic(shipment) {
  const raw = shipment?.get ? shipment.get({ plain: true }) : shipment;
  return {
    id: raw.id,
    orderId: raw.orderId,
    carrier: raw.carrier || null,
    trackingNumber: raw.trackingNumber || null,
    status: raw.status,
    shippedAt: raw.shippedAt || null,
    deliveredAt: raw.deliveredAt || null,
    createdAt: raw.createdAt,
  };
}

/**
 * Obtiene el envío de un pedido (usuario propietario).
 */
async function getShipmentByOrder(userId, orderId) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  const shipment = await Shipment.findOne({ where: { orderId } });
  if (!shipment) {
    return null;
  }

  return toPublic(shipment);
}

/**
 * Crea o actualiza el registro de envío (admin).
 */
async function upsertShipment(orderId, { carrier, trackingNumber, status }) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  const normalizedStatus = status ? normalizeShipmentStatus(status) : '';

  let shipment = await Shipment.findOne({ where: { orderId } });

  if (!shipment) {
    shipment = await Shipment.create({
      orderId,
      carrier: carrier ? sanitize(carrier) : null,
      trackingNumber: trackingNumber ? sanitize(trackingNumber) : null,
      status: normalizedStatus || 'Pendiente',
      shippedAt: normalizedStatus === 'Enviado' ? new Date() : null,
    });
  } else {
    const update = {};
    if (carrier !== undefined) update.carrier = sanitize(carrier);
    if (trackingNumber !== undefined) update.trackingNumber = sanitize(trackingNumber);

    if (normalizedStatus) {
      update.status = normalizedStatus;
      if (normalizedStatus === 'Enviado' && !shipment.shippedAt) update.shippedAt = new Date();
      if (normalizedStatus === 'Entregado' && !shipment.deliveredAt) update.deliveredAt = new Date();
    }

    await shipment.update(update);
  }

  // Sync order status
  if (normalizedStatus === 'Enviado') {
    await Order.update({ status: 'Enviado' }, { where: { id: orderId } });

    await Notification.create({
      userId: order.userId,
      type: 'Enviado',
      message: `Tu pedido #${orderId} fue enviado${trackingNumber ? ` con guía ${sanitize(trackingNumber)}` : ''}.`,
    });
  }

  if (normalizedStatus === 'Entregado') {
    await Order.update({ status: 'Entregado' }, { where: { id: orderId } });

    await Notification.create({
      userId: order.userId,
      type: 'Entregado',
      message: `Tu pedido #${orderId} ha sido entregado. ¡Gracias por tu compra!`,
    });
  }

  return toPublic(shipment);
}

module.exports = { getShipmentByOrder, upsertShipment };
