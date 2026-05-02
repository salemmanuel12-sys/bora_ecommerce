const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const envioController = require('./envio.controller');

const router = express.Router();

// Usuario: consulta el estado de su envío
router.get('/:orderId', usuarioAuthMiddleware, envioController.getShipment);

// Admin: crear / actualizar envío con número de guía
router.put('/:orderId', adminAuthMiddleware, envioController.upsertShipment);

module.exports = router;
