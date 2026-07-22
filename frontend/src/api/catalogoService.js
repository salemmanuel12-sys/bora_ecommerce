import api from "./axios";

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

export const categoriasService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.search) query.set("search", params.search);
    if (params.include_inactive) query.set("include_inactive", "true");
    return api.get(`/admin/categorias?${query.toString()}`);
  },

  getById(id) {
    return api.get(`/admin/categorias/${id}`);
  },

  create(data) {
    const isFormData = data instanceof FormData;
    return api.post("/admin/categorias", data, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {});
  },

  update(id, data) {
    const isFormData = data instanceof FormData;
    return api.put(`/admin/categorias/${id}`, data, isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {});
  },

  updateStatus(id, status) {
    return api.patch(`/admin/categorias/${id}/status`, { status });
  },

  delete(id) {
    return api.delete(`/admin/categorias/${id}`);
  },
};

// ─── SUBCATEGORÍAS ────────────────────────────────────────────────────────────

export const subcategoriasService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.search) query.set("search", params.search);
    if (params.categoriaId) query.set("categoriaId", params.categoriaId);
    if (params.include_inactive) query.set("include_inactive", "true");
    return api.get(`/admin/subcategorias?${query.toString()}`);
  },

  getById(id) {
    return api.get(`/admin/subcategorias/${id}`);
  },

  create(data) {
    return api.post("/admin/subcategorias", data);
  },

  update(id, data) {
    return api.put(`/admin/subcategorias/${id}`, data);
  },

  updateStatus(id, status) {
    return api.patch(`/admin/subcategorias/${id}/status`, { status });
  },

  delete(id) {
    return api.delete(`/admin/subcategorias/${id}`);
  },
};

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export const productosService = {
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.limit) query.set("limit", params.limit);
    if (params.search) query.set("search", params.search);
    if (params.categoriaId) query.set("categoriaId", params.categoriaId);
    else if (params.subcategoriaId) query.set("subcategoriaId", params.subcategoriaId);
    if (params.include_inactive) query.set("include_inactive", "true");
    return api.get(`/admin/productos?${query.toString()}`);
  },

  getById(id) {
    return api.get(`/admin/productos/${id}`);
  },

  create(data) {
    return api.post("/admin/productos", data);
  },

  update(id, data) {
    return api.put(`/admin/productos/${id}`, data);
  },

  updateStatus(id, status) {
    return api.patch(`/admin/productos/${id}/status`, { status });
  },

  delete(id) {
    return api.delete(`/admin/productos/${id}`);
  },


  // ─── IMÁGENES ─────────────────────────────────────────────────────────────

  listImagenes(productoId) {
    return api.get(`/admin/productos/${productoId}/imagenes`);
  },

  uploadImagenes(productoId, formData) {
    return api.post(`/admin/productos/${productoId}/imagenes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImagen(productoId, imagenId) {
    return api.delete(`/admin/productos/${productoId}/imagenes/${imagenId}`);
  },

  reorderImagenes(productoId, orden) {
    return api.patch(`/admin/productos/${productoId}/imagenes/reorder`, { orden });
  },
};
