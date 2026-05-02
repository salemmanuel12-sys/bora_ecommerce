const permisoController = require('./admin.permiso.controller');

module.exports = {
  createAccion: permisoController.createAccion,
  setAccionStatus: permisoController.setAccionStatus,
};
