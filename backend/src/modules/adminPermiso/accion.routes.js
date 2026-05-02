const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const controller = require('./admin.permiso.controller');

const router = express.Router({ mergeParams: true });

router.use(adminAuthMiddleware);
router.post('/', controller.createAccion);
router.patch('/:accionId/status', controller.setAccionStatus);

module.exports = router;
