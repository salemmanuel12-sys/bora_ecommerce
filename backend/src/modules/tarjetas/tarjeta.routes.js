const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const tarjetaController = require('./tarjeta.controller');

const router = express.Router();

router.use(usuarioAuthMiddleware);

router.get('/', tarjetaController.listTarjetas);
router.get('/:tarjetaId', tarjetaController.getTarjeta);
router.post('/', tarjetaController.createTarjeta);
router.put('/:tarjetaId', tarjetaController.updateTarjeta);
router.delete('/:tarjetaId', tarjetaController.deleteTarjeta);

module.exports = router;
