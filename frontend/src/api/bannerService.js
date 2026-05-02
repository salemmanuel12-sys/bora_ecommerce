import api from "./axios";

export const bannerService = {
  async listPublic() {
    const response = await api.get("/anuncios/banners/public");
    return response.data?.data ?? [];
  },

  async adminList({ page = 1, limit = 20, search = "", includeInactive = true } = {}) {
    const response = await api.get("/admin/anuncios/banners", {
      params: {
        page,
        limit,
        search: search?.trim() || undefined,
        include_inactive: includeInactive ? "true" : undefined,
      },
    });

    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async adminCreate(formData) {
    const response = await api.post("/admin/anuncios/banners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data ?? response.data;
  },

  async adminUpdate(bannerId, formData) {
    const response = await api.put(`/admin/anuncios/banners/${bannerId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data ?? response.data;
  },

  async adminUpdateStatus(bannerId, status) {
    const response = await api.patch(`/admin/anuncios/banners/${bannerId}/status`, { status });
    return response.data?.data ?? response.data;
  },

  async adminDelete(bannerId) {
    const response = await api.delete(`/admin/anuncios/banners/${bannerId}`);
    return response.data?.data ?? response.data;
  },
};
