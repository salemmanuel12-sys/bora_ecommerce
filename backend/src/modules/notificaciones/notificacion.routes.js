const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const notificacionController = require('./notificacion.controller');

const router = express.Router();

router.use(usuarioAuthMiddleware);

router.get('/', notificacionController.listNotifications);
router.patch('/read-all', notificacionController.markAllAsRead);
router.patch('/:notificacionId/read', notificacionController.markAsRead);

module.exports = router;
