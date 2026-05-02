const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const pedidoController = require('./pedido.controller');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/', pedidoController.adminList);
router.get('/:orderId', pedidoController.adminGet);

module.exports = router;