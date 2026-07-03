const { sequelize, Order, OrderItem, Cart, CartItem, Producto, Address, Tarjeta, Payment, Shipment, Notification, Usuario } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const { getOrCreateActiveCart } = require('../carrito/carrito.service');
const { notifyNuevaOrden } = require('../../services/whatsapp.service');
const tarjetaService = require('../tarjetas/tarjeta.service');

const ORDER_STATUS_MAP = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAYMENT_STATUS_MAP = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  paid: 'Pagado',
  failed: 'Fallido',
};

const PAYMENT_METHOD_MAP = {
  card: 'Tarjeta',
  transfer: 'Transferencia',
  cash: 'Efectivo',
};

function normalizeOrderStatus(value = '') {
  const normalized = String(value || '').trim();
  return ORDER_STATUS_MAP[normalized.toLowerCase()] || normalized;
}

function normalizePaymentStatus(value = '') {
  const normalized = String(value || '').trim();
  return PAYMENT_STATUS_MAP[normalized.toLowerCase()] || normalized;
}

function normalizePaymentMethod(value = '') {
  const normalized = String(value || '').trim();
  return PAYMENT_METHOD_MAP[normalized.toLowerCase()] || normalized;
}

const includeOrderItems = {
  model: OrderItem,
  as: 'items',
  include: [
    {
      model: Producto,
      as: 'producto',
      attributes: ['id', 'name', 'sku'],
    },
  ],
};

const includeShippingAddress = {
  model: Address,
  as: 'shippingAddress',
  required: false,
};

const includePayment = {
  model: Payment,
  as: 'payment',
  required: false,
  include: [
    {
      model: Tarjeta,
      as: 'tarjeta',
      attributes: ['id', 'holderName', 'last4', 'brand', 'expMonth', 'expYear'],
      required: false,
    },
  ],
};

const includeShipment = {
  model: Shipment,
  as: 'shipment',
  required: false,
};

const includeUsuario = {
  model: Usuario,
  as: 'usuario',
  attributes: ['id', 'nombre', 'email', 'status'],
  required: false,
};

function toPublicOrder(order) {
  const raw = order?.get ? order.get({ plain: true }) : order;

  return {
    id: raw.id,
    userId: raw.userId,
    total: Number(raw.total),
    status: raw.status,
    paymentStatus: raw.paymentStatus,
    createdAt: raw.createdAt,
    items: (raw.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      producto: item.producto
        ? { id: item.producto.id, name: item.producto.name, sku: item.producto.sku }
        : null,
    })),
    shippingAddress: raw.shippingAddress || null,
    payment: raw.payment
      ? {
          id: raw.payment.id,
          cardId: raw.payment.cardId || null,
          method: raw.payment.method,
          amount: Number(raw.payment.amount),
          status: raw.payment.status,
          transactionId: raw.payment.transactionId,
          paidAt: raw.payment.paidAt,
          tarjeta: raw.payment.tarjeta
            ? {
                id: raw.payment.tarjeta.id,
                holderName: raw.payment.tarjeta.holderName,
                last4: raw.payment.tarjeta.last4,
                brand: raw.payment.tarjeta.brand,
                expMonth: raw.payment.tarjeta.expMonth,
                expYear: raw.payment.tarjeta.expYear,
              }
            : null,
        }
      : null,
    shipment: raw.shipment
      ? {
          id: raw.shipment.id,
          carrier: raw.shipment.carrier,
          trackingNumber: raw.shipment.trackingNumber,
          status: raw.shipment.status,
          shippedAt: raw.shipment.shippedAt,
          deliveredAt: raw.shipment.deliveredAt,
        }
      : null,
  };
}

function toAdminOrder(order) {
  const raw = order?.get ? order.get({ plain: true }) : order;

  return {
    ...toPublicOrder(raw),
    usuario: raw.usuario
      ? {
          id: raw.usuario.id,
          nombre: raw.usuario.nombre,
          email: raw.usuario.email,
          status: raw.usuario.status,
        }
      : null,
  };
}

/**
 * Crea un pedido a partir del carrito activo del usuario.
 * Congela precios, reduce stock y marca el carrito como 'converted'.
 */
async function checkout(userId, { shippingAddressId, paymentMethod, cardId, card }) {
  const cart = await getOrCreateActiveCart(userId);
  const cartRaw = cart.get({ plain: true });

  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
  const paymentMethodForRecord = normalizedPaymentMethod || 'Tarjeta';

  if (!cartRaw.items || cartRaw.items.length === 0) {
    throw new HttpError(400, 'El carrito está vacío.');
  }

  if (shippingAddressId) {
    const address = await Address.findOne({ where: { id: shippingAddressId, userId } });
    if (!address) {
      throw new HttpError(404, 'Dirección de envío no encontrada.');
    }
  }

  // Validate stock before transaction
  for (const item of cartRaw.items) {
    const producto = await Producto.findByPk(item.productId);
    if (!producto || !producto.status) {
      throw new HttpError(400, `El producto "${item.producto?.name || item.productId}" ya no está disponible.`);
    }
    if (producto.stock < item.quantity) {
      throw new HttpError(400, `Stock insuficiente para "${producto.name}". Disponible: ${producto.stock}.`);
    }
  }

  const total = cartRaw.items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  let selectedCardId = null;
  if (normalizedPaymentMethod === 'Tarjeta') {
    const parsedCardId = Number.parseInt(String(cardId), 10);

    if (Number.isFinite(parsedCardId) && parsedCardId > 0) {
      const existingCard = await Tarjeta.findOne({ where: { id: parsedCardId, userId } });
      if (!existingCard) {
        throw new HttpError(404, 'Tarjeta no encontrada para este usuario.');
      }
      selectedCardId = existingCard.id;
    } else if (card && typeof card === 'object') {
      const createdCard = await tarjetaService.createTarjeta(userId, card);
      selectedCardId = createdCard.id;
    } else {
      throw new HttpError(400, 'Para pagar con tarjeta debes seleccionar o registrar una tarjeta.');
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await Order.create(
      {
        userId,
        total: Number(total.toFixed(2)),
        status: 'Pendiente',
        paymentStatus: 'Pendiente',
        shippingAddressId: shippingAddressId || null,
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      cartRaw.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      { transaction }
    );

    // Reduce stock
    for (const item of cartRaw.items) {
      await Producto.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Create payment record so gateways can attach checkout sessions immediately.
    await Payment.create(
      {
        orderId: order.id,
        method: paymentMethodForRecord,
        cardId: paymentMethodForRecord === 'Tarjeta' ? selectedCardId : null,
        amount: Number(total.toFixed(2)),
        status: 'Pendiente',
      },
      { transaction }
    );

    // Mark cart as converted
    await Cart.update({ status: 'Convertido' }, { where: { id: cart.id }, transaction });

    await transaction.commit();

    const full = await Order.findByPk(order.id, {
      include: [includeOrderItems, includeShippingAddress, includePayment],
    });

    // Notificación WhatsApp al admin (no bloquea la respuesta)
    const usuario = await Usuario.findByPk(userId, { attributes: ['email'] }).catch(() => null);
    const orderTotal = Number(total.toFixed(2));
    const itemCount = cartRaw.items.reduce((acc, item) => acc + item.quantity, 0);

    notifyNuevaOrden({
      orderId: order.id,
      total: orderTotal,
      itemCount,
      userEmail: usuario?.email || '',
    }).catch((err) => console.warn('[WhatsApp] notifyNuevaOrden error:', err.message));

    // Notificación interna para el panel admin (userId null = solo admin la ve)
    const totalFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(orderTotal);

    const adminMessage =
      `🛍️ Nueva orden de compra — Bora Joyería\n\n` +
      `📦 Pedido #${order.id}\n` +
      `💳 Total: ${totalFormatted}\n` +
      `🔢 Artículos: ${itemCount}\n` +
      (usuario?.email ? `👤 Cliente: ${usuario.email}\n` : '') +
      `\n✅ Revisa el panel de administración para procesarla.`;

    Notification.create({
      userId: null,
      type: 'Nuevo pedido',
      message: adminMessage,
      read: false,
    }).catch((err) => console.warn('[Notification admin] Error al crear notificación:', err.message));

    return toPublicOrder(full);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Lista los pedidos del usuario autenticado.
 */
async function listOrders(userId, { page = 1, limit = 10 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Order.findAndCountAll({
    where: { userId },
    include: [includeOrderItems, includePayment, includeShipment],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    orders: rows.map(toPublicOrder),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

/**
 * Obtiene el detalle de un pedido del usuario.
 */
async function getOrder(userId, orderId) {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [includeOrderItems, includeShippingAddress, includePayment, includeShipment],
  });

  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  return toPublicOrder(order);
}

/**
 * Cancela un pedido (solo si está pendiente).
 * Restaura stock y marca pago como fallido.
 */
async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [includeOrderItems],
  });

  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  if (!['Pendiente'].includes(order.status)) {
    throw new HttpError(400, `No se puede cancelar un pedido en estado "${order.status}".`);
  }

  const transaction = await sequelize.transaction();
  try {
    await order.update({ status: 'Cancelado', paymentStatus: 'Fallido' }, { transaction });

    // Restore stock
    for (const item of order.items || []) {
      await Producto.increment('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    await Payment.update(
      { status: 'Rechazado' },
      { where: { orderId: order.id }, transaction }
    );

    await Notification.create(
      {
        userId,
        type: 'Cancelado',
        message: `Tu pedido #${order.id} ha sido cancelado.`,
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const full = await Order.findByPk(order.id, {
    include: [includeOrderItems, includeShippingAddress, includePayment, includeShipment],
  });

  return toPublicOrder(full);
}

async function adminListOrders({ page = 1, limit = 20, status = '', search = '' } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { Op, cast, col, where: sequelizeWhere } = require('sequelize');
  const where = {};
  const normalizedStatus = String(status || '').trim();
  const normalizedSearch = String(search || '').trim();

  if (normalizedStatus) {
    where.status = normalizeOrderStatus(normalizedStatus);
  }

  const includeUsuario = {
    model: Usuario,
    as: 'usuario',
    attributes: ['id', 'nombre', 'email', 'status'],
    required: false,
  };

  const lowerSearch = `%${normalizedSearch.toLowerCase()}%`;

  if (normalizedSearch) {

    includeUsuario.where = {
        [Op.or]: [
            {
                nombre: {
                    [Op.like]: lowerSearch
                }
            },
            {
                email: {
                    [Op.like]: lowerSearch
                }
            }
        ]
    };

    includeUsuario.required = true;
}

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      includeUsuario,
      includeOrderItems,
      includeShippingAddress,
      includePayment,
      includeShipment,
    ],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    orders: rows.map(toAdminOrder),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function adminGetOrder(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [includeUsuario, includeOrderItems, includeShippingAddress, includePayment, includeShipment],
  });

  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  return toAdminOrder(order);
}

module.exports = {
  checkout,
  listOrders,
  getOrder,
  cancelOrder,
  adminListOrders,
  adminGetOrder
};