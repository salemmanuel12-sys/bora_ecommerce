import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, Pencil, Trash2, RefreshCw, Power } from "lucide-react";
import toast from "react-hot-toast";
import { bannerService } from "../../../api/bannerService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:4001";
const inputCls =
  "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

const initialForm = {
  title: "",
  description: "",
  ctaText: "",
  ctaLink: "",
  orden: "0",
  status: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
    setCurrentPage(1);
  }, [search]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerService.adminList({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        includeInactive: true,
      });
      setBanners(res.data || []);
    } catch {
      toast.error("Error al cargar banners");
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = useMemo(() => {
    return banners.filter((item) => (statusFilter === 1 ? item.status : !item.status));
  }, [banners, statusFilter]);

  const total = filteredBanners.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedBanners = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * limit;
    return filteredBanners.slice(start, start + limit);
  }, [filteredBanners, currentPage, totalPages, limit]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setModalMode("create");
    setSelectedBanner(null);
    setForm(initialForm);
    setImageFile(null);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setModalMode("edit");
    setSelectedBanner(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      ctaText: item.ctaText || "",
      ctaLink: item.ctaLink || "",
      orden: String(item.orden ?? 0),
      status: Boolean(item.status),
    });
    setImageFile(null);
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "El título es obligatorio";
    else if (form.title.trim().length > 140) errors.title = "Máximo 140 caracteres";

    if (form.description && form.description.length > 280) errors.description = "Máximo 280 caracteres";
    if (form.ctaText && form.ctaText.length > 80) errors.ctaText = "Máximo 80 caracteres";

    if (form.ctaLink && !/^https?:\/\//i.test(form.ctaLink) && !String(form.ctaLink).startsWith("/")) {
      errors.ctaLink = "Usa una URL absoluta (http/https) o ruta interna con /";
    }

    if (form.orden !== "" && (!Number.isInteger(Number(form.orden)) || Number(form.orden) < 0)) {
      errors.orden = "Orden debe ser entero >= 0";
    }

    if (modalMode === "create" && !imageFile) {
      errors.imageFile = "La imagen es obligatoria";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    if (form.description.trim()) fd.append("description", form.description.trim());
    if (form.ctaText.trim()) fd.append("ctaText", form.ctaText.trim());
    if (form.ctaLink.trim()) fd.append("ctaLink", form.ctaLink.trim());
    fd.append("orden", String(Number(form.orden || 0)));
    fd.append("status", String(Boolean(form.status)));
    if (imageFile) fd.append("imagen", imageFile);
    return fd;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const fd = buildFormData();

      if (modalMode === "create") {
        await bannerService.adminCreate(fd);
        toast.success("Banner creado correctamente");
      } else {
        await bannerService.adminUpdate(selectedBanner.id, fd);
        toast.success("Banner actualizado correctamente");
      }

      setShowModal(false);
      fetchBanners();
      if (modalMode === "create") setCurrentPage(1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al guardar banner";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await bannerService.adminUpdateStatus(item.id, !item.status);
      toast.success(`Banner ${!item.status ? "activado" : "desactivado"}`);
      fetchBanners();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (item) => {
    try {
      await bannerService.adminDelete(item.id);
      toast.success("Banner eliminado");
      fetchBanners();
    } catch {
      toast.error("Error al eliminar banner");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Administrar Banners</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Gestiona los anuncios visibles en catálogo ({total} registros)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Banner</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
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
              labels={["Activos", "Inactivos"]}
            />
            <button
              onClick={fetchBanners}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <RefreshCw size={14} /> Recargar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : paginatedBanners.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No se encontraron banners</div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-semibold">Banner</th>
                      <th className="px-4 py-3 font-semibold">CTA</th>
                      <th className="px-4 py-3 font-semibold">Orden</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedBanners.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                              <img src={`${API_BASE_URL}/uploads-banner/${item.imageUrl}`} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.description || "Sin descripción"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          <p className="text-xs font-semibold">{item.ctaText || "Sin botón"}</p>
                          <p className="text-[11px] truncate max-w-[220px]">{item.ctaLink || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.orden}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.status ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {item.status ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(item)} title="Editar" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleToggleStatus(item)} title="Estado" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                              <Power size={15} />
                            </button>
                            <button onClick={() => handleDelete(item)} title="Eliminar" className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
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
              {paginatedBanners.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 h-32 w-full overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={`${API_BASE_URL}/uploads-banner/${item.imageUrl}`} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.description || "Sin descripción"}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => handleToggleStatus(item)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                      <Power size={12} /> Estado
                    </button>
                    <button onClick={() => handleDelete(item)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                      <Trash2 size={12} /> Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Página {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50">Anterior</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Nuevo Banner" : "Editar Banner"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Título" error={formErrors.title}>
                <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className={inputCls} />
              </Field>

              <Field label="Orden" error={formErrors.orden}>
                <input type="number" min={0} value={form.orden} onChange={(e) => setForm((s) => ({ ...s, orden: e.target.value }))} className={inputCls} />
              </Field>

              <Field label="Descripción" error={formErrors.description} className="md:col-span-2">
                <textarea rows={2} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className={inputCls} />
              </Field>

              <Field label="Texto CTA" error={formErrors.ctaText}>
                <input value={form.ctaText} onChange={(e) => setForm((s) => ({ ...s, ctaText: e.target.value }))} className={inputCls} />
              </Field>

              <Field label="Enlace CTA" error={formErrors.ctaLink}>
                <input value={form.ctaLink} onChange={(e) => setForm((s) => ({ ...s, ctaLink: e.target.value }))} className={inputCls} />
              </Field>

              <Field label="Imagen" error={formErrors.imageFile} className="md:col-span-2">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={inputCls} />
                {modalMode === "edit" && selectedBanner?.imageUrl ? (
                  <p className="mt-1 text-xs text-gray-500">Si no seleccionas imagen, se conserva la actual.</p>
                ) : null}
              </Field>

              <label className="md:col-span-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                <input type="checkbox" checked={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Banner activo
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Guardando..." : modalMode === "create" ? "Crear" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function EstadoPill({ value, onChange, labels = ["Activos", "Inactivos"] }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      {[0, 1].map((idx) => {
        const realValue = idx === 0 ? 1 : 0;
        const active = value === realValue;
        return (
          <button
            key={realValue}
            type="button"
            onClick={() => onChange(realValue)}
            className={`px-3 py-1.5 text-xs font-medium transition ${active ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {labels[idx]}
          </button>
        );
      })}
    </div>
  );
}
