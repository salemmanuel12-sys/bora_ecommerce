const adminInvitationService = require('./admin.invitation.service');
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

// Enviar invitación (solo superadmin)
async function sendInvitation(req, res, next) {
  try {
    // Verificar que sea superadmin
    if (req.admin.rol !== 1) {
      return res.status(403).json({ 
        ok: false,
        message: 'No autorizado' 
      });
    }

    const { email, nombre, rolId } = req.body;
    const { ipAddress } = requestMeta(req);

    await adminInvitationService.sendInvitation({
      email,
      nombre,
      rolId,
      userId: req.admin.id,
      userIp: ipAddress,
    });

    return res.status(201).json({
      ok: true,
      message: 'Invitación enviada correctamente',
    });
  } catch (error) {
    return next(error);
  }
}

// Registro desde invitación
async function registerFromInvitation(req, res, next) {
  try {
    const { token, password } = req.body;
    const { ipAddress } = requestMeta(req);

    await adminInvitationService.registerFromInvitation({
      token,
      password,
      userIp: ipAddress,
    });

    return res.status(201).json({
      ok: true,
      message: 'Registro completado. Verifica tu correo.',
    });
  } catch (error) {
    return next(error);
  }
}

// Verificar email de admin
async function verifyEmailAdmin(req, res, next) {
  try {
    const { email, codigo } = req.body;

    await adminInvitationService.verifyEmailAdmin({
      email,
      codigo,
    });

    return res.status(200).json({
      ok: true,
      message: 'Correo verificado correctamente',
    });
  } catch (error) {
    return next(error);
  }
}

// Aprobar administrador (solo superadmin)
async function approveAdmin(req, res, next) {
  try {
    // Verificar que sea superadmin
    if (req.admin.rol !== 1) {
      return res.status(403).json({ 
        ok: false,
        message: 'No autorizado' 
      });
    }

    const { adminId } = req.params;
    const { motivo } = req.body;
    const { ipAddress } = requestMeta(req);

    await adminInvitationService.approveAdmin({
      adminId,
      motivo,
      userId: req.admin.id,
      userIp: ipAddress,
    });

    return res.status(200).json({
      ok: true,
      message: 'Administrador aprobado correctamente',
    });
  } catch (error) {
    return next(error);
  }
}

// Rechazar administrador (solo superadmin)
async function rejectAdmin(req, res, next) {
  try {
    // Verificar que sea superadmin
    if (req.admin.rol !== 1) {
      return res.status(403).json({ 
        ok: false,
        message: 'No autorizado' 
      });
    }

    const { adminId } = req.params;
    const { motivo } = req.body;
    const { ipAddress } = requestMeta(req);

    await adminInvitationService.rejectAdmin({
      adminId,
      motivo,
      userId: req.admin.id,
      userIp: ipAddress,
    });

    return res.status(200).json({
      ok: true,
      message: 'Administrador rechazado',
    });
  } catch (error) {
    return next(error);
  }
}

// Listar administradores (solo superadmin)
async function listAdmins(req, res, next) {
  try {
    // Verificar que sea superadmin
    if (req.admin.rol !== 1) {
      return res.status(403).json({ 
        ok: false,
        message: 'No autorizado' 
      });
    }

    const result = await adminInvitationService.listAdmins({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      nombre: req.query.nombre,
      email: req.query.email,
      rolId: req.query.rol_id,
      status: req.query.status,
    });

    return res.status(200).json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendInvitation,
  registerFromInvitation,
  verifyEmailAdmin,
  approveAdmin,
  rejectAdmin,
  listAdmins,
};
