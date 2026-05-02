import api from "./axios";

export const adminPedidosService = {
  async list({ page = 1, limit = 20, status, search } = {}) {
    const response = await api.get("/admin/pedidos", {
      params: {
        page,
        limit,
        status: status || undefined,
        search: search?.trim() || undefined,
      },
    });

    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async getById(orderId) {
    const response = await api.get(`/admin/pedidos/${orderId}`);
    return response.data?.data ?? response.data;
  },
};
