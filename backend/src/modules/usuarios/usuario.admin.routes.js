const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateListUsuariosQuery,
  validateUsuarioIdParam,
  validateUsuarioStatusBody,
} = require('../../middlewares/usuarioValidation.middleware');
const usuarioController = require('./usuario.controller');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/', validateListUsuariosQuery, usuarioController.adminList);
router.patch('/:userId/status', validateUsuarioIdParam, validateUsuarioStatusBody, usuarioController.adminUpdateStatus);

module.exports = router;
