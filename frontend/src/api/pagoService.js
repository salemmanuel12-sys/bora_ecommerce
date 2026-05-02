import api from "./axios";

export const pagoService = {
  async getByOrder(orderId) {
    const response = await api.get(`/pagos/${orderId}`);
    return response.data?.data ?? response.data;
  },

  async confirm(orderId, { transactionId }) {
    const response = await api.post(`/pagos/${orderId}/confirm`, { transactionId });
    return response.data?.data ?? response.data;
  },

  async updateStatus(orderId, payload) {
    const response = await api.patch(`/pagos/${orderId}/status`, payload);
    return response.data?.data ?? response.data;
  },

  async createStripeCheckoutSession(orderId) {
    const response = await api.post(`/pagos/${orderId}/stripe/checkout-session`);
    return response.data?.data ?? response.data;
  },

  async confirmStripeCheckout(orderId, { sessionId }) {
    const response = await api.post(`/pagos/${orderId}/stripe/confirm`, { sessionId });
    return response.data?.data ?? response.data;
  },

  async createStripeOxxoVoucher(orderId, { customerEmail }) {
    const response = await api.post(`/pagos/${orderId}/stripe/oxxo-voucher`, { customerEmail });
    return response.data?.data ?? response.data;
  },

  async checkStripeOxxoStatus(orderId, { paymentIntentId }) {
    const response = await api.post(`/pagos/${orderId}/stripe/oxxo-status`, { paymentIntentId });
    return response.data?.data ?? response.data;
  },

  async createPayPalOrder(orderId) {
    const response = await api.post(`/pagos/${orderId}/paypal/order`);
    return response.data?.data ?? response.data;
  },

  async capturePayPalOrder(orderId, { paypalOrderId }) {
    const response = await api.post(`/pagos/${orderId}/paypal/capture`, { paypalOrderId });
    return response.data?.data ?? response.data;
  },

  async createMercadoPagoPreference(orderId) {
    const response = await api.post(`/pagos/${orderId}/mercadopago/preference`);
    return response.data?.data ?? response.data;
  },

  async confirmMercadoPagoPayment(orderId, { paymentId }) {
    const response = await api.post(`/pagos/${orderId}/mercadopago/confirm`, { paymentId });
    return response.data?.data ?? response.data;
  },
};
