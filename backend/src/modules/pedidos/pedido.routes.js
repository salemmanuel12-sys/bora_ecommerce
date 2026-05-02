const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const pedidoController = require('./pedido.controller');

const router = express.Router();

router.use(usuarioAuthMiddleware);

router.post('/checkout', pedidoController.checkout);
router.get('/', pedidoController.listOrders);
router.get('/:orderId', pedidoController.getOrder);
router.patch('/:orderId/cancel', pedidoController.cancelOrder);

module.exports = router;
