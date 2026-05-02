import api from "./axios";

export const adminProductoOpinionesService = {
  async listPendientes({ page = 1, limit = 20 } = {}) {
    const response = await api.get("/admin/producto-opiniones/pendientes", {
      params: { page, limit },
    });

    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async updateStatus(opinionId, status) {
    const response = await api.patch(`/admin/producto-opiniones/${opinionId}/status`, { status });
    return response.data?.data ?? response.data;
  },
};
