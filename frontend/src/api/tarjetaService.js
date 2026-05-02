import api from "./axios";

export const tarjetaService = {
  async list() {
    const response = await api.get("/tarjetas");
    return response.data?.data ?? [];
  },

  async getById(tarjetaId) {
    const response = await api.get(`/tarjetas/${tarjetaId}`);
    return response.data?.data ?? response.data;
  },

  async create(payload) {
    const response = await api.post("/tarjetas", payload);
    return response.data?.data ?? response.data;
  },

  async update(tarjetaId, payload) {
    const response = await api.put(`/tarjetas/${tarjetaId}`, payload);
    return response.data?.data ?? response.data;
  },

  async remove(tarjetaId) {
    const response = await api.delete(`/tarjetas/${tarjetaId}`);
    return response.data?.data ?? response.data;
  },
};
