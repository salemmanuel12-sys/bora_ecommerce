import api from "./axios";

export const adminNotificacionesService = {
  async list({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/admin/notificaciones", {
      params: { page, limit },
    });

    return {
      data: response.data?.data ?? [],
      unreadCount: Number(response.data?.unreadCount || 0),
      pagination: response.data?.pagination ?? null,
    };
  },

  async readAll() {
    const response = await api.patch("/admin/notificaciones/read-all");
    return response.data?.data ?? response.data;
  },

  async readOne(notificationId) {
    const response = await api.patch(`/admin/notificaciones/${notificationId}/read`);
    return response.data?.data ?? response.data;
  },

  async attendOrder(orderId) {
    const response = await api.patch(`/admin/notificaciones/orders/${orderId}/attend`);
    return response.data?.data ?? response.data;
  },
};
