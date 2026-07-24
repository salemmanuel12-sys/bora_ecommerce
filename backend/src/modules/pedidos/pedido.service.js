const { sequelize, Order, OrderItem, Cart, CartItem, Producto, Address, Tarjeta, Payment, Shipment, Notification, Usuario } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const { getOrCreateActiveCart } = require('../carrito/carrito.service');
const { notifyNuevaOrden } = require('../../services/whatsapp.service');
const tarjetaService = require('../tarjetas/tarjeta.service');
const { getRates: getEnviatodoRates } = require('../../services/enviatodo.service');

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

const ENVIATODO_ORIGIN = {
  id: 'BORA_ORIGIN_1',
  lat: 0,
  lng: 0,
  address_type_id: '1',
  full_name: 'Salvador Emmanuel Cortes',
  email: 'borajoyeria146@gmail.com',
  telephone: '5522539193',
  street: 'Manzano',
  ext_number: '203',
  int_number: '',
  zip_code: '89603',
  suburb: 'Arboledas',
  municipality: 'Altamira',
  town: 'Altamira',
  state: 'Tamaulipas',
  state_code: 'TS',
  country_code: 'MX',
  reference: 'Ent C Franboyan y C5',
  default_addr: 'false',
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

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseAmount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function firstDefined(item, keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      return item[key];
    }
  }
  return undefined;
}

function isAllowedCarrier(name = '') {
  const normalized = normalizeText(name);
  return normalized.includes('fedex') || normalized.includes('dhl');
}

function isAllowedService(name = '') {
  const normalized = normalizeText(name);
  const terrestre = normalized.includes('terrestre') || normalized.includes('ground');
  const aereoExpress =
    (normalized.includes('aereo') || normalized.includes('air')) &&
    (normalized.includes('express') || normalized.includes('expr'));

  return terrestre || aereoExpress;
}

function flattenRatesPayload(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  const stacks = [];
  if (Array.isArray(raw.data)) stacks.push(...raw.data);
  if (Array.isArray(raw.response)) stacks.push(...raw.response);
  if (Array.isArray(raw.results)) stacks.push(...raw.results);
  if (Array.isArray(raw.rates)) stacks.push(...raw.rates);
  if (raw.data && typeof raw.data === 'object') {
    for (const value of Object.values(raw.data)) {
      if (Array.isArray(value)) stacks.push(...value);
    }
  }

  return stacks;
}

function mapRateOption(rawItem) {
  const providerServiceId = String(
    firstDefined(rawItem, ['provider_service_id', 'providerServiceId', 'service_id', 'serviceId', 'id']) || ''
  ).trim();

  const carrier = String(firstDefined(rawItem, ['provider', 'carrier', 'courier', 'company']) || '').trim();
  const serviceName = String(
    firstDefined(rawItem, ['service', 'service_name', 'serviceName', 'description', 'name']) || ''
  ).trim();
  const mode = String(firstDefined(rawItem, ['shipping_type', 'mode', 'type']) || '').trim();

  const cost = parseAmount(
    firstDefined(rawItem, [
      'total',
      'total_amount',
      'price',
      'cost',
      'amount',
      'importe',
      'final_price',
      'amount_total',
    ])
  );

  const eta = String(firstDefined(rawItem, ['delivery_time', 'eta', 'transit_time', 'days']) || '').trim();

  if (!providerServiceId || !carrier || !serviceName || cost <= 0) {
    return null;
  }

  const label = `${carrier} - ${serviceName}`;
  return {
    providerServiceId,
    carrier,
    serviceName,
    mode,
    cost: Number(cost.toFixed(2)),
    eta,
    label,
  };
}

function buildPackageSummary(cartItems) {
  let subtotal = 0;
  let itemCount = 0;

  let totalWeight = 0;
  let totalVolumetricWeight = 0;
  let maxWidth = 1;
  let maxLength = 1;
  let totalHeight = 1;

  for (const item of cartItems) {
    const qty = Number(item.quantity || 0);
    if (qty <= 0) continue;

    const price = Number(item.price || 0);
    subtotal += price * qty;
    itemCount += qty;

    const producto = item.producto || {};
    const weight = Math.max(0.01, Number(producto.peso || 0.1));
    const width = Math.max(1, Number(producto.ancho || 10));
    const length = Math.max(1, Number(producto.largo || 10));
    const height = Math.max(1, Number(producto.alto || 3));

    totalWeight += weight * qty;
    totalVolumetricWeight += ((length * width * height) / 5000) * qty;

    maxWidth = Math.max(maxWidth, width);
    maxLength = Math.max(maxLength, length);
    totalHeight += height * qty;
  }

  const realWeight = Number(totalWeight.toFixed(2));
  const volumetricWeight = Number(totalVolumetricWeight.toFixed(2));
  const billWeight = Number(Math.max(realWeight, volumetricWeight).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    itemCount,
    package: {
      id: Date.now(),
      name: 'CAJA ECOMMERCE',
      product_type: '01010101',
      unit_type: 'X1A',
      package_content: 'JOYERIA',
      amount_pkg: Number(subtotal.toFixed(2)),
      height: Number(totalHeight.toFixed(2)),
      width: Number(maxWidth.toFixed(2)),
      length: Number(maxLength.toFixed(2)),
      weight: realWeight,
      real_weight: realWeight,
      volumetric_weight: volumetricWeight,
      bill_weight: billWeight,
      default_pkg: false,
    },
  };
}

function buildDestinationAddress(address, userEmail) {
  return {
    id: String(address.id),
    lat: 0,
    lng: 0,
    address_type_id: '2',
    full_name: String(address.fullName || ''),
    email: String(userEmail || ''),
    telephone: String(address.phone || ''),
    street: String(address.street || ''),
    ext_number: 'S/N',
    int_number: '',
    zip_code: String(address.postalCode || ''),
    suburb: String(address.city || ''),
    municipality: String(address.city || ''),
    town: String(address.city || ''),
    state: String(address.state || ''),
    state_code: String(address.stateCode || ''),
    country_code: 'MX',
    reference: String(address.references || 'Sin referencia'),
    default_addr: 'false',
  };
}

async function getCartItemsWithDimensions(userId) {
  const cart = await getOrCreateActiveCart(userId);
  const cartRaw = cart.get({ plain: true });

  if (!cartRaw.items || cartRaw.items.length === 0) {
    throw new HttpError(400, 'El carrito esta vacio.');
  }

  const productIds = [...new Set((cartRaw.items || []).map((item) => item.productId))];
  const productos = await Producto.findAll({
    where: { id: productIds },
    attributes: ['id', 'peso', 'alto', 'ancho', 'largo', 'status', 'name', 'stock'],
  });
  const productById = new Map(productos.map((p) => [p.id, p]));

  const enrichedItems = (cartRaw.items || []).map((item) => {
    const prod = productById.get(item.productId);
    return {
      ...item,
      producto: {
        ...item.producto,
        peso: Number(prod?.peso || 0),
        alto: Number(prod?.alto || 0),
        ancho: Number(prod?.ancho || 0),
        largo: Number(prod?.largo || 0),
      },
    };
  });

  return { cart, cartRaw, items: enrichedItems, productById };
}

async function resolveShippingQuotes(userId, shippingAddressId) {
  const address = await Address.findOne({ where: { id: shippingAddressId, userId } });
  if (!address) {
    throw new HttpError(404, 'Direccion de envio no encontrada.');
  }

  if (!address.stateCode) {
    throw new HttpError(400, 'La direccion seleccionada no tiene codigo de estado. Editala y vuelve a intentar.');
  }

  const user = await Usuario.findByPk(userId, { attributes: ['id', 'email'] });
  if (!user?.email) {
    throw new HttpError(400, 'No se encontro email del usuario para cotizar envio.');
  }

  const { items } = await getCartItemsWithDimensions(userId);
  const summary = buildPackageSummary(items);
  const destination = buildDestinationAddress(address, user.email);

  const payload = {
    type: 'order',
    quantity: 1,
    provider_service_id: '1',
    quotes: {
      user_id: String(process.env.ENVIATODO_USER_ID || '1595'),
      shipping_type: 'package',
      origin: ENVIATODO_ORIGIN,
      destination,
      package: summary.package,
    },
  };

  const rawRates = await getEnviatodoRates(payload);
  const flat = flattenRatesPayload(rawRates);

  const mapped = flat
    .map(mapRateOption)
    .filter(Boolean)
    .filter((option) => isAllowedCarrier(option.carrier) && isAllowedService(option.serviceName))
    .sort((a, b) => a.cost - b.cost);

  if (mapped.length === 0) {
    throw new HttpError(404, 'No hay cotizaciones disponibles de FedEx o DHL (terrestre/aereo express).');
  }

  return {
    subtotal: summary.subtotal,
    itemCount: summary.itemCount,
    package: summary.package,
    quotes: mapped,
  };
}

async function shippingQuotes(userId, { shippingAddressId }) {
  if (!shippingAddressId) {
    throw new HttpError(400, 'shippingAddressId es requerido para cotizar envio.');
  }

  return resolveShippingQuotes(userId, Number(shippingAddressId));
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
    subtotal: Number(raw.subtotal || raw.total || 0),
    shippingCost: Number(raw.shippingCost || 0),
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
async function checkout(userId, { shippingAddressId, shippingProviderServiceId, paymentMethod, cardId, card }) {
  const { cart, cartRaw, productById } = await getCartItemsWithDimensions(userId);

  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
  const paymentMethodForRecord = normalizedPaymentMethod || 'Tarjeta';

  if (!cartRaw.items || cartRaw.items.length === 0) {
    throw new HttpError(400, 'El carrito está vacío.');
  }

  if (!shippingAddressId) {
    throw new HttpError(400, 'Selecciona una direccion de envio.');
  }

  if (!shippingProviderServiceId) {
    throw new HttpError(400, 'Selecciona una paqueteria para continuar.');
  }

  // Validate stock before transaction
  for (const item of cartRaw.items) {
    const producto = productById.get(item.productId);
    if (!producto || !producto.status) {
      throw new HttpError(400, `El producto "${item.producto?.name || item.productId}" ya no está disponible.`);
    }
    if (producto.stock < item.quantity) {
      throw new HttpError(400, `Stock insuficiente para "${producto.name}". Disponible: ${producto.stock}.`);
    }
  }

  const subtotal = cartRaw.items.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0
  );

  const shippingData = await resolveShippingQuotes(userId, Number(shippingAddressId));
  const selectedQuote = shippingData.quotes.find(
    (quote) => String(quote.providerServiceId) === String(shippingProviderServiceId)
  );

  if (!selectedQuote) {
    throw new HttpError(400, 'La paqueteria seleccionada ya no esta disponible. Cotiza de nuevo.');
  }

  const shippingCost = Number(selectedQuote.cost || 0);
  const total = Number((subtotal + shippingCost).toFixed(2));

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
        total,
        subtotal: Number(subtotal.toFixed(2)),
        shippingCost,
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
        amount: total,
        status: 'Pendiente',
      },
      { transaction }
    );

    await Shipment.create(
      {
        orderId: order.id,
        carrier: `${selectedQuote.carrier} - ${selectedQuote.serviceName}`,
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
    const orderTotal = total;
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
    const parsedOrderId = Number.parseInt(normalizedSearch, 10);

    where[Op.or] = [
      ...(Number.isInteger(parsedOrderId) ? [{ id: parsedOrderId }] : []),

      sequelizeWhere(
        cast(col('order.id'), 'CHAR'),
        {
          [Op.like]: `%${normalizedSearch}%`
        }
      ),

      sequelizeWhere(
        require('sequelize').fn('LOWER', col('usuario.nombre')),
        {
          [Op.like]: lowerSearch
        }
      ),

      sequelizeWhere(
        require('sequelize').fn('LOWER', col('usuario.email')),
        {
          [Op.like]: lowerSearch
        }
      )
    ];
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
  shippingQuotes,
  checkout,
  listOrders,
  getOrder,
  cancelOrder,
  adminListOrders,
  adminGetOrder
};