const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const pedidoController = require('./pedido.controller');
const paqueteAdminController = require('./paquete.admin.controller');
const {
  validatePackageIdParam,
  validateCreatePackage,
} = require('../../middlewares/adminPaqueteValidation.middleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/paquetes/catalogos/product-type', paqueteAdminController.getProductTypeCatalog);
router.get('/paquetes/catalogos/unit-type', paqueteAdminController.getUnitTypeCatalog);

router.post('/paquetes', validateCreatePackage, paqueteAdminController.createPackage);
router.get('/paquetes', paqueteAdminController.listPackages);
router.get('/paquetes/:packageId', validatePackageIdParam, paqueteAdminController.getPackageById);
router.delete('/paquetes/:packageId', validatePackageIdParam, paqueteAdminController.deletePackage);

router.get('/', pedidoController.adminList);
router.get('/:orderId', pedidoController.adminGet);

module.exports = router;