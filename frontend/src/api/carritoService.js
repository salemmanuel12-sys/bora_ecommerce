import api from "./axios";

export const carritoService = {
  async getCart() {
    const response = await api.get("/carrito");
    return response.data?.data ?? response.data;
  },

  async addItem(productId, quantity = 1) {
    const response = await api.post("/carrito/items", { productId, quantity });
    return response.data?.data ?? response.data;
  },

  async updateItem(itemId, quantity) {
    const response = await api.put(`/carrito/items/${itemId}`, { quantity });
    return response.data?.data ?? response.data;
  },

  async removeItem(itemId) {
    const response = await api.delete(`/carrito/items/${itemId}`);
    return response.data?.data ?? response.data;
  },

  async clearCart() {
    const response = await api.delete("/carrito");
    return response.data?.data ?? response.data;
  },
};
