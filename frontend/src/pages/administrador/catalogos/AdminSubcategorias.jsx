import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, Pencil, Trash2, RefreshCw, Layers, Power } from "lucide-react";
import toast from "react-hot-toast";
import { subcategoriasService, categoriasService, productosService } from "../../../api/catalogoService";

export default function AdminSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterCategoriaId, setFilterCategoriaId] = useState("");
  const [statusFilter, setStatusFilter] = useState(1); // 1 = activas, 0 = inactivas

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSub, setSelectedSub] = useState(null);
  const [form, setForm] = useState({ categoriaId: "", name: "", description: "", status: true });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchSubcategorias();
    setCurrentPage(1);
  }, [search]);

  const fetchCategorias = async () => {
    try {
      const res = await categoriasService.list({ limit: 100 });
      setCategorias(res.data?.data || []);
    } catch {
      // no toast, not critical
    }
  };

  const fetchSubcategorias = async () => {
    setLoading(true);
    try {
      const res = await subcategoriasService.list({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        include_inactive: true,
      });
      const { data } = res.data;
      setSubcategorias(data || []);
    } catch {
      toast.error("Error al cargar subcategorías");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubcategorias = useMemo(() => {
    return subcategorias.filter((sub) => {
      const byStatus = statusFilter === 1 ? sub.status : !sub.status;
      const byCategoria = filterCategoriaId ? String(sub.categoriaId) === String(filterCategoriaId) : true;
      return byStatus && byCategoria;
    });
  }, [subcategorias, statusFilter, filterCategoriaId]);

  const total = filteredSubcategorias.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedSubcategorias = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * limit;
    return filteredSubcategorias.slice(start, start + limit);
  }, [filteredSubcategorias, currentPage, totalPages, limit]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setModalMode("create");
    setSelectedSub(null);
    setForm({ categoriaId: filterCategoriaId || "", name: "", description: "", status: true });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (sub) => {
    setModalMode("edit");
    setSelectedSub(sub);
    setForm({
      categoriaId: String(sub.categoriaId),
      name: sub.name,
      description: sub.description || "",
      status: sub.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.categoriaId) errors.categoriaId = "Selecciona una categoría";
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
      const payload = {
        categoriaId: Number(form.categoriaId),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      };
      if (modalMode === "create") {
        await subcategoriasService.create(payload);
        toast.success("Subcategoría creada correctamente");
      } else {
        await subcategoriasService.update(selectedSub.id, payload);
        toast.success("Subcategoría actualizada correctamente");
      }
      setShowModal(false);
      fetchSubcategorias();
      if (modalMode === "create") setCurrentPage(1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al guardar subcategoría";
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

  const handleToggleStatus = (sub) => {
    askConfirm(async () => {
      try {
        await subcategoriasService.updateStatus(sub.id, !sub.status);
        toast.success(`Subcategoría ${!sub.status ? "activada" : "desactivada"}`);
        fetchSubcategorias();
      } catch {
        toast.error("Error al cambiar estado");
      }
    });
  };

  const handleDelete = (sub) => {
    askConfirm(async () => {
      try {
        const childRes = await productosService.list({
          subcategoriaId: sub.id,
          page: 1,
          limit: 1,
          include_inactive: true,
        });
        const childTotal = childRes?.data?.pagination?.total ?? childRes?.data?.data?.length ?? 0;
        if (childTotal > 0) {
          toast.error("No puedes eliminar esta subcategoría porque tiene productos asociados");
          return;
        }

        await subcategoriasService.delete(sub.id);
        toast.success("Subcategoría eliminada");
        fetchSubcategorias();
      } catch {
        toast.error("Error al eliminar subcategoría");
      }
    });
  };

  const handleReactivate = async (sub) => {
    try {
      await subcategoriasService.reactivate(sub.id);
      toast.success("Subcategoría reactivada");
      fetchSubcategorias();
    } catch {
      toast.error("Error al reactivar subcategoría");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Subcategorías</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gestiona las subcategorías del catálogo ({total} registros)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Nueva Subcategoría</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
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
                labels={["Activas", "Inactivas"]}
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
        ) : paginatedSubcategorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No se encontraron subcategorías</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-semibold">Subcategoría</th>
                      <th className="px-4 py-3 font-semibold">Categoría</th>
                      <th className="px-4 py-3 font-semibold">Descripción</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedSubcategorias.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <Layers size={16} />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-white truncate">{sub.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sub.categoria?.name || "Sin categoría"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{sub.description || "Sin descripción"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sub.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {sub.status ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(sub)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Pencil size={15} />
                            </button>
                            {sub.status ? (
                              <button onClick={() => handleToggleStatus(sub)} title="Desactivar" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                                <Power size={15} />
                              </button>
                            ) : (
                              <button onClick={() => handleReactivate(sub)} title="Reactivar" className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                                <RefreshCw size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(sub)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
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

            <div className="md:hidden grid grid-cols-1 gap-4">
              {paginatedSubcategorias.map((sub) => (
                <div key={sub.id} className="group rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Layers size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{sub.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${sub.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {sub.status ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 truncate">{sub.categoria?.name || "Sin categoría"}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-2">{sub.description || "Sin descripción"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(sub)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <Pencil size={15} />
                    </button>
                    {sub.status ? (
                      <button onClick={() => handleToggleStatus(sub)} title="Desactivar" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        <Power size={15} />
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(sub)} title="Reactivar" className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                        <RefreshCw size={15} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(sub)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
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
              {modalMode === "create" ? "Nueva Subcategoría" : "Editar Subcategoría"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Smartphones"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <EstadoPill
                  value={form.status ? 1 : 0}
                  onChange={(value) => setForm((f) => ({ ...f, status: value === 1 }))}
                  labels={["Activa", "Inactiva"]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors disabled:opacity-60">
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
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancelar
              </button>
              <button
                onClick={async () => { setShowConfirm(false); await confirmAction?.(); }}
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
