import api from "./axios";

export const productoDetalleService = {
  async getPublicById(productoId) {
    const response = await api.get(`/catalogo/productos/public/${productoId}`);
    return response.data?.data ?? null;
  },

  async listPublicOpiniones(productoId, { page = 1, limit = 10 } = {}) {
    const response = await api.get(`/producto-opiniones/productos/${productoId}`, {
      params: { page, limit },
    });

    return {
      data: response.data?.data ?? [],
      resumen: response.data?.resumen ?? {
        averageRating: 0,
        totalRatings: 0,
        distribution: [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
      },
      pagination: response.data?.pagination ?? null,
    };
  },

  async upsertMiOpinion(productoId, payload) {
    const response = await api.post(`/producto-opiniones/productos/${productoId}`, payload);
    return response.data?.data ?? null;
  },
};
