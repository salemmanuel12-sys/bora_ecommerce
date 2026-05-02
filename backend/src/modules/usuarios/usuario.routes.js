const express = require('express');
const usuarioMiddleware = require('../../middlewares/usuario.middleware');
const {
	validateListUsuariosQuery,
} = require('../../middlewares/usuarioValidation.middleware');
const usuarioController = require('./usuario.controller');

const router = express.Router();

router.get('/health', usuarioMiddleware, usuarioController.health);
router.get('/list', usuarioMiddleware, validateListUsuariosQuery, usuarioController.list);
router.post('/auth/login', usuarioMiddleware, usuarioController.login);
router.post('/auth/social', usuarioMiddleware, usuarioController.socialLogin);
router.post('/auth/register', usuarioMiddleware, usuarioController.register);
router.post('/auth/verify-email', usuarioMiddleware, usuarioController.verifyEmail);

module.exports = router;
