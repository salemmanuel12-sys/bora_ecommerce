import api from "./axios";

export const adminPaquetesService = {
  async list() {
    const response = await api.get("/admin/pedidos/paquetes");
    return response.data?.data ?? response.data;
  },

  async create(payload) {
    const response = await api.post("/admin/pedidos/paquetes", payload);
    return response.data?.data ?? response.data;
  },

  async getById(packageId) {
    const response = await api.get(`/admin/pedidos/paquetes/${packageId}`);
    return response.data?.data ?? response.data;
  },

  async remove(packageId) {
    const response = await api.delete(`/admin/pedidos/paquetes/${packageId}`);
    return response.data?.data ?? response.data;
  },

  async getProductTypeCatalog() {
    const response = await api.get("/admin/pedidos/paquetes/catalogos/product-type");
    return response.data?.data ?? [];
  },

  async getUnitTypeCatalog() {
    const response = await api.get("/admin/pedidos/paquetes/catalogos/unit-type");
    return response.data?.data ?? [];
  },
};