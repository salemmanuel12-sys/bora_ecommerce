const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateProductoIdParam,
  validateCreateProducto,
  validateUpdateProducto,
  validateProductoStatus,
  validateListProductosQuery,
} = require('../../middlewares/productoValidation.middleware');
const { handleUploadProductoImagenes } = require('../../middlewares/upload.middleware');
const productoController = require('./producto.controller');
const productoImagenController = require('./productoImagen.controller');

const router = express.Router();

// Público (catálogo ecommerce)
router.get('/public', validateListProductosQuery, productoController.listPublicProductos);
router.get('/public/:productoId', validateProductoIdParam, productoController.getPublicProducto);

// CRUD Producto
router.get('/', adminAuthMiddleware, validateListProductosQuery, productoController.listProductos);
router.get('/:productoId', adminAuthMiddleware, validateProductoIdParam, productoController.getProducto);
router.post('/', adminAuthMiddleware, validateCreateProducto, productoController.createProducto);
router.put('/:productoId', adminAuthMiddleware, validateProductoIdParam, validateUpdateProducto, productoController.updateProducto);
router.patch('/:productoId/status', adminAuthMiddleware, validateProductoStatus, productoController.updateProductoStatus);
router.delete('/:productoId', adminAuthMiddleware, validateProductoIdParam, productoController.deleteProducto);

// Imágenes de producto
router.get('/:productoId/imagenes', adminAuthMiddleware, validateProductoIdParam, productoImagenController.listImagenes);
router.post('/:productoId/imagenes', adminAuthMiddleware, validateProductoIdParam, handleUploadProductoImagenes, productoImagenController.uploadImagenes);
router.delete('/:productoId/imagenes/:imagenId', adminAuthMiddleware, validateProductoIdParam, productoImagenController.deleteImagen);
router.patch('/:productoId/imagenes/reorder', adminAuthMiddleware, validateProductoIdParam, productoImagenController.reorderImagenes);

module.exports = router;
