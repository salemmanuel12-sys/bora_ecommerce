import api from "./axios";

export const direccionService = {
  async listStates() {
    const response = await api.get('/direcciones/estados');
    return response.data?.data ?? [];
  },

  async list() {
    const response = await api.get("/direcciones");
    return response.data?.data ?? [];
  },

  async create(payload) {
    const response = await api.post("/direcciones", payload);
    return response.data?.data ?? response.data;
  },

  async update(addressId, payload) {
    const response = await api.put(`/direcciones/${addressId}`, payload);
    return response.data?.data ?? response.data;
  },

  async remove(addressId) {
    const response = await api.delete(`/direcciones/${addressId}`);
    return response.data?.data ?? response.data;
  },
};
