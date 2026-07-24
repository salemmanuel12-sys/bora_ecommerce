const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const direccionController = require('./direccion.controller');

const router = express.Router();

router.use(usuarioAuthMiddleware);

router.get('/estados', direccionController.listMexicanStates);
router.get('/', direccionController.listAddresses);
router.post('/', direccionController.createAddress);
router.put('/:addressId', direccionController.updateAddress);
router.delete('/:addressId', direccionController.deleteAddress);

module.exports = router;
