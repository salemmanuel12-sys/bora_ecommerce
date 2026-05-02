const carritoService = require('./carrito.service');

async function getCart(req, res, next) {
  try {
    const cart = await carritoService.getCart(req.usuario.id);
    return res.status(200).json({ ok: true, data: cart });
  } catch (error) {
    return next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const cart = await carritoService.addItem(req.usuario.id, {
      productId: req.body.productId,
      quantity: req.body.quantity,
    });
    return res.status(200).json({ ok: true, message: 'Producto agregado al carrito.', data: cart });
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const cart = await carritoService.updateItem(
      req.usuario.id,
      Number(req.params.itemId),
      { quantity: req.body.quantity }
    );
    return res.status(200).json({ ok: true, message: 'Cantidad actualizada.', data: cart });
  } catch (error) {
    return next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    const cart = await carritoService.removeItem(
      req.usuario.id,
      Number(req.params.itemId)
    );
    return res.status(200).json({ ok: true, message: 'Producto eliminado del carrito.', data: cart });
  } catch (error) {
    return next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await carritoService.clearCart(req.usuario.id);
    return res.status(200).json({ ok: true, message: 'Carrito vaciado.', data: cart });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
