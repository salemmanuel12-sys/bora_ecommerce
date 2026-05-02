const permisoController = require('./admin.permiso.controller');

module.exports = {
  createModulo: permisoController.createModulo,
  setModuloStatus: permisoController.setModuloStatus,
};
