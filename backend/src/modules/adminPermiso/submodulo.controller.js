const permisoController = require('./admin.permiso.controller');

module.exports = {
  createSubmodulo: permisoController.createSubmodulo,
  setSubmoduloStatus: permisoController.setSubmoduloStatus,
};
