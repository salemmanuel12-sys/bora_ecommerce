const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
  validateProductoOpinionIdParam,
  validateProductoOpinionStatusBody,
} = require('../../middlewares/productoOpinionValidation.middleware');
const productoOpinionController = require('./productoOpinion.controller');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/pendientes', productoOpinionController.adminListPendientes);
router.patch(
  '/:opinionId/status',
  validateProductoOpinionIdParam,
  validateProductoOpinionStatusBody,
  productoOpinionController.adminUpdateStatus
);

module.exports = router;
