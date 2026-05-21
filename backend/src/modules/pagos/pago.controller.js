const pagoService = require('./pago.service');

async function getPayment(req, res, next) {
  try {
    const payment = await pagoService.getPaymentByOrder(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({ ok: true, data: payment });
  } catch (error) {
    return next(error);
  }
}

async function getStripeDiagnostics(req, res, next) {
  try {
    const diagnostics = await pagoService.getStripeDiagnostics(
      req.usuario.id,
      Number(req.params.orderId),
      {
        sessionId: req.query.sessionId,
        paymentIntentId: req.query.paymentIntentId,
      }
    );

    return res.status(200).json({
      ok: true,
      data: diagnostics,
    });
  } catch (error) {
    return next(error);
  }
}

async function confirmPayment(req, res, next) {
  try {
    console.log('[PagoController] Intento de confirmacion manual de pago', {
      userId: req.usuario.id,
      orderId: Number(req.params.orderId),
    });
    const payment = await pagoService.confirmManualPayment(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({
      ok: true,
      message: 'Pago confirmado correctamente.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function createStripeCheckout(req, res, next) {
  const orderId = Number(req.params.orderId);
  const userId = req.usuario?.id;

  console.info('[Stripe][Checkout] Intento de crear sesion', {
    orderId,
    userId,
  });

  try {
    const data = await pagoService.createStripeCheckoutSession(
      userId,
      orderId
    );

    console.info('[Stripe][Checkout] Sesion creada', {
      orderId,
      userId,
      sessionId: data?.sessionId || null,
      hasCheckoutUrl: Boolean(data?.checkoutUrl),
    });

    return res.status(200).json({
      ok: true,
      message: 'Sesion Stripe creada correctamente.',
      data,
    });
  } catch (error) {
    console.error('[Stripe][Checkout] Error creando sesion', {
      orderId,
      userId,
      status: error?.status || error?.statusCode || 500,
      type: error?.type || error?.rawType || null,
      code: error?.code || error?.raw?.code || null,
      message: error?.message || 'Error desconocido creando sesion Stripe.',
      requestId: error?.requestId || error?.raw?.requestId || null,
    });
    return next(error);
  }
}

async function confirmStripeCheckout(req, res, next) {
  try {
    const payment = await pagoService.confirmStripeSession(
      req.usuario.id,
      Number(req.params.orderId),
      { sessionId: req.body.sessionId }
    );
    return res.status(200).json({
      ok: true,
      message: 'Pago Stripe confirmado correctamente.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function stripeWebhook(req, res, next) {
  const requestId = `stripe_wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const signature = req.headers['stripe-signature'];
  const contentType = req.headers['content-type'] || null;
  const contentLength = req.headers['content-length'] || null;
  const bodyIsBuffer = Buffer.isBuffer(req.body);

  console.info('[Stripe][Webhook] Solicitud recibida', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    hasSignature: Boolean(signature),
    contentType,
    contentLength,
    bodyIsBuffer,
  });

  try {
    const result = await pagoService.processStripeWebhook(
      req.body,
      signature
    );

    console.info('[Stripe][Webhook] Solicitud procesada', {
      requestId,
      processed: Boolean(result?.processed),
      eventType: result?.eventType || null,
      orderId: result?.orderId || null,
      reason: result?.reason || null,
    });

    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    console.error('[Stripe][Webhook] Error procesando solicitud', {
      requestId,
      status: error?.status || error?.statusCode || 500,
      message: error?.message || 'Error desconocido en webhook Stripe.',
      type: error?.type || error?.rawType || null,
      code: error?.code || error?.raw?.code || null,
      requestIdStripe: error?.requestId || error?.raw?.requestId || null,
    });
    return next(error);
  }
}

async function createPayPalOrder(req, res, next) {
  try {
    const data = await pagoService.createPayPalOrder(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({
      ok: true,
      message: 'Orden de PayPal creada correctamente.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function createStripeOxxoVoucher(req, res, next) {
  try {
    const data = await pagoService.createStripeOxxoVoucher(
      req.usuario.id,
      Number(req.params.orderId),
      { customerEmail: req.body.customerEmail }
    );
    return res.status(200).json({
      ok: true,
      message: 'Ficha OXXO generada correctamente.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function checkStripeOxxoStatus(req, res, next) {
  try {
    const data = await pagoService.checkStripeOxxoStatus(
      req.usuario.id,
      Number(req.params.orderId),
      { paymentIntentId: req.body.paymentIntentId }
    );
    return res.status(200).json({
      ok: true,
      message: 'Estado OXXO consultado correctamente.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function capturePayPalOrder(req, res, next) {
  try {
    const payment = await pagoService.capturePayPalOrder(
      req.usuario.id,
      Number(req.params.orderId),
      { paypalOrderId: req.body.paypalOrderId }
    );
    return res.status(200).json({
      ok: true,
      message: 'Pago PayPal capturado correctamente.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function createMercadoPagoPreference(req, res, next) {
  try {
    const data = await pagoService.createMercadoPagoPreference(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({
      ok: true,
      message: 'Preferencia de Mercado Pago creada correctamente.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function confirmMercadoPagoPayment(req, res, next) {
  try {
    const payment = await pagoService.confirmMercadoPagoPayment(
      req.usuario.id,
      Number(req.params.orderId),
      { paymentId: req.body.paymentId }
    );
    return res.status(200).json({
      ok: true,
      message: 'Pago de Mercado Pago confirmado correctamente.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function mercadoPagoWebhook(req, res, next) {
  try {
    const result = await pagoService.processMercadoPagoWebhook(req.body, req.query);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    return next(error);
  }
}

// Admin only
async function adminUpdatePayment(req, res, next) {
  try {
    const payment = await pagoService.updatePaymentStatus(Number(req.params.orderId), {
      status: req.body.status,
      transactionId: req.body.transactionId,
    });
    return res.status(200).json({
      ok: true,
      message: 'Estado de pago actualizado.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPayment,
  getStripeDiagnostics,
  confirmPayment,
  createStripeCheckout,
  confirmStripeCheckout,
  stripeWebhook,
  createStripeOxxoVoucher,
  checkStripeOxxoStatus,
  createPayPalOrder,
  capturePayPalOrder,
  createMercadoPagoPreference,
  confirmMercadoPagoPayment,
  mercadoPagoWebhook,
  adminUpdatePayment,
};
