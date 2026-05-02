import api from "./axios";

export const envioService = {
  async getByOrder(orderId) {
    const response = await api.get(`/envios/${orderId}`);
    return response.data?.data ?? response.data;
  },

  async upsert(orderId, payload) {
    const response = await api.put(`/envios/${orderId}`, payload);
    return response.data?.data ?? response.data;
  },
};
