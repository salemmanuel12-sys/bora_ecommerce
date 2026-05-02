const express = require('express');
const usuarioAuthMiddleware = require('../../middlewares/usuarioAuth.middleware');
const {
  validateProductoOpinionProductoIdParam,
  validateProductoOpinionIdParam,
  validateProductoOpinionBody,
} = require('../../middlewares/productoOpinionValidation.middleware');
const productoOpinionController = require('./productoOpinion.controller');

const router = express.Router();

router.get(
  '/productos/:productoId',
  validateProductoOpinionProductoIdParam,
  productoOpinionController.listPublicByProducto
);

router.use(usuarioAuthMiddleware);

router.get('/mis-opiniones', productoOpinionController.listMisOpiniones);
router.post(
  '/productos/:productoId',
  validateProductoOpinionProductoIdParam,
  validateProductoOpinionBody,
  productoOpinionController.upsertMiOpinion
);
router.patch(
  '/:opinionId',
  validateProductoOpinionIdParam,
  validateProductoOpinionBody,
  productoOpinionController.updateMiOpinion
);
router.delete('/:opinionId', validateProductoOpinionIdParam, productoOpinionController.deleteMiOpinion);

module.exports = router;
