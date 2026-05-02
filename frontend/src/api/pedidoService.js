import api from "./axios";

export const pedidoService = {
  async checkout({ shippingAddressId, paymentMethod, cardId, card }) {
    const response = await api.post("/pedidos/checkout", {
      shippingAddressId,
      paymentMethod,
      cardId,
      card,
    });
    return response.data?.data ?? response.data;
  },

  async list({ page = 1, limit = 10 } = {}) {
    const response = await api.get("/pedidos", { params: { page, limit } });
    return {
      data: response.data?.data ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async getById(orderId) {
    const response = await api.get(`/pedidos/${orderId}`);
    return response.data?.data ?? response.data;
  },

  async cancel(orderId) {
    const response = await api.patch(`/pedidos/${orderId}/cancel`);
    return response.data?.data ?? response.data;
  },
};
