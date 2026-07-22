import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Search, X, Pencil, Trash2, Tag, Power, ImagePlus, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { categoriasService, productosService } from "../../../api/catalogoService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(1); // 1 = activas, 0 = inactivas

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", status: true });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const previewImageSrc = typeof previewUrl === "string" && previewUrl.trim() ? previewUrl : null;

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchCategorias();
    setCurrentPage(1);
  }, [search]);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await categoriasService.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        include_inactive: true,
      });
      const { data } = res.data;
      setCategorias(data || []);
    } catch (err) {
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategorias = useMemo(() => {
    return categorias.filter((cat) => (statusFilter === 1 ? cat.status : !cat.status));
  }, [categorias, statusFilter]);

  const total = filteredCategorias.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedCategorias = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * limit;
    return filteredCategorias.slice(start, start + limit);
  }, [filteredCategorias, currentPage, totalPages, limit]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelectedCategoria(null);
    setForm({ name: "", description: "", imageUrl: "", status: true });
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setModalMode("edit");
    setSelectedCategoria(cat);
    setForm({ name: cat.name, description: cat.description || "", imageUrl: cat.imageUrl || "", status: cat.status });
    setFormErrors({});
    setSelectedFile(null);
    setPreviewUrl(getCategoryImageUrl(cat.imageUrl));
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "El nombre es obligatorio";
    else if (form.name.trim().length < 2) errors.name = "Mínimo 2 caracteres";
    else if (form.name.trim().length > 120) errors.name = "Máximo 120 caracteres";
    if (form.description && form.description.length > 255) errors.description = "Máximo 255 caracteres";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("description", form.description.trim() || "");
        formData.append("status", String(form.status));
        formData.append("imagen", selectedFile);

        if (modalMode === "create") {
          await categoriasService.create(formData);
          toast.success("Categoría creada correctamente");
        } else {
          await categoriasService.update(selectedCategoria.id, formData);
          toast.success("Categoría actualizada correctamente");
        }
      } else {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim(),
          status: form.status,
        };
        if (modalMode === "create") {
          await categoriasService.create(payload);
          toast.success("Categoría creada correctamente");
        } else {
          await categoriasService.update(selectedCategoria.id, payload);
          toast.success("Categoría actualizada correctamente");
        }
      }
      setShowModal(false);
      fetchCategorias();
      if (modalMode === "create") setCurrentPage(1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al guardar categoría";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Status / Delete helpers ───────────────────────────────────────────────

  const askConfirm = (action) => {
    setConfirmAction(() => action);
    setShowConfirm(true);
  };

  const handleToggleStatus = (cat) => {
    askConfirm(async () => {
      try {
        await categoriasService.updateStatus(cat.id, !cat.status);
        toast.success(`Categoría ${!cat.status ? "activada" : "desactivada"}`);
        fetchCategorias();
      } catch {
        toast.error("Error al cambiar estado");
      }
    });
  };

  const handleDelete = (cat) => {
    askConfirm(async () => {
      try {
        const childRes = await productosService.list({
          categoriaId: cat.id,
          page: 1,
          limit: 1,
          include_inactive: true,
        });
        const childTotal = childRes?.data?.pagination?.total ?? childRes?.data?.data?.length ?? 0;
        if (childTotal > 0) {
          toast.error("No puedes eliminar esta categoría porque tiene productos asociados");
          return;
        }

        await categoriasService.delete(cat.id);
        toast.success("Categoría eliminada");
        fetchCategorias();
      } catch {
        toast.error("Error al eliminar categoría");
      }
    });
  };

  const handleFileSelection = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes JPG, PNG o WEBP");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setForm((f) => ({ ...f, imageUrl: "" }));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Categorías</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gestiona las categorías del catálogo ({total} registros)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
            <EstadoPill
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              labels={["Activas", "Inactivas"]}
            />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : paginatedCategorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No se encontraron categorías</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-semibold">Categoría</th>
                      <th className="px-4 py-3 font-semibold">Descripción</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Creación</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedCategorias.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 shrink-0 bg-sky-600/10">
                              {cat.imageUrl ? (
                                <img src={getCategoryImageUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sky-600 dark:text-sky-400">
                                  <Tag size={16} />
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-white truncate">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{cat.description || "Sin descripción"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {cat.status ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("es-MX") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(cat)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleToggleStatus(cat)} title={cat.status ? "Desactivar" : "Activar"} className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                              <Power size={15} />
                            </button>
                            <button onClick={() => handleDelete(cat)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {paginatedCategorias.map((cat) => (
                <div
                  key={cat.id}
                  className="group rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 bg-sky-600/10 shrink-0">
                        {cat.imageUrl ? (
                          <img src={getCategoryImageUrl(cat.imageUrl)} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sky-600 dark:text-sky-400">
                            <Tag size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{cat.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${cat.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {cat.status ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-2">{cat.description || "Sin descripción"}</p>
                        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("es-MX") : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEdit(cat)}
                      title="Editar"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(cat)}
                      title={cat.status ? "Desactivar" : "Activar"}
                      className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <Power size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      title="Eliminar"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              {modalMode === "create" ? "Nueva Categoría" : "Editar Categoría"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Electrónica"
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional..."
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${formErrors.description ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
                />
                {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileSelection(file);
                  }}
                  className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40"}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelection(file);
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
                      {dragActive ? <UploadCloud size={18} /> : <ImagePlus size={18} />}
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Arrastra la imagen aquí o <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline">selecciona un archivo</button></p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">JPG, PNG o WEBP · máx. 2 MB</p>
                  </div>
                </div>
                {(previewImageSrc || selectedFile) && (
                  <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Vista previa</p>
                      <button type="button" onClick={clearSelectedFile} className="text-xs text-red-500 hover:underline">Quitar</button>
                    </div>
                    {previewImageSrc ? (
                      <img src={previewImageSrc} alt="Vista previa de la categoría" className="h-32 w-full object-cover rounded-lg" />
                    ) : null}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <EstadoPill
                  value={form.status ? 1 : 0}
                  onChange={(value) => setForm((f) => ({ ...f, status: value === 1 }))}
                  labels={["Activa", "Inactiva"]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando..." : modalMode === "create" ? "Crear" : "Guardar"}
              </button>
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
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await confirmAction?.();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
              >
                Confirmar
              </button>
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

function getCategoryImageUrl(value) {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${STATIC_BASE_URL}/uploads/${value}`;
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
