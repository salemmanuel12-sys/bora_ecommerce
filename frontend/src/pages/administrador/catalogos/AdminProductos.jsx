import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, X, Pencil, Trash2, ImagePlus, ShoppingBag, Power,
} from "lucide-react";
import toast from "react-hot-toast";
import { productosService, categoriasService } from "../../../api/catalogoService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:4001";

function createAttributeRow() {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, nombre: "", valor: "" };
}

function createDiscountRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cantidadMin: "",
    cantidadMax: "",
    tipoDescuento: "PORCENTAJE",
    valor: "",
  };
}

function mapProductoAttributes(atributos = []) {
  return Array.isArray(atributos)
    ? atributos.map((item) => ({
        id: `${item?.id ?? item?.atributoId ?? "attr"}-${item?.valorId ?? item?.valor?.id ?? "value"}`,
        nombre: item?.atributo?.nombre || item?.nombre || "",
        valor: item?.valor?.valor || item?.valor || "",
      }))
    : [];
}

function normalizeAttributeRows(rows = []) {
  return rows
    .map((row) => ({
      nombre: String(row?.nombre || "").trim(),
      valor: String(row?.valor || "").trim(),
    }))
    .filter((row) => row.nombre || row.valor);
}

function mapProductoDiscounts(descuentos = []) {
  return Array.isArray(descuentos)
    ? descuentos.map((item) => ({
        id: `${item?.id ?? `desc-${Math.random().toString(16).slice(2)}`}`,
        cantidadMin: item?.cantidadMin ?? "",
        cantidadMax: item?.cantidadMax ?? "",
        tipoDescuento: item?.tipoDescuento || "PORCENTAJE",
        valor: item?.valor ?? "",
      }))
    : [];
}

function normalizeDiscountRows(rows = []) {
  return rows
    .map((row) => ({
      cantidadMin: Number.parseInt(String(row?.cantidadMin ?? ""), 10),
      cantidadMax: Number.parseInt(String(row?.cantidadMax ?? ""), 10),
      tipoDescuento: String(row?.tipoDescuento || "").trim().toUpperCase(),
      valor: Number(row?.valor),
    }))
    .filter((row) => Number.isInteger(row.cantidadMin)
      || Number.isInteger(row.cantidadMax)
      || row.tipoDescuento
      || Number.isFinite(row.valor));
}

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterCategoriaId, setFilterCategoriaId] = useState("");
  const [statusFilter, setStatusFilter] = useState(1); // 1 = activos, 0 = inactivos

  // Product modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [form, setForm] = useState({
    categoriaId: "",
    name: "",
    description: "",
    price: "",
    stock: "0",
    peso: "",
    alto: "",
    ancho: "",
    largo: "",
    sku: "",
    status: true,
    atributos: [],
    descuentosMayoreo: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageProducto, setImageProducto] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => { fetchCategorias(); }, []);

  useEffect(() => {
    fetchProductos();
    setCurrentPage(1);
  }, [search]);

  const fetchCategorias = async () => {
    try {
      const res = await categoriasService.list({ limit: 100, include_inactive: true });
      setCategorias(res.data?.data || []);
    } catch { /* non-critical */ }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await productosService.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        include_inactive: true,
      });
      const { data } = res.data;
      setProductos(data || []);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = useMemo(() => {
    return productos.filter((prod) => {
      const byStatus = statusFilter === 1 ? prod.status : !prod.status;
      const byCategoria = filterCategoriaId ? String(prod.categoriaId) === String(filterCategoriaId) : true;
      return byStatus && byCategoria;
    });
  }, [productos, statusFilter, filterCategoriaId]);

  const total = filteredProductos.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedProductos = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * limit;
    return filteredProductos.slice(start, start + limit);
  }, [filteredProductos, currentPage, totalPages, limit]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ─── Product form ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelectedProducto(null);
    setForm({
      categoriaId: filterCategoriaId || "",
      name: "",
      description: "",
      price: "",
      stock: "0",
      peso: "",
      alto: "",
      ancho: "",
      largo: "",
      sku: "",
      status: true,
      atributos: [],
      descuentosMayoreo: [],
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (prod) => {
    setModalMode("edit");
    setSelectedProducto(prod);
    setForm({
      categoriaId: String(prod.categoriaId),
      name: prod.name,
      description: prod.description || "",
      price: String(prod.price),
      stock: String(prod.stock),
      peso: prod.peso === null || prod.peso === undefined ? "" : String(prod.peso),
      alto: prod.alto === null || prod.alto === undefined ? "" : String(prod.alto),
      ancho: prod.ancho === null || prod.ancho === undefined ? "" : String(prod.ancho),
      largo: prod.largo === null || prod.largo === undefined ? "" : String(prod.largo),
      sku: prod.sku || "",
      status: prod.status,
      atributos: mapProductoAttributes(prod.atributos),
      descuentosMayoreo: mapProductoDiscounts(prod.descuentosMayoreo),
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.categoriaId) errors.categoriaId = "Selecciona una categoría";
    if (!form.name.trim()) errors.name = "El nombre es obligatorio";
    else if (form.name.trim().length < 2) errors.name = "Mínimo 2 caracteres";
    else if (form.name.trim().length > 150) errors.name = "Máximo 150 caracteres";
    if (!form.price && form.price !== "0") errors.price = "El precio es obligatorio";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) errors.price = "Precio inválido";
    if (form.stock !== "" && (isNaN(Number(form.stock)) || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))) errors.stock = "Stock debe ser un entero >= 0";
    if (form.peso !== "" && (isNaN(Number(form.peso)) || Number(form.peso) < 0)) errors.peso = "Peso inválido";
    if (form.alto !== "" && (isNaN(Number(form.alto)) || Number(form.alto) < 0)) errors.alto = "Alto inválido";
    if (form.ancho !== "" && (isNaN(Number(form.ancho)) || Number(form.ancho) < 0)) errors.ancho = "Ancho inválido";
    if (form.largo !== "" && (isNaN(Number(form.largo)) || Number(form.largo) < 0)) errors.largo = "Largo inválido";
    if (form.sku && form.sku.length > 100) errors.sku = "Máximo 100 caracteres";

    const normalizedAttributes = normalizeAttributeRows(form.atributos);
    const normalizedDiscounts = normalizeDiscountRows(form.descuentosMayoreo)
      .sort((left, right) => left.cantidadMin - right.cantidadMin);
    const duplicateKeys = new Set();

    for (const row of normalizedAttributes) {
      if (!row.nombre || !row.valor) {
        errors.atributos = "Completa nombre y valor en cada atributo o elimina la fila vacía.";
        break;
      }

      const key = `${row.nombre.toLowerCase()}::${row.valor.toLowerCase()}`;
      if (duplicateKeys.has(key)) {
        errors.atributos = "No repitas el mismo atributo y valor.";
        break;
      }

      duplicateKeys.add(key);

      if (row.nombre.length > 80) {
        errors.atributos = "El nombre del atributo tiene máximo 80 caracteres.";
        break;
      }

      if (row.valor.length > 120) {
        errors.atributos = "El valor del atributo tiene máximo 120 caracteres.";
        break;
      }
    }

    for (const row of normalizedDiscounts) {
      if (!Number.isInteger(row.cantidadMin) || row.cantidadMin <= 0) {
        errors.descuentosMayoreo = "cantidadMin debe ser un entero mayor a 0.";
        break;
      }

      if (!Number.isInteger(row.cantidadMax) || row.cantidadMax <= 0) {
        errors.descuentosMayoreo = "cantidadMax debe ser un entero mayor a 0.";
        break;
      }

      if (row.cantidadMin > row.cantidadMax) {
        errors.descuentosMayoreo = "cantidadMin no puede ser mayor que cantidadMax.";
        break;
      }

      if (!["PORCENTAJE", "MONTO", "PRECIO_FIJO"].includes(row.tipoDescuento)) {
        errors.descuentosMayoreo = "Tipo de descuento inválido.";
        break;
      }

      if (!Number.isFinite(row.valor) || row.valor < 0) {
        errors.descuentosMayoreo = "Valor de descuento inválido.";
        break;
      }

      if (row.tipoDescuento === "PORCENTAJE" && (row.valor <= 0 || row.valor > 100)) {
        errors.descuentosMayoreo = "En porcentaje, el valor debe estar entre 0.01 y 100.";
        break;
      }

      if (row.tipoDescuento === "MONTO" && row.valor <= 0) {
        errors.descuentosMayoreo = "En monto, el valor debe ser mayor a 0.";
        break;
      }
    }

    if (!errors.descuentosMayoreo) {
      for (let index = 1; index < normalizedDiscounts.length; index += 1) {
        const prev = normalizedDiscounts[index - 1];
        const current = normalizedDiscounts[index];

        if (current.cantidadMin <= prev.cantidadMax) {
          errors.descuentosMayoreo = "Los rangos de mayoreo no deben traslaparse.";
          break;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        categoriaId: Number(form.categoriaId),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        stock: form.stock !== "" ? Number(form.stock) : 0,
        peso: form.peso !== "" ? Number(form.peso) : null,
        alto: form.alto !== "" ? Number(form.alto) : null,
        ancho: form.ancho !== "" ? Number(form.ancho) : null,
        largo: form.largo !== "" ? Number(form.largo) : null,
        sku: form.sku.trim() || undefined,
        status: form.status,
        atributos: normalizeAttributeRows(form.atributos),
        descuentosMayoreo: normalizeDiscountRows(form.descuentosMayoreo).sort(
          (left, right) => left.cantidadMin - right.cantidadMin
        ),
      };
      if (modalMode === "create") {
        await productosService.create(payload);
        toast.success("Producto creado correctamente");
      } else {
        await productosService.update(selectedProducto.id, payload);
        toast.success("Producto actualizado correctamente");
      }
      setShowModal(false);
      fetchProductos();
      if (modalMode === "create") setCurrentPage(1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al guardar producto";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Status / Delete ───────────────────────────────────────────────────────

  const askConfirm = (action) => { setConfirmAction(() => action); setShowConfirm(true); };

  const handleToggleStatus = (prod) => {
    askConfirm(async () => {
      try {
        await productosService.updateStatus(prod.id, !prod.status);
        toast.success(`Producto ${!prod.status ? "activado" : "desactivado"}`);
        fetchProductos();
      } catch { toast.error("Error al cambiar estado"); }
    });
  };

  const handleDelete = (prod) => {
    askConfirm(async () => {
      try {
        await productosService.delete(prod.id);
        toast.success("Producto eliminado");
        fetchProductos();
      } catch { toast.error("Error al eliminar producto"); }
    });
  };

  const updateAttributeRow = (index, field, value) => {
    setForm((current) => {
      const next = [...current.atributos];
      next[index] = { ...next[index], [field]: value };
      return { ...current, atributos: next };
    });
  };

  const addAttributeRow = () => {
    setForm((current) => ({
      ...current,
      atributos: [...current.atributos, createAttributeRow()],
    }));
  };

  const removeAttributeRow = (index) => {
    setForm((current) => ({
      ...current,
      atributos: current.atributos.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const updateDiscountRow = (index, field, value) => {
    setForm((current) => {
      const next = [...current.descuentosMayoreo];
      next[index] = { ...next[index], [field]: value };
      return { ...current, descuentosMayoreo: next };
    });
  };

  const addDiscountRow = () => {
    setForm((current) => ({
      ...current,
      descuentosMayoreo: [...current.descuentosMayoreo, createDiscountRow()],
    }));
  };

  const removeDiscountRow = (index) => {
    setForm((current) => ({
      ...current,
      descuentosMayoreo: current.descuentosMayoreo.filter((_, rowIndex) => rowIndex !== index),
    }));
  };


  // ─── Image modal ───────────────────────────────────────────────────────────

  const openImageModal = async (prod) => {
    setImageProducto(prod);
    setUploadFiles([]);
    setShowImageModal(true);
    setLoadingImages(true);
    try {
      const res = await productosService.listImagenes(prod.id);
      setImagenes(res.data?.data || []);
    } catch { toast.error("Error al cargar imágenes"); }
    finally { setLoadingImages(false); }
  };

  const handleUploadImages = async () => {
    if (!uploadFiles.length) return;
    const fd = new FormData();
    for (const f of uploadFiles) fd.append("imagenes", f);
    setUploadingImages(true);
    try {
      await productosService.uploadImagenes(imageProducto.id, fd);
      toast.success("Imágenes subidas correctamente");
      setUploadFiles([]);
      const res = await productosService.listImagenes(imageProducto.id);
      setImagenes(res.data?.data || []);
      fetchProductos();
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al subir imágenes";
      toast.error(msg);
    } finally { setUploadingImages(false); }
  };

  const handleDeleteImagen = async (imagenId) => {
    try {
      await productosService.deleteImagen(imageProducto.id, imagenId);
      toast.success("Imagen eliminada");
      setImagenes((prev) => prev.filter((img) => img.id !== imagenId));
    } catch { toast.error("Error al eliminar imagen"); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Productos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gestiona el catálogo de productos ({total} registros)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={filterCategoriaId}
              onChange={(e) => {
                setFilterCategoriaId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
              <EstadoPill
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                labels={["Activos", "Inactivos"]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : paginatedProductos.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No se encontraron productos</div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 font-semibold">SKU</th>
                      <th className="px-4 py-3 font-semibold">Precio</th>
                      <th className="px-4 py-3 font-semibold">Stock</th>
                      <th className="px-4 py-3 font-semibold">Categoría</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedProductos.map((prod) => {
                      const firstImg = prod.imagenes?.[0];
                      return (
                        <tr key={prod.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0">
                                {firstImg ? (
                                  <img src={`${API_BASE_URL}/uploads/${firstImg.url}`} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <ShoppingBag size={16} />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-gray-800 dark:text-white truncate">{prod.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{prod.sku || "—"}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">${Number(prod.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prod.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                              {prod.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{prod.categoria?.name || "Sin categoría"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${prod.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                              {prod.status ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openImageModal(prod)} title="Imágenes" className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                                <ImagePlus size={15} />
                              </button>
                              <button onClick={() => openEdit(prod)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => handleToggleStatus(prod)} title={prod.status ? "Desactivar" : "Activar"} className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                                <Power size={15} />
                              </button>
                              <button onClick={() => handleDelete(prod)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden grid grid-cols-1 gap-4">
              {paginatedProductos.map((prod) => {
                const firstImg = prod.imagenes?.[0];
                return (
                  <div key={prod.id} className="group rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shrink-0">
                          {firstImg ? (
                            <img src={`${API_BASE_URL}/uploads/${firstImg.url}`} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <ShoppingBag size={16} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{prod.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${prod.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                              {prod.status ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 font-mono">SKU: {prod.sku || "—"}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">${Number(prod.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${prod.stock === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                              Stock: {prod.stock}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 truncate">{prod.categoria?.name || "Sin categoría"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex items-center justify-end gap-1.5">
                      <button onClick={() => openImageModal(prod)} title="Imágenes" className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                        <ImagePlus size={15} />
                      </button>
                      <button onClick={() => openEdit(prod)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleToggleStatus(prod)} title={prod.status ? "Desactivar" : "Activar"} className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        <Power size={15} />
                      </button>
                      <button onClick={() => handleDelete(prod)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Anterior
          </button>

          {getPaginationItems(currentPage, totalPages).map((item, idx) =>
            item === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`min-w-9 h-9 px-2 text-sm rounded-xl border transition-colors ${
                  currentPage === item
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              {modalMode === "create" ? "Nuevo Producto" : "Editar Producto"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría <span className="text-red-500">*</span></label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.categoriaId ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {formErrors.categoriaId && <p className="text-xs text-red-500 mt-1">{formErrors.categoriaId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. iPhone 15 Pro"
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del producto..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.price ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.stock ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.stock && <p className="text-xs text-red-500 mt-1">{formErrors.stock}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.peso}
                    onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))}
                    placeholder="Ej. 1.25"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.peso ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.peso && <p className="text-xs text-red-500 mt-1">{formErrors.peso}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.alto}
                    onChange={(e) => setForm((f) => ({ ...f, alto: e.target.value }))}
                    placeholder="Ej. 15.00"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.alto ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.alto && <p className="text-xs text-red-500 mt-1">{formErrors.alto}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ancho}
                    onChange={(e) => setForm((f) => ({ ...f, ancho: e.target.value }))}
                    placeholder="Ej. 8.00"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.ancho ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.ancho && <p className="text-xs text-red-500 mt-1">{formErrors.ancho}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Largo (cm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.largo}
                    onChange={(e) => setForm((f) => ({ ...f, largo: e.target.value }))}
                    placeholder="Ej. 20.00"
                    className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.largo ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {formErrors.largo && <p className="text-xs text-red-500 mt-1">{formErrors.largo}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Código único del producto"
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.sku ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                />
                {formErrors.sku && <p className="text-xs text-red-500 mt-1">{formErrors.sku}</p>}
              </div>
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Atributos del producto</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega pares nombre/valor como Color, Talla o Voltaje.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addAttributeRow}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Agregar atributo
                  </button>
                </div>

                <div className="space-y-3">
                  {form.atributos.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin atributos añadidos.</p>
                  ) : (
                    form.atributos.map((row, index) => (
                      <div key={row.id || index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={row.nombre}
                            onChange={(event) => updateAttributeRow(index, "nombre", event.target.value)}
                            placeholder="Ej. Color"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor</label>
                          <input
                            type="text"
                            value={row.valor}
                            onChange={(event) => updateAttributeRow(index, "valor", event.target.value)}
                            placeholder="Ej. Rojo"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttributeRow(index)}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 text-sm"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {formErrors.atributos && <p className="text-xs text-red-500 mt-3">{formErrors.atributos}</p>}
              </div>

              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precios por mayoreo</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Define rangos por cantidad para porcentaje, monto o precio fijo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addDiscountRow}
                    className="px-3 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors"
                  >
                    Agregar rango
                  </button>
                </div>

                <div className="space-y-3">
                  {form.descuentosMayoreo.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin rangos de mayoreo.</p>
                  ) : (
                    form.descuentosMayoreo.map((row, index) => (
                      <div key={row.id || index} className="grid grid-cols-1 sm:grid-cols-[0.8fr_0.8fr_1fr_1fr_auto] gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cantidad min</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.cantidadMin}
                            onChange={(event) => updateDiscountRow(index, "cantidadMin", event.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cantidad max</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.cantidadMax}
                            onChange={(event) => updateDiscountRow(index, "cantidadMax", event.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                          <select
                            value={row.tipoDescuento}
                            onChange={(event) => updateDiscountRow(index, "tipoDescuento", event.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="PORCENTAJE">PORCENTAJE</option>
                            <option value="MONTO">MONTO</option>
                            <option value="PRECIO_FIJO">PRECIO_FIJO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.valor}
                            onChange={(event) => updateDiscountRow(index, "valor", event.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDiscountRow(index)}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 text-sm"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {formErrors.descuentosMayoreo && <p className="text-xs text-red-500 mt-3">{formErrors.descuentosMayoreo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <EstadoPill
                  value={form.status ? 1 : 0}
                  onChange={(value) => setForm((f) => ({ ...f, status: value === 1 }))}
                  labels={["Activo", "Inactivo"]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors disabled:opacity-60">
                {saving ? "Guardando..." : modalMode === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && imageProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Imágenes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{imageProducto.name}</p>

            {/* Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subir nuevas imágenes (JPEG, PNG, WebP · máx 2 MB c/u · máx 10)
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100"
              />
              {uploadFiles.length > 0 && (
                <button
                  onClick={handleUploadImages}
                  disabled={uploadingImages}
                  className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  <ImagePlus size={15} />
                  {uploadingImages ? "Subiendo..." : `Subir ${uploadFiles.length} imagen(es)`}
                </button>
              )}
            </div>

            {/* Current images */}
            {loadingImages ? (
              <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
            ) : imagenes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin imágenes aún</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {imagenes.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={`${API_BASE_URL}/uploads/${img.url}`}
                      alt=""
                      className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={() => handleDeleteImagen(img.id)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                    {img.orden === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowImageModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-6">¿Confirmas esta acción?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={async () => { setShowConfirm(false); await confirmAction?.(); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoPill({ value, onChange, labels = ["Activos", "Inactivos"] }) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700">
      <button
        type="button"
        onClick={() => onChange(1)}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${value === 1 ? "bg-green-600 text-white" : "text-gray-700 dark:text-gray-200"}`}
      >
        {labels[0]}
      </button>
      <button
        type="button"
        onClick={() => onChange(0)}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${value === 0 ? "bg-amber-600 text-white" : "text-gray-700 dark:text-gray-200"}`}
      >
        {labels[1]}
      </button>
    </div>
  );
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}
