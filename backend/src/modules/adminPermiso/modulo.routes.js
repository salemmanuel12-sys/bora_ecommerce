const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const controller = require('./admin.permiso.controller');

const router = express.Router();

router.use(adminAuthMiddleware);
router.post('/', controller.createModulo);
router.patch('/:moduloId/status', controller.setModuloStatus);

module.exports = router;
