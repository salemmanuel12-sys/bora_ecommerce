const notificacionService = require('./notificacion.service');

async function listNotifications(req, res, next) {
  try {
    const result = await notificacionService.listNotifications(req.usuario.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({
      ok: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificacionService.markAsRead(
      req.usuario.id,
      Number(req.params.notificacionId)
    );
    return res.status(200).json({ ok: true, data: notification });
  } catch (error) {
    return next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificacionService.markAllAsRead(req.usuario.id);
    return res.status(200).json({ ok: true, message: result.message });
  } catch (error) {
    return next(error);
  }
}

async function adminList(req, res, next) {
  try {
    const result = await notificacionService.adminListNotifications({
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({
      ok: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminMarkAsRead(req, res, next) {
  try {
    const notification = await notificacionService.adminMarkAsRead(Number(req.params.notificacionId));
    return res.status(200).json({ ok: true, data: notification });
  } catch (error) {
    return next(error);
  }
}

async function adminMarkAllAsRead(req, res, next) {
  try {
    const result = await notificacionService.adminMarkAllAsRead();
    return res.status(200).json({ ok: true, message: result.message });
  } catch (error) {
    return next(error);
  }
}

async function adminMarkOrderAsAttended(req, res, next) {
  try {
    const result = await notificacionService.adminMarkOrderAsAttended(req.params.orderId);
    return res.status(200).json({ ok: true, data: result, message: result.message });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  adminList,
  adminMarkAsRead,
  adminMarkAllAsRead,
  adminMarkOrderAsAttended,
};
