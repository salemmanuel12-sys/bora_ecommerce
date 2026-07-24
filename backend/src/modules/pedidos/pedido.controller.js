const pedidoService = require('./pedido.service');

async function shippingQuotes(req, res, next) {
  try {
    const quotes = await pedidoService.shippingQuotes(req.usuario.id, {
      shippingAddressId: req.body.shippingAddressId,
    });
    return res.status(200).json({
      ok: true,
      data: quotes,
    });
  } catch (error) {
    return next(error);
  }
}

async function checkout(req, res, next) {
  try {
    const order = await pedidoService.checkout(req.usuario.id, {
      shippingAddressId: req.body.shippingAddressId,
      shippingProviderServiceId: req.body.shippingProviderServiceId,
      paymentMethod: req.body.paymentMethod,
      cardId: req.body.cardId,
      card: req.body.card,
    });
    return res.status(201).json({
      ok: true,
      message: 'Pedido creado correctamente.',
      data: order,
    });
  } catch (error) {
    return next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const result = await pedidoService.listOrders(req.usuario.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({
      ok: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await pedidoService.getOrder(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({ ok: true, data: order });
  } catch (error) {
    return next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await pedidoService.cancelOrder(
      req.usuario.id,
      Number(req.params.orderId)
    );
    return res.status(200).json({
      ok: true,
      message: 'Pedido cancelado.',
      data: order,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminList(req, res, next) {
  try {
    const result = await pedidoService.adminListOrders({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
    });
    return res.status(200).json({
      ok: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminGet(req, res, next) {
  try {
    const order = await pedidoService.adminGetOrder(Number(req.params.orderId));
    return res.status(200).json({ ok: true, data: order });
  } catch (error) {
    return next(error);
  }
}

module.exports = { shippingQuotes, checkout, listOrders, getOrder, cancelOrder, adminList, adminGet };
