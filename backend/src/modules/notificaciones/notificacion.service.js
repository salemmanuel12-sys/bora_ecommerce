const { Notification, Usuario } = require('../../models/loader');
const HttpError = require('../../utils/httpError');
const { Op } = require('sequelize');

function toPublic(notification) {
  const raw = notification?.get ? notification.get({ plain: true }) : notification;
  return {
    id: raw.id,
    userId: raw.userId,
    type: raw.type,
    message: raw.message,
    read: Boolean(raw.read),
    createdAt: raw.createdAt,
  };
}

async function listNotifications(userId, { page = 1, limit = 20 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    notifications: rows.map(toPublic),
    unreadCount: rows.filter((n) => !n.read).length,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new HttpError(404, 'Notificación no encontrada.');
  }

  await notification.update({ read: true });
  return toPublic(notification);
}

async function markAllAsRead(userId) {
  await Notification.update({ read: true }, { where: { userId, read: false } });
  return { message: 'Todas las notificaciones marcadas como leídas.' };
}

async function adminListNotifications({ page = 1, limit = 20 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Notification.findAndCountAll({
    where: { userId: null }, // solo notificaciones de administrador
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'email'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    notifications: rows.map((item) => {
      const raw = item.get({ plain: true });
      return {
        ...toPublic(raw),
        usuario: raw.usuario
          ? { id: raw.usuario.id, nombre: raw.usuario.nombre, email: raw.usuario.email }
          : null,
      };
    }),
    unreadCount: rows.filter((n) => !n.read).length,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function adminMarkAsRead(notificationId) {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    throw new HttpError(404, 'Notificación no encontrada.');
  }

  await notification.update({ read: true });
  return toPublic(notification);
}

async function adminMarkAllAsRead() {
  await Notification.update({ read: true }, { where: { userId: null, read: false } });
  return { message: 'Todas las notificaciones fueron marcadas como leídas.' };
}

async function adminMarkOrderAsAttended(orderId) {
  const parsedOrderId = Number.parseInt(String(orderId), 10);
  if (!Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
    throw new HttpError(400, 'ID de pedido invalido.');
  }

  const [updatedCount] = await Notification.update(
    { read: true },
    {
      where: {
        userId: null,
        type: 'Nuevo pedido',
        read: false,
        message: {
          [Op.like]: `%Pedido #${parsedOrderId}%`,
        },
      },
    }
  );

  return {
    attended: updatedCount > 0,
    updated: updatedCount,
    message: updatedCount > 0
      ? 'Notificacion de pedido marcada como atendida.'
      : 'No habia notificaciones pendientes para este pedido.',
  };
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  adminListNotifications,
  adminMarkAsRead,
  adminMarkAllAsRead,
  adminMarkOrderAsAttended,
};
