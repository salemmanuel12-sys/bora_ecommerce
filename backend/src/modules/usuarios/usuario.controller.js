const usuarioService = require('./usuario.service');

async function health(_req, res, next) {
  try {
    return res.status(200).json({
      ok: true,
      message: 'Modulo de usuarios activo',
    });
  } catch (error) {
    return next(error);
  }
}

async function list(_req, res, next) {
  try {
    const data = await usuarioService.listUsuarios({
      page: _req.query.page,
      limit: _req.query.limit,
      search: _req.query.search,
      status: _req.query.status,
    });

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await usuarioService.loginUsuario({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function socialLogin(req, res, next) {
  try {
    const result = await usuarioService.socialLoginUsuario({
      email: req.body.email,
      nombre: req.body.nombre,
      provider: req.body.provider,
      providerUid: req.body.providerUid,
    });

    return res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function register(req, res, next) {
  try {
    const data = await usuarioService.registerUsuario({
      nombre: req.body.nombre,
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      ok: true,
      message: 'Registro creado. Te enviamos un código de verificación a tu correo.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const data = await usuarioService.verifyEmailUsuario({
      email: req.body.email,
      code: req.body.code,
    });

    return res.status(200).json({
      ok: true,
      message: 'Correo verificado correctamente.',
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminList(req, res, next) {
  try {
    const result = await usuarioService.listUsuarios({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
    });

    return res.status(200).json({
      ok: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const user = await usuarioService.adminUpdateUsuarioStatus({
      userId: req.params.userId,
      status: req.body.status,
    });

    return res.status(200).json({
      ok: true,
      message: 'Estado de usuario actualizado correctamente.',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  health,
  list,
  login,
  socialLogin,
  register,
  verifyEmail,
  adminList,
  adminUpdateStatus,
};
