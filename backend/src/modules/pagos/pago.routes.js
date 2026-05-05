const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const pagoController = require('./pago.controller');

const router = express.Router();

// Usuario: consulta y confirmación de su propio pago
router.get('/:orderId', usuarioAuthMiddleware, pagoController.getPayment);
router.get('/:orderId/stripe/diagnostics', usuarioAuthMiddleware, pagoController.getStripeDiagnostics);
router.post('/:orderId/confirm', usuarioAuthMiddleware, pagoController.confirmPayment);
router.post('/:orderId/stripe/checkout-session', usuarioAuthMiddleware, pagoController.createStripeCheckout);
router.post('/:orderId/stripe/confirm', usuarioAuthMiddleware, pagoController.confirmStripeCheckout);
router.post('/:orderId/stripe/oxxo-voucher', usuarioAuthMiddleware, pagoController.createStripeOxxoVoucher);
router.post('/:orderId/stripe/oxxo-status', usuarioAuthMiddleware, pagoController.checkStripeOxxoStatus);
router.post('/:orderId/paypal/order', usuarioAuthMiddleware, pagoController.createPayPalOrder);
router.post('/:orderId/paypal/capture', usuarioAuthMiddleware, pagoController.capturePayPalOrder);
router.post('/:orderId/mercadopago/preference', usuarioAuthMiddleware, pagoController.createMercadoPagoPreference);
router.post('/:orderId/mercadopago/confirm', usuarioAuthMiddleware, pagoController.confirmMercadoPagoPayment);

// Webhook Mercado Pago (sin auth; valida por consulta a API con Access Token)
router.post('/mercadopago/webhook', pagoController.mercadoPagoWebhook);

// Admin: actualizar estado de pago de cualquier pedido
router.patch('/:orderId/status', adminAuthMiddleware, pagoController.adminUpdatePayment);

module.exports = router;
