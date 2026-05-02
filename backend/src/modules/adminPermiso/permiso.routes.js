const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const controller = require('./admin.permiso.controller');
const v = require('../../middlewares/adminPermisoValidation.middleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// ── Catalog & role permisos ─────────────────────────────────────────────────
router.get('/catalogo', controller.getCatalog);
router.get('/roles/:roleId', v.validateRoleIdParam, controller.getRolePermisos);
router.put('/roles/:roleId', v.validateRoleIdParam, v.validateRolePermisos, controller.replaceRolePermisos);

// ── Módulos ─────────────────────────────────────────────────────────────────
router.get('/modulos', controller.listModulos);
router.post('/modulos', v.validateCreateModulo, controller.createModulo);
router.put('/modulos/:moduloId', v.validateModuloIdParam, controller.updateModulo);
router.delete('/modulos/:moduloId', v.validateModuloIdParam, controller.deleteModulo);
router.patch('/modulos/:moduloId/status', v.validateModuloIdParam, v.validatePermisoStatus, controller.setModuloStatus);
router.patch('/modulos/:moduloId/reactivate', v.validateModuloIdParam, controller.reactivateModulo);

// ── Submódulos ──────────────────────────────────────────────────────────────
router.get('/modulos/:moduloId/submodulos', v.validateModuloIdParam, controller.listSubmodulos);
router.post('/modulos/:moduloId/submodulos', v.validateModuloIdParam, v.validateCreateSubmodulo, controller.createSubmodulo);
router.put('/modulos/:moduloId/submodulos/:submoduloId', v.validateModuloIdParam, v.validateSubmoduloIdParam, controller.updateSubmodulo);
router.delete('/modulos/:moduloId/submodulos/:submoduloId', v.validateModuloIdParam, v.validateSubmoduloIdParam, controller.deleteSubmodulo);
router.patch('/modulos/:moduloId/submodulos/:submoduloId/reactivate', v.validateModuloIdParam, v.validateSubmoduloIdParam, controller.reactivateSubmodulo);
router.patch('/submodulos/:submoduloId/status', v.validateSubmoduloIdParam, v.validatePermisoStatus, controller.setSubmoduloStatus);

// ── Acciones ────────────────────────────────────────────────────────────────
router.get('/modulos/:moduloId/submodulos/:submoduloId/acciones', v.validateModuloIdParam, v.validateSubmoduloIdParam, controller.listAcciones);
router.post('/modulos/:moduloId/submodulos/:submoduloId/acciones', v.validateModuloIdParam, v.validateSubmoduloIdParam, v.validateCreateAccion, controller.createAccion);
router.put('/modulos/:moduloId/submodulos/:submoduloId/acciones/:accionId', v.validateModuloIdParam, v.validateSubmoduloIdParam, v.validateAccionIdParam, controller.updateAccion);
router.delete('/modulos/:moduloId/submodulos/:submoduloId/acciones/:accionId', v.validateModuloIdParam, v.validateSubmoduloIdParam, v.validateAccionIdParam, controller.deleteAccion);
router.patch('/modulos/:moduloId/submodulos/:submoduloId/acciones/:accionId/reactivate', v.validateModuloIdParam, v.validateSubmoduloIdParam, v.validateAccionIdParam, controller.reactivateAccion);
router.post('/submodulos/:submoduloId/acciones', v.validateSubmoduloIdParam, v.validateCreateAccion, controller.createAccion);
router.patch('/acciones/:accionId/status', v.validateAccionIdParam, v.validatePermisoStatus, controller.setAccionStatus);

module.exports = router;
