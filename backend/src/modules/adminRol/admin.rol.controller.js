const adminRolService = require('./admin.rol.service');
const {
  sanitizeHeaderValue,
  sanitizeIpAddress,
} = require('../../utils/adminAuth.validation');
const HttpError = require('../../utils/httpError');

function requestMeta(req) {
  return {
    userId: req.admin?.id,
    userIp: sanitizeIpAddress(req.ip),
    userAgent: sanitizeHeaderValue(req.get('user-agent'), 255),
  };
}

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new HttpError(403, 'Solo el superadmin puede gestionar roles.');
  }
}

async function listRoles(req, res, next) {
  try {
    const { page, limit, estado, search } = req.query;
    const result = await adminRolService.listRoles({ page, limit, estado, search });

    return res.status(200).json({
      ok: true,
      data: result.roles,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function getRole(req, res, next) {
  try {
    const role = await adminRolService.getRoleById(req.params.roleId);

    return res.status(200).json({
      ok: true,
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function createRole(req, res, next) {
  try {
    assertSuperAdmin(req);

    const role = await adminRolService.createRole({
      nombreRol: req.body.NOMBRE || req.body.nombreRol,
      descripcion: req.body.DESCRIPCION || req.body.descripcion,
      ...requestMeta(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Rol creado correctamente.',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    assertSuperAdmin(req);

    const role = await adminRolService.updateRole({
      roleId: req.params.roleId,
      nombreRol: req.body.NOMBRE || req.body.nombreRol,
      descripcion: req.body.DESCRIPCION || req.body.descripcion,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Rol actualizado correctamente.',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRoleStatus(req, res, next) {
  try {
    assertSuperAdmin(req);

    const role = await adminRolService.updateRoleStatus({
      roleId: req.params.roleId,
      estado: req.body.estado,
      motivo: req.body.motivo,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado del rol actualizado correctamente.',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteRole(req, res, next) {
  try {
    assertSuperAdmin(req);

    const role = await adminRolService.updateRoleStatus({
      roleId: req.params.roleId,
      estado: 0,
      motivo: req.body?.motivo,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Rol desactivado correctamente.',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

async function reactivateRole(req, res, next) {
  try {
    assertSuperAdmin(req);

    const role = await adminRolService.updateRoleStatus({
      roleId: req.params.roleId,
      estado: 1,
      motivo: null,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Rol reactivado correctamente.',
      data: role,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  updateRoleStatus,
  deleteRole,
  reactivateRole,
};
