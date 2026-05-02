const permisoController = require('../adminPermiso/admin.permiso.controller');

module.exports = {
  assignPermisosJerarquicos: permisoController.replaceRolePermisos,
  replacePermisosJerarquicos: permisoController.replaceRolePermisos,
  getPermisosJerarquicosByRol: permisoController.getRolePermisos,
};
