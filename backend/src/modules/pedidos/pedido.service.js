const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, Cart, CartItem, Producto, Address, Tarjeta, Payment, Shipment, Notification, Usuario } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const { getOrCreateActiveCart } = require('../carrito/carrito.service');
const { notifyNuevaOrden } = require('../../services/whatsapp.service');
const tarjetaService = require('../tarjetas/tarjeta.service');
const {
  getRates: getEnviatodoRates,
  getPackageById: getEnviatodoPackageById,
  getAddressById: getEnviatodoAddressById,
  addAddress: addAddressToEnviatodo,
} = require('../../services/enviatodo.service');

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
  id: '1322755',
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

const ENVIATODO_DEFAULT_PACKAGE_ID = 88227;
const ENVIATODO_DEFAULT_PROVIDER_ID_FEDEX = 1;
const ENVIATODO_DEFAULT_PROVIDER_ID_DHL = 5;

const ENVIATODO_PROVIDER_NAME_BY_ID = {
  '1': 'FEDEX',
  '5': 'DHL',
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

function parsePositiveAmount(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 0;
}

function firstDefined(item, keys) {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') {
      return item[key];
    }
  }
  return undefined;
}

function extractPackageCandidate(rawPackage) {
  if (!rawPackage) return null;
  if (Array.isArray(rawPackage)) {
    return rawPackage.find((row) => row && typeof row === 'object') || null;
  }

  if (typeof rawPackage !== 'object') return null;

  const nestedCandidates = [
    rawPackage.package,
    rawPackage.data?.package,
    rawPackage.response?.package,
    rawPackage.data,
    rawPackage.response,
    rawPackage.result,
  ];

  for (const candidate of nestedCandidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate;
    }
    if (Array.isArray(candidate)) {
      const row = candidate.find((entry) => entry && typeof entry === 'object');
      if (row) return row;
    }
  }

  return rawPackage;
}

function isAllowedProviderId(providerId) {
  const id = String(providerId || '').trim();
  return id === String(ENVIATODO_DEFAULT_PROVIDER_ID_FEDEX) || id === String(ENVIATODO_DEFAULT_PROVIDER_ID_DHL);
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

function addDaysToIsoDate(dateValue, daysToAdd = 0) {
  const raw = String(dateValue || '').trim();
  if (!raw) return '';

  const baseDatePart = raw.slice(0, 10);
  const date = new Date(`${baseDatePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return baseDatePart;

  date.setDate(date.getDate() + Number(daysToAdd || 0));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapRateOption(rawItem) {
  const providerId = String(
    firstDefined(rawItem, ['provider_id', 'providerId']) || ''
  ).trim();

  const providerNameFromId = ENVIATODO_PROVIDER_NAME_BY_ID[providerId] || '';
  const providerServiceId = String(
    firstDefined(rawItem, ['provider_service_id', 'providerServiceId', 'service_id', 'serviceId', 'id']) || ''
  ).trim();

  const carrier = String(firstDefined(rawItem, ['provider', 'carrier', 'courier', 'company']) || providerNameFromId).trim();
  const serviceName = String(
    firstDefined(rawItem, ['service', 'service_name', 'serviceName', 'description', 'name']) || ''
  ).trim();
  const viaTransport = String(firstDefined(rawItem, ['via_transport', 'viaTransport', 'delivery_mode']) || '').trim();

  const charges = Array.isArray(rawItem?.charges) ? rawItem.charges : [];
  const firstCharge = charges.find((entry) => entry && typeof entry === 'object') || null;

  const costDirect = parseAmount(
    firstDefined(rawItem, [
      'total',
      'total_rate',
      'total_amount',
      'price',
      'cost',
      'amount',
      'importe',
      'final_price',
      'amount_total',
    ])
  );
  const costFromCharge = parseAmount(firstCharge?.total);
  const cost = costDirect > 0 ? costDirect : costFromCharge;

  const estimatedDateRaw = String(firstDefined(rawItem, ['estimated_date', 'estimatedDate', 'delivery_time', 'eta', 'transit_time']) || '').trim();
  const estimatedDate = addDaysToIsoDate(estimatedDateRaw, 2);
  const quoteKey = providerId && providerServiceId ? `${providerId}:${providerServiceId}` : '';

  if (!providerId || !providerServiceId || !carrier || cost <= 0) {
    return null;
  }

  return {
    quoteKey,
    providerId,
    providerServiceId,
    provider: carrier,
    serviceName,
    viaTransport,
    cost: Number(cost.toFixed(2)),
    estimatedDate,
    total: Number(cost.toFixed(2)),
  };
}

function selectBestQuoteByTransport(providerQuotes, transport = 'terrestre') {
  const normalizedTransport = normalizeText(transport);
  const filtered = providerQuotes
    .filter((quote) => normalizeText(quote?.viaTransport || '') === normalizedTransport)
    .sort((a, b) => a.cost - b.cost);

  return filtered[0] || null;
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

function buildQuotePackage(templatePackage, fallbackPackage) {
  const source = extractPackageCandidate(templatePackage) || {};

  const id = parsePositiveAmount(
    firstDefined(source, ['id', 'package_id', 'packageId']),
    fallbackPackage?.id,
    ENVIATODO_DEFAULT_PACKAGE_ID
  );

  const amountPkg = Number(
    parsePositiveAmount(
      firstDefined(source, ['amount_pkg', 'amount', 'amountPkg', 'insured_amount']),
      fallbackPackage?.amount_pkg,
      1
    ).toFixed(2)
  );

  const height = Number(parsePositiveAmount(source.height, fallbackPackage?.height, 5).toFixed(2));
  const width = Number(parsePositiveAmount(source.width, fallbackPackage?.width, 5).toFixed(2));
  const length = Number(parsePositiveAmount(source.length, fallbackPackage?.length, 5).toFixed(2));

  const realWeight = Number(
    parsePositiveAmount(
      firstDefined(source, ['real_weight', 'realWeight', 'weight']),
      fallbackPackage?.real_weight,
      fallbackPackage?.weight,
      0.5
    ).toFixed(2)
  );

  const volumetricWeight = Number(
    parsePositiveAmount(
      firstDefined(source, ['volumetric_weight', 'volumetricWeight']),
      (length * width * height) / 5000,
      fallbackPackage?.volumetric_weight,
      0.03
    ).toFixed(2)
  );

  const billWeight = Number(
    parsePositiveAmount(
      firstDefined(source, ['bill_weight', 'billWeight']),
      Math.max(realWeight, volumetricWeight),
      fallbackPackage?.bill_weight,
      0.5
    ).toFixed(2)
  );

  return {
    id,
    name: String(firstDefined(source, ['name', 'package_name']) || fallbackPackage?.name || 'CAJA CHICA'),
    product_type: String(
      firstDefined(source, ['product_type', 'productType']) || fallbackPackage?.product_type || '01010101'
    ),
    unit_type: String(firstDefined(source, ['unit_type', 'unitType']) || fallbackPackage?.unit_type || 'X1A'),
    package_content: String(
      firstDefined(source, ['package_content', 'content', 'description'])
        || fallbackPackage?.package_content
        || 'PRODUCTO ECOMMERCE'
    ),
    amount_pkg: amountPkg,
    height,
    width,
    length,
    weight: realWeight,
    real_weight: realWeight,
    volumetric_weight: volumetricWeight,
    bill_weight: billWeight,
    default_pkg: Boolean(firstDefined(source, ['default_pkg', 'defaultPkg']) || false),
  };
}

function formatEnviatodoDateTime(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function toEnviatodoBinaryFlag(value, fallback = '0') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'si', 'yes'].includes(normalized) ? '1' : '0';
}

function pickFirstName(fullName = '') {
  const clean = String(fullName || '').trim();
  if (!clean) return '';
  return clean.split(/\s+/)[0] || clean;
}

function buildQuoteAddressPayload(rawAddress, {
  emailFallback = '',
  addressTypeFallback = '2',
  defaultAddrFallback = '1',
  createdAtFallback = '',
  updatedAtFallback = '',
  statusIdFallback = '0',
} = {}) {
  const fullName = String(rawAddress?.full_name || rawAddress?.fullName || '').trim();
  const city = String(rawAddress?.city || rawAddress?.suburb || rawAddress?.municipality || rawAddress?.town || '').trim();

  const createdAt = formatEnviatodoDateTime(rawAddress?.created_at || rawAddress?.createdAt || createdAtFallback);
  const updatedAt = formatEnviatodoDateTime(rawAddress?.updated_at || rawAddress?.updatedAt || updatedAtFallback || rawAddress?.createdAt || createdAtFallback);

  return {
    address_type_id: String(rawAddress?.address_type_id || addressTypeFallback),
    full_name: fullName,
    email: String(rawAddress?.email || emailFallback || ''),
    telephone: String(rawAddress?.telephone || rawAddress?.phone || ''),
    street: String(rawAddress?.street || ''),
    ext_number: String(rawAddress?.ext_number || 'S/N'),
    int_number: String(rawAddress?.int_number || ''),
    zip_code: String(rawAddress?.zip_code || rawAddress?.postalCode || ''),
    suburb: String(rawAddress?.suburb || city),
    municipality: String(rawAddress?.municipality || city),
    town: String(rawAddress?.town || city),
    state: String(rawAddress?.state || ''),
    state_code: String(rawAddress?.state_code || rawAddress?.stateCode || ''),
    country_code: String(rawAddress?.country_code || 'MX'),
    default_addr: toEnviatodoBinaryFlag(rawAddress?.default_addr, defaultAddrFallback),
    created_at: createdAt,
    updated_at: updatedAt,
    status_id: String(rawAddress?.status_id || statusIdFallback),
    lat: String(rawAddress?.lat || ''),
    lng: String(rawAddress?.lng || ''),
    reference: String(rawAddress?.reference || rawAddress?.references || '-'),
    company: String(rawAddress?.company || ''),
    name: String(rawAddress?.name || pickFirstName(fullName)),
  };
}

function buildQuotePackagePayload(rawPackage, itemCount) {
  const realWeight = Number(parsePositiveAmount(rawPackage?.real_weight, rawPackage?.weight, 0.5).toFixed(2));
  const volumetricWeight = Number(
    parsePositiveAmount(rawPackage?.volumetric_weight, (rawPackage?.length * rawPackage?.width * rawPackage?.height) / 5000, 0.03).toFixed(2)
  );
  const billWeight = Number(parsePositiveAmount(rawPackage?.bill_weight, Math.max(realWeight, volumetricWeight), 0.5).toFixed(2));
  const amountPkg = Number(parsePositiveAmount(rawPackage?.amount_pkg, 1).toFixed(2));

  return {
    name: String(rawPackage?.name || ''),
    product_type: String(rawPackage?.product_type || '01010101'),
    unit_type: String(rawPackage?.unit_type || 'X1A'),
    package_content: String(rawPackage?.package_content || 'PRODUCTO ECOMMERCE'),
    amount_pkg: String(amountPkg),
    height: Number(parsePositiveAmount(rawPackage?.height, 5).toFixed(2)),
    width: Number(parsePositiveAmount(rawPackage?.width, 5).toFixed(2)),
    length: Number(parsePositiveAmount(rawPackage?.length, 5).toFixed(2)),
    weight: Number(parsePositiveAmount(rawPackage?.weight, realWeight, 0.5).toFixed(2)),
    id: String(rawPackage?.id || ''),
    package_type_id: String(rawPackage?.package_type_id || 1),
    real_weight: realWeight.toFixed(2),
    volumetric_weight: String(volumetricWeight),
    bill_weight: String(billWeight),
    default_pkg: toEnviatodoBinaryFlag(rawPackage?.default_pkg, '0'),
    product_quantity: String(Math.max(1, Number(itemCount || 1))),
  };
}

function buildDestinationAddress(address, userEmail) {
  if (!address.address_id_enviatodo) {
    throw new HttpError(400, 'La direccion destino no tiene address_id_enviatodo registrado.');
  }

  return buildQuoteAddressPayload(address, {
    emailFallback: userEmail,
    addressTypeFallback: '2',
    defaultAddrFallback: '1',
    createdAtFallback: address.createdAt,
    updatedAtFallback: address.updatedAt || address.createdAt,
    statusIdFallback: '0',
  });
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
  const rawTemplatePackage = await getEnviatodoPackageById(ENVIATODO_DEFAULT_PACKAGE_ID);
  const quotePackage = buildQuotePackage(rawTemplatePackage, summary.package);
  const quotePackagePayload = buildQuotePackagePayload(quotePackage, summary.itemCount);
  const origin = buildQuoteAddressPayload(ENVIATODO_ORIGIN, {
    emailFallback: ENVIATODO_ORIGIN.email,
    addressTypeFallback: '1',
    defaultAddrFallback: '1',
    statusIdFallback: '0',
  });

  const buildRatesPayloadForProvider = (providerId) => ({
    type: 'order',
    quotes: {
      shipping_type: '1',
      quantity: 1,
      provider_id: providerId,
      origin,
      destination,
      package: quotePackagePayload,
    },
  });

  const providerIds = [ENVIATODO_DEFAULT_PROVIDER_ID_FEDEX, ENVIATODO_DEFAULT_PROVIDER_ID_DHL];

  const providerResponses = await Promise.allSettled(
    providerIds.map(async (providerId) => {
      const rawRates = await getEnviatodoRates(buildRatesPayloadForProvider(providerId));
      const providerQuotes = flattenRatesPayload(rawRates)
        .map(mapRateOption)
        .filter(Boolean)
        .filter((quote) => isAllowedProviderId(quote.providerId))
        .filter((quote) => String(quote.providerId) === String(providerId));

      const terrestrial = selectBestQuoteByTransport(providerQuotes, 'terrestre');
      const aerial = selectBestQuoteByTransport(providerQuotes, 'aereo');

      const selected = [terrestrial, aerial].filter(Boolean);

      return selected;
    })
  );

  const mapped = providerResponses
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => (Array.isArray(result.value) ? result.value : []))
    .filter(Boolean);

  if (mapped.length === 0) {
    throw new HttpError(404, 'No hay cotizaciones disponibles de FedEx o DHL.');
  }

  return {
    subtotal: summary.subtotal,
    itemCount: summary.itemCount,
    package: quotePackage,
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
async function checkout(userId, { shippingAddressId, shippingProviderId, shippingProviderServiceId, paymentMethod, cardId, card }) {
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
  const selectedQuote = shippingData.quotes.find((quote) => {
    const sameService = String(quote.providerServiceId) === String(shippingProviderServiceId);
    if (!sameService) return false;

    if (shippingProviderId === undefined || shippingProviderId === null || shippingProviderId === '') {
      return true;
    }

    return String(quote.providerId) === String(shippingProviderId);
  });

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
        carrier: `${selectedQuote.provider} - ${selectedQuote.viaTransport}`,
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