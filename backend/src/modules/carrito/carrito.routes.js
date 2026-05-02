const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const carritoController = require('./carrito.controller');

const router = express.Router();

// Todas las rutas requieren autenticación de usuario
router.use(usuarioAuthMiddleware);

router.get('/', carritoController.getCart);
router.post('/items', carritoController.addItem);
router.put('/items/:itemId', carritoController.updateItem);
router.delete('/items/:itemId', carritoController.removeItem);
router.delete('/', carritoController.clearCart);

module.exports = router;
