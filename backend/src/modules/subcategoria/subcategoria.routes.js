const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateSubcategoriaIdParam,
  validateCreateSubcategoria,
  validateUpdateSubcategoria,
  validateSubcategoriaStatus,
  validateListSubcategoriasQuery,
} = require('../../middlewares/subcategoriaValidation.middleware');
const subcategoriaController = require('./subcategoria.controller');

const router = express.Router();

router.get('/', adminAuthMiddleware, validateListSubcategoriasQuery, subcategoriaController.listSubcategorias);
router.get('/:subcategoriaId', adminAuthMiddleware, validateSubcategoriaIdParam, subcategoriaController.getSubcategoria);
router.post('/', adminAuthMiddleware, validateCreateSubcategoria, subcategoriaController.createSubcategoria);
router.put('/:subcategoriaId', adminAuthMiddleware, validateSubcategoriaIdParam, validateUpdateSubcategoria, subcategoriaController.updateSubcategoria);
router.patch('/:subcategoriaId/status', adminAuthMiddleware, validateSubcategoriaStatus, subcategoriaController.updateSubcategoriaStatus);
router.delete('/:subcategoriaId', adminAuthMiddleware, validateSubcategoriaIdParam, subcategoriaController.deleteSubcategoria);
router.patch('/:subcategoriaId/reactivate', adminAuthMiddleware, validateSubcategoriaIdParam, subcategoriaController.reactivateSubcategoria);

module.exports = router;
