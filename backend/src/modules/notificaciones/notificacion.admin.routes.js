const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const notificacionController = require('./notificacion.controller');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/', notificacionController.adminList);
router.patch('/read-all', notificacionController.adminMarkAllAsRead);
router.patch('/orders/:orderId/attend', notificacionController.adminMarkOrderAsAttended);
router.patch('/:notificacionId/read', notificacionController.adminMarkAsRead);

module.exports = router;