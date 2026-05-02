import api from "./axios";

export const notificacionService = {
  async list({ page = 1, limit = 20 } = {}) {
    const response = await api.get("/notificaciones", { params: { page, limit } });
    return {
      data: response.data?.data ?? [],
      unreadCount: Number(response.data?.unreadCount || 0),
      pagination: response.data?.pagination ?? null,
    };
  },

  async readAll() {
    const response = await api.patch("/notificaciones/read-all");
    return response.data?.data ?? response.data;
  },

  async readOne(id) {
    const response = await api.patch(`/notificaciones/${id}/read`);
    return response.data?.data ?? response.data;
  },
};
