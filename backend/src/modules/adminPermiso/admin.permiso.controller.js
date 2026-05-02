const adminPermisoService = require('./admin.permiso.service');

function adminMeta(req) {
  return {
    id: req.admin?.id,
    rol: req.admin?.rol,
    ipAddress: req.ip,
  };
}

async function getCatalog(req, res, next) {
  try {
    const catalog = await adminPermisoService.getPermisoCatalog();
    return res.status(200).json({ ok: true, data: { catalog } });
  } catch (error) {
    return next(error);
  }
}

async function getRolePermisos(req, res, next) {
  try {
    const permisos = await adminPermisoService.getRolePermisos(req.params.roleId);
    return res.status(200).json({ ok: true, ...permisos });
  } catch (error) {
    return next(error);
  }
}

async function replaceRolePermisos(req, res, next) {
  try {
    const permisos = await adminPermisoService.replaceRolePermisos({
      roleId: req.params.roleId,
      modulos: req.body.MODULOS ?? req.body.modulos ?? [],
      submodulos: req.body.SUBMODULOS ?? req.body.submodulos ?? [],
      acciones: req.body.ACCIONES ?? req.body.acciones ?? [],
      admin: adminMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Permisos del rol actualizados correctamente.',
      ...permisos,
    });
  } catch (error) {
    return next(error);
  }
}

async function createModulo(req, res, next) {
  try {
    const modulo = await adminPermisoService.createModulo({
      codigo: req.body.codigo,
      descripcion: req.body.descripcion,
      icono: req.body.icono,
      orden: req.body.orden,
      admin: adminMeta(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Modulo creado correctamente.',
      data: { modulo },
    });
  } catch (error) {
    return next(error);
  }
}

async function setModuloStatus(req, res, next) {
  try {
    const modulo = await adminPermisoService.setModuloStatus({
      moduloId: req.params.moduloId,
      estado: req.body.estado,
      motivo: req.body.motivo,
      admin: adminMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado del modulo actualizado correctamente.',
      data: { modulo },
    });
  } catch (error) {
    return next(error);
  }
}

async function createSubmodulo(req, res, next) {
  try {
    const submodulo = await adminPermisoService.createSubmodulo({
      moduloId: req.params.moduloId,
      codigo: req.body.codigo,
      descripcion: req.body.descripcion,
      orden: req.body.orden,
      admin: adminMeta(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Submodulo creado correctamente.',
      data: { submodulo },
    });
  } catch (error) {
    return next(error);
  }
}

async function setSubmoduloStatus(req, res, next) {
  try {
    const submodulo = await adminPermisoService.setSubmoduloStatus({
      submoduloId: req.params.submoduloId,
      estado: req.body.estado,
      motivo: req.body.motivo,
      admin: adminMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado del submodulo actualizado correctamente.',
      data: { submodulo },
    });
  } catch (error) {
    return next(error);
  }
}

async function createAccion(req, res, next) {
  try {
    const accion = await adminPermisoService.createAccion({
      submoduloId: req.params.submoduloId,
      codigo: req.body.codigo,
      descripcion: req.body.descripcion,
      orden: req.body.orden,
      admin: adminMeta(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Accion creada correctamente.',
      data: { accion },
    });
  } catch (error) {
    return next(error);
  }
}

async function setAccionStatus(req, res, next) {
  try {
    const accion = await adminPermisoService.setAccionStatus({
      accionId: req.params.accionId,
      estado: req.body.estado,
      motivo: req.body.motivo,
      admin: adminMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado de la accion actualizado correctamente.',
      data: { accion },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCatalog,
  getRolePermisos,
  replaceRolePermisos,
  createModulo,
  setModuloStatus,
  createSubmodulo,
  setSubmoduloStatus,
  createAccion,
  setAccionStatus,
  listModulos,
  updateModulo,
  deleteModulo,
  reactivateModulo,
  listSubmodulos,
  updateSubmodulo,
  deleteSubmodulo,
  reactivateSubmodulo,
  listAcciones,
  updateAccion,
  deleteAccion,
  reactivateAccion,
};

// ── List / Update / Delete / Reactivate handlers ────────────────────────────

async function listModulos(req, res, next) {
  try {
    const { page, limit, search, estado } = req.query;
    const result = await adminPermisoService.listModulos({ page, limit, search, estado });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

async function updateModulo(req, res, next) {
  try {
    const modulo = await adminPermisoService.updateModulo({
      moduloId: req.params.moduloId,
      codigo: req.body.CODIGO || req.body.codigo,
      descripcion: req.body.DESCRIPCION || req.body.descripcion,
      icono: req.body.ICONO ?? req.body.icono,
      orden: req.body.ORDEN ?? req.body.orden,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Modulo actualizado.', data: { modulo } });
  } catch (error) {
    return next(error);
  }
}

async function deleteModulo(req, res, next) {
  try {
    const modulo = await adminPermisoService.setModuloStatus({
      moduloId: req.params.moduloId,
      estado: 0,
      motivo: req.body?.motivo,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Modulo desactivado.', data: { modulo } });
  } catch (error) {
    return next(error);
  }
}

async function reactivateModulo(req, res, next) {
  try {
    const modulo = await adminPermisoService.setModuloStatus({
      moduloId: req.params.moduloId,
      estado: 1,
      motivo: null,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Modulo reactivado.', data: { modulo } });
  } catch (error) {
    return next(error);
  }
}

async function listSubmodulos(req, res, next) {
  try {
    const { estado } = req.query;
    const result = await adminPermisoService.listSubmodulos({ moduloId: req.params.moduloId, estado });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

async function updateSubmodulo(req, res, next) {
  try {
    const submodulo = await adminPermisoService.updateSubmodulo({
      moduloId: req.params.moduloId,
      submoduloId: req.params.submoduloId,
      codigo: req.body.CODIGO || req.body.codigo,
      descripcion: req.body.DESCRIPCION || req.body.descripcion,
      orden: req.body.ORDEN ?? req.body.orden,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Submodulo actualizado.', data: { submodulo } });
  } catch (error) {
    return next(error);
  }
}

async function deleteSubmodulo(req, res, next) {
  try {
    const submodulo = await adminPermisoService.setSubmoduloStatus({
      submoduloId: req.params.submoduloId,
      estado: 0,
      motivo: req.body?.motivo,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Submodulo desactivado.', data: { submodulo } });
  } catch (error) {
    return next(error);
  }
}

async function reactivateSubmodulo(req, res, next) {
  try {
    const submodulo = await adminPermisoService.setSubmoduloStatus({
      submoduloId: req.params.submoduloId,
      estado: 1,
      motivo: null,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Submodulo reactivado.', data: { submodulo } });
  } catch (error) {
    return next(error);
  }
}

async function listAcciones(req, res, next) {
  try {
    const { estado } = req.query;
    const result = await adminPermisoService.listAcciones({ submoduloId: req.params.submoduloId, estado });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

async function updateAccion(req, res, next) {
  try {
    const accion = await adminPermisoService.updateAccion({
      submoduloId: req.params.submoduloId,
      accionId: req.params.accionId,
      codigo: req.body.CODIGO || req.body.codigo,
      descripcion: req.body.DESCRIPCION || req.body.descripcion,
      orden: req.body.ORDEN ?? req.body.orden,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Accion actualizada.', data: { accion } });
  } catch (error) {
    return next(error);
  }
}

async function deleteAccion(req, res, next) {
  try {
    const accion = await adminPermisoService.setAccionStatus({
      accionId: req.params.accionId,
      estado: 0,
      motivo: req.body?.motivo,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Accion desactivada.', data: { accion } });
  } catch (error) {
    return next(error);
  }
}

async function reactivateAccion(req, res, next) {
  try {
    const accion = await adminPermisoService.setAccionStatus({
      accionId: req.params.accionId,
      estado: 1,
      motivo: null,
      admin: adminMeta(req),
    });
    return res.status(200).json({ ok: true, message: 'Accion reactivada.', data: { accion } });
  } catch (error) {
    return next(error);
  }
}
