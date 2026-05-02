const adminAuthService = require('./admin.auth.service');
const {
  sanitizeHeaderValue,
  sanitizeIpAddress,
} = require('../../utils/adminAuth.validation');

function requestMeta(req) {
  return {
    userAgent: sanitizeHeaderValue(req.get('user-agent'), 255),
    ipAddress: sanitizeIpAddress(req.ip),
  };
}

async function login(req, res, next) {
  try {
    const result = await adminAuthService.loginAdmin({
      email: req.body.email,
      password: req.body.password,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await adminAuthService.refreshSession({
      refreshToken: req.body.refreshToken,
      ...requestMeta(req),
    });

    return res.status(200).json({
      ok: true,
      message: 'Sesion renovada.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    await adminAuthService.logoutSession(req.body.refreshToken);

    return res.status(200).json({
      ok: true,
      message: 'Sesion cerrada.',
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const admin = await adminAuthService.getMe(req.admin.id);

    return res.status(200).json({
      ok: true,
      data: { admin },
    });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await adminAuthService.changePassword({
      adminId: req.admin.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return res.status(200).json({
      ok: true,
      message: 'Contrasena actualizada. Debes volver a iniciar sesion.',
    });
  } catch (error) {
    return next(error);
  }
}

async function requestReset(req, res, next) {
  try {
    await adminAuthService.requestPasswordReset(req.body.email);

    return res.status(200).json({
      ok: true,
      message: 'Si el correo existe, recibiras un codigo de verificacion.',
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyCode(req, res, next) {
  try {
    const result = await adminAuthService.verifyResetCode({
      email: req.body.email,
      code: req.body.code,
    });

    return res.status(200).json({
      ok: true,
      message: 'Codigo verificado. Usa el resetToken para cambiar tu contrasena.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    await adminAuthService.resetPassword({
      resetToken: req.body.resetToken,
      newPassword: req.body.newPassword,
    });

    return res.status(200).json({
      ok: true,
      message: 'Solicitud de cambio enviada. Un superadmin debe aprobarla antes de aplicar la nueva contrasena.',
    });
  } catch (error) {
    return next(error);
  }
}

async function logoutAll(req, res, next) {
  try {
    await adminAuthService.logoutAll(req.admin.id);

    return res.status(200).json({
      ok: true,
      message: 'Todas las sesiones fueron cerradas.',
    });
  } catch (error) {
    return next(error);
  }
}

async function listSessions(req, res, next) {
  try {
    const sessions = await adminAuthService.listActiveSessions(req.admin.id);

    return res.status(200).json({
      ok: true,
      data: { sessions },
    });
  } catch (error) {
    return next(error);
  }
}

async function revokeSession(req, res, next) {
  try {
    await adminAuthService.revokeSessionById({
      adminId: req.admin.id,
      sessionId: req.params.sessionId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Sesion cerrada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
}

function assertSuperAdmin(req) {
  if (Number(req.admin?.rol) !== 1) {
    throw new Error('No autorizado');
  }
}

async function listPasswordChangeRequests(req, res, next) {
  try {
    assertSuperAdmin(req);

    const solicitudes = await adminAuthService.listPasswordChangeRequests();

    return res.status(200).json({
      ok: true,
      solicitudes,
    });
  } catch (error) {
    if (error.message === 'No autorizado') {
      return res.status(403).json({ ok: false, message: 'No autorizado' });
    }
    return next(error);
  }
}

async function approvePasswordChangeRequest(req, res, next) {
  try {
    assertSuperAdmin(req);

    await adminAuthService.approvePasswordChangeRequest({
      adminId: req.params.adminId,
      superAdminId: req.admin.id,
    });

    return res.status(200).json({
      ok: true,
      message: 'Cambio de contrasena aprobado correctamente.',
    });
  } catch (error) {
    if (error.message === 'No autorizado') {
      return res.status(403).json({ ok: false, message: 'No autorizado' });
    }
    return next(error);
  }
}

async function rejectPasswordChangeRequest(req, res, next) {
  try {
    assertSuperAdmin(req);

    await adminAuthService.rejectPasswordChangeRequest({
      adminId: req.params.adminId,
      superAdminId: req.admin.id,
      motivo: req.body?.motivo,
    });

    return res.status(200).json({
      ok: true,
      message: 'Solicitud de cambio de contrasena rechazada.',
    });
  } catch (error) {
    if (error.message === 'No autorizado') {
      return res.status(403).json({ ok: false, message: 'No autorizado' });
    }
    return next(error);
  }
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword,
  logoutAll,
  requestReset,
  verifyCode,
  resetPassword,
  listSessions,
  revokeSession,
  listPasswordChangeRequests,
  approvePasswordChangeRequest,
  rejectPasswordChangeRequest,
};
