const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateCategoriaIdParam,
  validateCreateCategoria,
  validateUpdateCategoria,
  validateCategoriaStatus,
  validateListCategoriasQuery,
} = require('../../middlewares/categoriaValidation.middleware');
const { handleUploadCategoriaImagen } = require('../../middlewares/upload.middleware');
const categoriaController = require('./categoria.controller');

const router = express.Router();

router.get('/public', validateListCategoriasQuery, categoriaController.listPublicCategorias);
router.get('/', adminAuthMiddleware, validateListCategoriasQuery, categoriaController.listCategorias);
router.get('/:categoriaId', adminAuthMiddleware, validateCategoriaIdParam, categoriaController.getCategoria);
router.post('/', adminAuthMiddleware, handleUploadCategoriaImagen, validateCreateCategoria, categoriaController.createCategoria);
router.put('/:categoriaId', adminAuthMiddleware, validateCategoriaIdParam, handleUploadCategoriaImagen, validateUpdateCategoria, categoriaController.updateCategoria);
router.patch('/:categoriaId/status', adminAuthMiddleware, validateCategoriaStatus, categoriaController.updateCategoriaStatus);
router.delete('/:categoriaId', adminAuthMiddleware, validateCategoriaIdParam, categoriaController.deleteCategoria);

module.exports = router;
