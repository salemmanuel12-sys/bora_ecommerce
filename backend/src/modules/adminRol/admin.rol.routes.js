const express = require('express');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const {
	validateRoleIdParam,
	validateCreateRole,
	validateUpdateRole,
	validateRoleStatus,
	validateListRolesQuery,
} = require('../../middlewares/adminRolValidation.middleware');
const adminRolController = require('./admin.rol.controller');
const permisoController = require('../adminPermiso/admin.permiso.controller');

const router = express.Router();

router.get('/', adminAuthMiddleware, validateListRolesQuery, adminRolController.listRoles);
router.get('/:roleId', adminAuthMiddleware, validateRoleIdParam, adminRolController.getRole);
router.post('/', adminAuthMiddleware, validateCreateRole, adminRolController.createRole);
router.put('/:roleId', adminAuthMiddleware, validateRoleIdParam, validateUpdateRole, adminRolController.updateRole);
router.patch('/:roleId/status', adminAuthMiddleware, validateRoleStatus, adminRolController.updateRoleStatus);
router.delete('/:roleId', adminAuthMiddleware, validateRoleIdParam, adminRolController.deleteRole);
router.patch('/:roleId/reactivate', adminAuthMiddleware, validateRoleIdParam, adminRolController.reactivateRole);
router.get('/:roleId/permisos-jerarquicos', adminAuthMiddleware, validateRoleIdParam, permisoController.getRolePermisos);
router.put('/:roleId/permisos-jerarquicos', adminAuthMiddleware, validateRoleIdParam, permisoController.replaceRolePermisos);

module.exports = router;
