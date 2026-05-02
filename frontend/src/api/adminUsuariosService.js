import api from "./axios";

export const adminUsuariosService = {
  async list({ page = 1, limit = 20, search = "", status } = {}) {
    const response = await api.get("/admin/usuarios", {
      params: {
        page,
        limit,
        search: search?.trim() || undefined,
        status: status || undefined,
      },
    });

    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async updateStatus(userId, status) {
    const response = await api.patch(`/admin/usuarios/${userId}/status`, { status });
    return response.data?.data ?? response.data;
  },
};
