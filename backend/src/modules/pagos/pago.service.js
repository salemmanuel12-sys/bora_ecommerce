const { Payment, Order, Notification, Usuario } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const https = require('https');
const Stripe = require('stripe');

const PAYMENT_STATUS_MAP = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  pagado: 'Aprobado',
  failed: 'Rechazado',
};

const ORDER_STATUS_MAP = {
  paid: 'Pagado',
};

const PAYMENT_METHODS = new Set(['Tarjeta', 'Transferencia', 'Efectivo']);
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const MERCADOPAGO_BASE_URL = 'https://api.mercadopago.com';

let stripeClient;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(500, 'Stripe no esta configurado en el servidor.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

function toUrlEncoded(input) {
  return Object.entries(input)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function httpsRequest(url, { method, headers = {}, body } = {}) {
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        method: method || 'GET',
        headers,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const contentType = response.headers['content-type'] || '';

          if (response.statusCode >= 400) {
            return reject(new HttpError(response.statusCode, raw || 'Error procesando solicitud de pago.'));
          }

          if (!raw) {
            return resolve({});
          }

          if (contentType.includes('application/json')) {
            return resolve(JSON.parse(raw));
          }

          return resolve(raw);
        });
      }
    );

    request.on('error', (error) => reject(error));
    if (body) request.write(body);
    request.end();
  });
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new HttpError(500, 'PayPal no esta configurado en el servidor.');
  }

  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const payload = toUrlEncoded({ grant_type: 'client_credentials' });

  const tokenResponse = await httpsRequest(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload),
    },
    body: payload,
  });

  if (!tokenResponse?.access_token) {
    throw new HttpError(502, 'No se pudo autenticar con PayPal.');
  }

  return tokenResponse.access_token;
}

function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new HttpError(500, 'Mercado Pago no esta configurado en el servidor.');
  }

  return accessToken;
}

function normalizePaymentStatus(value = '') {
  const normalized = String(value || '').trim();
  return PAYMENT_STATUS_MAP[normalized.toLowerCase()] || normalized;
}

function normalizeOrderStatus(value = '') {
  const normalized = String(value || '').trim();
  return ORDER_STATUS_MAP[normalized.toLowerCase()] || normalized;
}

function toPublic(payment) {
  const raw = payment?.get ? payment.get({ plain: true }) : payment;
  return {
    id: raw.id,
    orderId: raw.orderId,
    method: raw.method,
    amount: Number(raw.amount),
    status: raw.status,
    transactionId: raw.transactionId || null,
    paidAt: raw.paidAt || null,
    createdAt: raw.createdAt,
  };
}

function isApprovedPaymentStatus(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return ['aprobado', 'approved', 'paid', 'pagado'].includes(normalized);
}

/**
 * Obtiene el pago de un pedido (usuario propietario).
 */
async function getPaymentByOrder(userId, orderId) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    throw new HttpError(404, 'Pago no encontrado para este pedido.');
  }

  return toPublic(payment);
}

async function getOwnedOrderAndPayment(userId, orderId) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    throw new HttpError(404, 'Pago no registrado para este pedido.');
  }

  return { order, payment };
}

/**
 * Confirma un pago (simula aprobación de pasarela).
 * Actualiza order.status a "Pagado" y crea notificaciones.
 */
async function confirmPayment(userId, orderId, { transactionId, method } = {}) {
  const { order, payment } = await getOwnedOrderAndPayment(userId, orderId);

  const normalizedMethod = PAYMENT_METHODS.has(method) ? method : null;

  if (payment.status === 'Aprobado') {
    throw new HttpError(400, 'El pago ya fue confirmado.');
  }

  await payment.update({
    status: 'Aprobado',
    paidAt: new Date(),
    transactionId: transactionId || payment.transactionId,
    ...(normalizedMethod ? { method: normalizedMethod } : {}),
  });

  await order.update({ status: 'Pagado', paymentStatus: 'Pagado' });

  // Notificación al usuario
  await Notification.create({
    userId,
    type: 'Pago confirmado',
    message: `Tu pago del pedido #${order.id} fue confirmado. Pronto procesaremos tu envío.`,
  });

  return toPublic(payment);
}

async function confirmManualPayment(userId, orderId) {
  const { payment } = await getOwnedOrderAndPayment(userId, orderId);

  if (payment.status === 'Aprobado') {
    return toPublic(payment);
  }

  throw new HttpError(
    400,
    'La confirmacion manual ya no esta disponible. Completa el pago desde Stripe, PayPal, Mercado Pago u OXXO y despues actualiza el estado.'
  );
}

async function confirmPaymentByOrder(orderId, { transactionId, method } = {}) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new HttpError(404, 'Pedido no encontrado.');
  }

  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    throw new HttpError(404, 'Pago no registrado para este pedido.');
  }

  if (payment.status === 'Aprobado') {
    return toPublic(payment);
  }

  const normalizedMethod = PAYMENT_METHODS.has(method) ? method : null;

  await payment.update({
    status: 'Aprobado',
    paidAt: new Date(),
    transactionId: transactionId || payment.transactionId,
    ...(normalizedMethod ? { method: normalizedMethod } : {}),
  });

  await order.update({ status: 'Pagado', paymentStatus: 'Pagado' });

  await Notification.create({
    userId: order.userId,
    type: 'Pago confirmado',
    message: `Tu pago del pedido #${order.id} fue confirmado. Pronto procesaremos tu envío.`,
  });

  return toPublic(payment);
}

async function markPaymentFailedByOrder(orderId, { transactionId } = {}) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    return null;
  }

  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    return null;
  }

  if (isApprovedPaymentStatus(payment.status) || isApprovedPaymentStatus(order.paymentStatus)) {
    return toPublic(payment);
  }

  await payment.update({
    status: 'Rechazado',
    transactionId: transactionId || payment.transactionId,
  });

  await order.update({ paymentStatus: 'Fallido' });

  return toPublic(payment);
}

async function createStripeCheckoutSession(userId, orderId) {
  const { order, payment } = await getOwnedOrderAndPayment(userId, orderId);

  if (payment.status === 'Aprobado') {
    throw new HttpError(400, 'El pedido ya se encuentra pagado.');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const stripe = getStripeClient();
  const amount = Math.max(1, Math.round(Number(payment.amount || order.total || 0) * 100));
  const customerEmail = await resolveStripeCustomerEmail(userId);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${frontendUrl}/usuarios/pagos?gateway=stripe&status=success&orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/usuarios/pagos?gateway=stripe&status=cancel&orderId=${order.id}`,
    client_reference_id: String(order.id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'mxn',
          unit_amount: amount,
          product_data: {
            name: `Pedido #${order.id}`,
          },
        },
      },
    ],
    metadata: {
      orderId: String(order.id),
      userId: String(userId),
    },
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    payment_intent_data: {
      metadata: {
        orderId: String(order.id),
        userId: String(userId),
      },
    },
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

function toMoney(value) {
  if (value === null || value === undefined) return null;
  return Number(value) / 100;
}

function toSafeStripeSession(session) {
  if (!session) return null;

  return {
    id: session.id,
    status: session.status || null,
    paymentStatus: session.payment_status || null,
    amountTotal: toMoney(session.amount_total),
    amountSubtotal: toMoney(session.amount_subtotal),
    currency: session.currency || null,
    paymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null,
    customerId: typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || null,
    created: session.created || null,
  };
}

function toSafeStripeCharge(charge) {
  if (!charge) return null;

  const balanceTransaction = typeof charge.balance_transaction === 'string'
    ? null
    : charge.balance_transaction;

  return {
    id: charge.id,
    status: charge.status || null,
    paid: Boolean(charge.paid),
    captured: Boolean(charge.captured),
    amount: toMoney(charge.amount),
    amountCaptured: toMoney(charge.amount_captured),
    amountRefunded: toMoney(charge.amount_refunded),
    currency: charge.currency || null,
    paymentMethod: charge.payment_method_details?.type || null,
    balanceTransactionId: typeof charge.balance_transaction === 'string'
      ? charge.balance_transaction
      : charge.balance_transaction?.id || null,
    balanceTransaction: balanceTransaction
      ? {
          id: balanceTransaction.id,
          amount: toMoney(balanceTransaction.amount),
          fee: toMoney(balanceTransaction.fee),
          net: toMoney(balanceTransaction.net),
          currency: balanceTransaction.currency || null,
          status: balanceTransaction.status || null,
          type: balanceTransaction.type || null,
          availableOn: balanceTransaction.available_on || null,
          created: balanceTransaction.created || null,
        }
      : null,
    created: charge.created || null,
  };
}

function toSafeStripePaymentIntent(intent) {
  if (!intent) return null;

  const latestCharge = typeof intent.latest_charge === 'string'
    ? null
    : intent.latest_charge;

  return {
    id: intent.id,
    status: intent.status || null,
    amount: toMoney(intent.amount),
    amountReceived: toMoney(intent.amount_received),
    currency: intent.currency || null,
    customerId: typeof intent.customer === 'string'
      ? intent.customer
      : intent.customer?.id || null,
    paymentMethodId: typeof intent.payment_method === 'string'
      ? intent.payment_method
      : intent.payment_method?.id || null,
    latestChargeId: typeof intent.latest_charge === 'string'
      ? intent.latest_charge
      : intent.latest_charge?.id || null,
    lastPaymentError: intent.last_payment_error?.message || null,
    created: intent.created || null,
    charge: toSafeStripeCharge(latestCharge),
  };
}

async function getStripeDiagnostics(userId, orderId, { sessionId, paymentIntentId } = {}) {
  const { payment } = await getOwnedOrderAndPayment(userId, orderId);
  const stripe = getStripeClient();

  let session = null;
  if (sessionId) {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge.balance_transaction'],
    });

    const sessionOrderId = Number(session.metadata?.orderId || session.client_reference_id || 0);
    if (sessionOrderId && sessionOrderId !== Number(orderId)) {
      throw new HttpError(400, 'La sesion Stripe no corresponde al pedido solicitado.');
    }
  }

  const txId = String(payment.transactionId || '');
  let resolvedIntentId = paymentIntentId || null;

  if (!resolvedIntentId && txId.startsWith('pi_')) {
    resolvedIntentId = txId;
  }

  if (!resolvedIntentId && session?.payment_intent) {
    resolvedIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;
  }

  let paymentIntent = null;
  if (resolvedIntentId) {
    paymentIntent = await stripe.paymentIntents.retrieve(resolvedIntentId, {
      expand: ['latest_charge.balance_transaction'],
    });

    const intentOrderId = Number(paymentIntent.metadata?.orderId || 0);
    if (intentOrderId && intentOrderId !== Number(orderId)) {
      throw new HttpError(400, 'El PaymentIntent de Stripe no corresponde al pedido solicitado.');
    }
  }

  let charge = paymentIntent?.latest_charge;
  if (!charge && txId.startsWith('ch_')) {
    charge = await stripe.charges.retrieve(txId, {
      expand: ['balance_transaction'],
    });
  }

  const safeSession = toSafeStripeSession(session);
  const safeIntent = toSafeStripePaymentIntent(paymentIntent);
  const safeCharge = toSafeStripeCharge(typeof charge === 'string' ? null : charge);
  const effectiveCharge = safeIntent?.charge || safeCharge;

  const reflectsInStripeBalance = Boolean(
    effectiveCharge?.paid
    && effectiveCharge?.balanceTransactionId
  );

  return {
    orderId: Number(orderId),
    local: {
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      amount: Number(payment.amount),
      transactionId: payment.transactionId || null,
      paidAt: payment.paidAt || null,
    },
    stripe: {
      session: safeSession,
      paymentIntent: safeIntent,
      charge: effectiveCharge,
    },
    reflectsInStripeBalance,
    hint: reflectsInStripeBalance
      ? 'Stripe ya genero balance_transaction para este cobro.'
      : 'Aun no hay balance_transaction confirmado; revisa que el PaymentIntent termine en succeeded.',
  };
}

async function processStripeWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new HttpError(500, 'Falta configurar STRIPE_WEBHOOK_SECRET en el servidor.');
  }

  if (!signature) {
    throw new HttpError(400, 'Falta cabecera stripe-signature.');
  }

  const stripe = getStripeClient();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (_error) {
    throw new HttpError(400, 'Firma de webhook Stripe invalida.');
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return { processed: false, reason: 'session_not_paid', eventType: event.type };
    }

    const orderId = Number(session.metadata?.orderId || session.client_reference_id || 0);
    if (!orderId) {
      return { processed: false, reason: 'missing_order_id', eventType: event.type };
    }

    const payment = await confirmPaymentByOrder(orderId, {
      transactionId: String(session.payment_intent || session.id),
      method: 'Tarjeta',
    });

    return {
      processed: true,
      eventType: event.type,
      orderId,
      payment,
    };
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId || session.client_reference_id || 0);

    if (!orderId) {
      return { processed: false, reason: 'missing_order_id', eventType: event.type };
    }

    const payment = await markPaymentFailedByOrder(orderId, {
      transactionId: String(session.payment_intent || session.id),
    });

    return {
      processed: true,
      eventType: event.type,
      orderId,
      payment,
    };
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const orderId = Number(intent.metadata?.orderId || 0);

    if (!orderId) {
      return { processed: false, reason: 'missing_order_id', eventType: event.type };
    }

    const payment = await confirmPaymentByOrder(orderId, {
      transactionId: String(intent.latest_charge || intent.id),
      method: intent.metadata?.gateway === 'oxxo' ? 'Efectivo' : 'Tarjeta',
    });

    return {
      processed: true,
      eventType: event.type,
      orderId,
      payment,
    };
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const orderId = Number(intent.metadata?.orderId || 0);

    if (!orderId) {
      return { processed: false, reason: 'missing_order_id', eventType: event.type };
    }

    const payment = await markPaymentFailedByOrder(orderId, {
      transactionId: String(intent.latest_charge || intent.id),
    });

    return {
      processed: true,
      eventType: event.type,
      orderId,
      payment,
    };
  }

  return {
    processed: false,
    reason: 'ignored_event',
    eventType: event.type,
  };
}

async function confirmStripeSession(userId, orderId, { sessionId }) {
  if (!sessionId) {
    throw new HttpError(400, 'sessionId es obligatorio para confirmar Stripe.');
  }

  const { payment } = await getOwnedOrderAndPayment(userId, orderId);
  if (payment.status === 'Aprobado') {
    return toPublic(payment);
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session || session.payment_status !== 'paid') {
    throw new HttpError(400, 'El pago de Stripe aun no esta aprobado.');
  }

  const metadataOrderId = Number(session.metadata?.orderId || 0);
  if (metadataOrderId !== Number(orderId)) {
    throw new HttpError(400, 'La sesion Stripe no corresponde al pedido.');
  }

  return confirmPayment(userId, orderId, {
    transactionId: String(session.payment_intent || session.id),
    method: 'Tarjeta',
  });
}

async function createStripeOxxoVoucher(userId, orderId, { customerEmail } = {}) {
  const { order, payment } = await getOwnedOrderAndPayment(userId, orderId);

  if (payment.status === 'Aprobado') {
    throw new HttpError(400, 'El pedido ya se encuentra pagado.');
  }

  const stripe = getStripeClient();
  const resolvedEmail = await resolveOxxoCustomerEmail(userId, customerEmail);
  const amount = Math.max(1, Math.round(Number(payment.amount || order.total || 0) * 100));
  const expiresAfterDays = Math.min(
    7,
    Math.max(1, Number(process.env.STRIPE_OXXO_EXPIRES_AFTER_DAYS || 2))
  );

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'mxn',
    payment_method_types: ['oxxo'],
    payment_method_data: {
      type: 'oxxo',
      billing_details: {
        email: resolvedEmail,
      },
    },
    confirm: true,
    receipt_email: resolvedEmail,
    payment_method_options: {
      oxxo: {
        expires_after_days: expiresAfterDays,
      },
    },
    metadata: {
      orderId: String(order.id),
      userId: String(userId),
      gateway: 'oxxo',
    },
  });

  await payment.update({
    method: 'Efectivo',
    status: 'Pendiente',
    transactionId: intent.id,
  });

  const voucherUrl = intent.next_action?.oxxo_display_details?.hosted_voucher_url || null;
  const expiresAfter = intent.next_action?.oxxo_display_details?.expires_after || null;
  const number = intent.next_action?.oxxo_display_details?.number || null;

  if (!voucherUrl) {
    throw new HttpError(
      502,
      'Stripe no devolvio la ficha OXXO. Verifica que OXXO este habilitado en modo test y que el monto sea valido.'
    );
  }

  return {
    paymentIntentId: intent.id,
    status: intent.status,
    voucherUrl,
    expiresAfter,
    number,
  };
}

async function checkStripeOxxoStatus(userId, orderId, { paymentIntentId } = {}) {
  const { payment } = await getOwnedOrderAndPayment(userId, orderId);
  const resolvedPaymentIntentId = paymentIntentId || payment.transactionId;

  if (!resolvedPaymentIntentId || !String(resolvedPaymentIntentId).startsWith('pi_')) {
    throw new HttpError(400, 'No se encontro referencia valida de PaymentIntent para revisar pago OXXO.');
  }

  const stripe = getStripeClient();
  const intent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId);

  const metadataOrderId = Number(intent.metadata?.orderId || 0);
  if (metadataOrderId && metadataOrderId !== Number(orderId)) {
    throw new HttpError(400, 'La referencia OXXO no corresponde al pedido.');
  }

  if (intent.status === 'succeeded' && payment.status !== 'Aprobado') {
    const updated = await confirmPayment(userId, orderId, {
      transactionId: String(intent.latest_charge || intent.id),
      method: 'Efectivo',
    });
    return {
      paid: true,
      payment: updated,
      status: intent.status,
    };
  }

  const voucherUrl = intent.next_action?.oxxo_display_details?.hosted_voucher_url || null;
  const expiresAfter = intent.next_action?.oxxo_display_details?.expires_after || null;
  const number = intent.next_action?.oxxo_display_details?.number || null;

  return {
    paid: payment.status === 'Aprobado',
    payment: toPublic(payment),
    status: intent.status,
    voucherUrl,
    expiresAfter,
    number,
  };
}

async function createPayPalOrder(userId, orderId) {
  const { order, payment } = await getOwnedOrderAndPayment(userId, orderId);

  if (payment.status === 'Aprobado') {
    throw new HttpError(400, 'El pedido ya se encuentra pagado.');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const accessToken = await getPayPalAccessToken();
  const amount = Number(payment.amount || order.total || 0).toFixed(2);

  const orderResponse = await httpsRequest(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: String(order.id),
          amount: {
            currency_code: 'MXN',
            value: amount,
          },
          description: `Pedido #${order.id}`,
        },
      ],
      application_context: {
        return_url: `${frontendUrl}/usuarios/pagos?gateway=paypal&status=success&orderId=${order.id}`,
        cancel_url: `${frontendUrl}/usuarios/pagos?gateway=paypal&status=cancel&orderId=${order.id}`,
        user_action: 'PAY_NOW',
      },
    }),
  });

  const approveLink = (orderResponse.links || []).find((item) => item.rel === 'approve');
  if (!approveLink?.href) {
    throw new HttpError(502, 'No se obtuvo URL de aprobacion de PayPal.');
  }

  return {
    paypalOrderId: orderResponse.id,
    approveUrl: approveLink.href,
  };
}

async function capturePayPalOrder(userId, orderId, { paypalOrderId }) {
  if (!paypalOrderId) {
    throw new HttpError(400, 'paypalOrderId es obligatorio para capturar PayPal.');
  }

  const { payment } = await getOwnedOrderAndPayment(userId, orderId);
  if (payment.status === 'Aprobado') {
    return toPublic(payment);
  }

  const accessToken = await getPayPalAccessToken();
  const captureResponse = await httpsRequest(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (captureResponse.status !== 'COMPLETED') {
    throw new HttpError(400, 'El pago de PayPal no se completo.');
  }

  const captureId = captureResponse.purchase_units?.[0]?.payments?.captures?.[0]?.id || paypalOrderId;

  return confirmPayment(userId, orderId, {
    transactionId: String(captureId),
    method: 'Transferencia',
  });
}

async function createMercadoPagoPreference(userId, orderId) {
  const { order, payment } = await getOwnedOrderAndPayment(userId, orderId);

  if (payment.status === 'Aprobado') {
    throw new HttpError(400, 'El pedido ya se encuentra pagado.');
  }

  const accessToken = getMercadoPagoAccessToken();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const apiBase = process.env.API_BASE_URL || 'http://localhost:4001/api';
  const amount = Number(payment.amount || order.total || 0).toFixed(2);

  const preference = await httpsRequest(`${MERCADOPAGO_BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: `order-${order.id}`,
          title: `Pedido #${order.id}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: Number(amount),
        },
      ],
      external_reference: `${order.id}:${userId}`,
      metadata: {
        orderId: String(order.id),
        userId: String(userId),
      },
      notification_url: `${apiBase}/pagos/mercadopago/webhook`,
      back_urls: {
        success: `${frontendUrl}/usuarios/pagos?gateway=mercadopago&status=success&orderId=${order.id}`,
        pending: `${frontendUrl}/usuarios/pagos?gateway=mercadopago&status=pending&orderId=${order.id}`,
        failure: `${frontendUrl}/usuarios/pagos?gateway=mercadopago&status=cancel&orderId=${order.id}`,
      },
      auto_return: 'approved',
    }),
  });

  await payment.update({
    status: 'Pendiente',
    method: 'Transferencia',
    transactionId: preference.id || payment.transactionId,
  });

  return {
    preferenceId: preference.id,
    checkoutUrl: preference.init_point || preference.sandbox_init_point || null,
    sandboxCheckoutUrl: preference.sandbox_init_point || null,
  };
}

async function fetchMercadoPagoPayment(paymentId) {
  const accessToken = getMercadoPagoAccessToken();

  const paymentData = await httpsRequest(`${MERCADOPAGO_BASE_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return paymentData;
}

function parseExternalReference(externalReference = '') {
  const [orderIdRaw, userIdRaw] = String(externalReference || '').split(':');
  const orderId = Number(orderIdRaw || 0);
  const userId = Number(userIdRaw || 0);
  return { orderId, userId };
}

function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function resolveOxxoCustomerEmail(userId, providedEmail) {
  if (isValidEmail(providedEmail)) {
    return String(providedEmail).trim();
  }

  const usuario = await Usuario.findByPk(userId, { attributes: ['email'] }).catch(() => null);
  if (isValidEmail(usuario?.email)) {
    return String(usuario.email).trim();
  }

  throw new HttpError(400, 'Se requiere un email valido del cliente para generar ficha OXXO.');
}

async function resolveStripeCustomerEmail(userId) {
  const usuario = await Usuario.findByPk(userId, { attributes: ['email'] }).catch(() => null);
  if (isValidEmail(usuario?.email)) {
    return String(usuario.email).trim();
  }

  return null;
}

async function confirmMercadoPagoPayment(userId, orderId, { paymentId }) {
  if (!paymentId) {
    throw new HttpError(400, 'paymentId es obligatorio para confirmar Mercado Pago.');
  }

  const { payment } = await getOwnedOrderAndPayment(userId, orderId);
  if (payment.status === 'Aprobado') {
    return toPublic(payment);
  }

  const paymentData = await fetchMercadoPagoPayment(paymentId);
  if (!paymentData) {
    throw new HttpError(404, 'Pago de Mercado Pago no encontrado.');
  }

  const ref = parseExternalReference(paymentData.external_reference);
  if (ref.orderId !== Number(orderId) || ref.userId !== Number(userId)) {
    throw new HttpError(400, 'El pago de Mercado Pago no corresponde al pedido del usuario.');
  }

  if (paymentData.status !== 'approved') {
    throw new HttpError(400, `El pago de Mercado Pago no esta aprobado (status: ${paymentData.status}).`);
  }

  return confirmPayment(userId, orderId, {
    transactionId: String(paymentData.id),
    method: 'Transferencia',
  });
}

async function processMercadoPagoWebhook(payload = {}, query = {}) {
  const type = String(payload.type || payload.topic || query.type || query.topic || '').toLowerCase();
  const action = String(payload.action || '').toLowerCase();

  if (type && type !== 'payment') {
    return { processed: false, reason: 'unsupported_topic' };
  }

  if (action && !action.includes('payment')) {
    return { processed: false, reason: 'unsupported_action' };
  }

  const paymentId = payload?.data?.id || query['data.id'] || query.id;
  if (!paymentId) {
    return { processed: false, reason: 'missing_payment_id' };
  }

  const paymentData = await fetchMercadoPagoPayment(paymentId);
  const ref = parseExternalReference(paymentData.external_reference);

  if (!ref.orderId) {
    return { processed: false, reason: 'missing_external_reference' };
  }

  if (paymentData.status !== 'approved') {
    return {
      processed: false,
      reason: 'not_approved',
      status: paymentData.status,
      orderId: ref.orderId,
    };
  }

  const confirmed = await confirmPaymentByOrder(ref.orderId, {
    transactionId: String(paymentData.id),
    method: 'Transferencia',
  });

  return {
    processed: true,
    orderId: ref.orderId,
    paymentId: paymentData.id,
    payment: confirmed,
  };
}

/**
 * Actualiza el status de pago (admin).
 */
async function updatePaymentStatus(orderId, { status, transactionId }) {
  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) {
    throw new HttpError(404, 'Pago no encontrado.');
  }

  const normalizedStatus = normalizePaymentStatus(status);

  const update = { status: normalizedStatus };
  if (transactionId) update.transactionId = transactionId;
  if (normalizedStatus === 'Aprobado' && !payment.paidAt) update.paidAt = new Date();

  await payment.update(update);

  if (normalizedStatus === 'Aprobado') {
    await Order.update(
      { status: normalizeOrderStatus('paid'), paymentStatus: 'Pagado' },
      { where: { id: orderId } }
    );

    const order = await Order.findByPk(orderId);
    if (order) {
      await Notification.create({
        userId: order.userId,
        type: 'Pago confirmado',
        message: `Tu pago del pedido #${orderId} fue aprobado.`,
      });
    }
  }

  if (normalizedStatus === 'Rechazado') {
    await Order.update({ paymentStatus: 'Fallido' }, { where: { id: orderId } });
  }

  return toPublic(payment);
}

module.exports = {
  getPaymentByOrder,
  getStripeDiagnostics,
  confirmPayment,
  confirmManualPayment,
  updatePaymentStatus,
  createStripeCheckoutSession,
  confirmStripeSession,
  createStripeOxxoVoucher,
  checkStripeOxxoStatus,
  createPayPalOrder,
  capturePayPalOrder,
  createMercadoPagoPreference,
  confirmMercadoPagoPayment,
  processStripeWebhook,
  processMercadoPagoWebhook,
};
