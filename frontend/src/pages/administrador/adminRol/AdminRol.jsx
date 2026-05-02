import { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Eye,
  Search,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import axios from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

const initialForm = {
  NOMBRE: "",
  DESCRIPCION: "",
};

const SAFE_NAME_REGEX = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü .,\-_()]{2,100}$/;
const SAFE_DESC_REGEX = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü .,\-_:;()/%]{0,255}$/;
const SAFE_SEARCH_REGEX = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü .,\-_()]{1,100}$/;

const normalizeInput = (value = "") =>
  String(value).normalize("NFKC").replace(/\s+/g, " ").trim();

export default function AdminRol() {
  const { user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusView, setStatusView] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRol, setDetailRol] = useState(null);
  const [detailStatusFilter, setDetailStatusFilter] = useState("all");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedRol, setSelectedRol] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  if (user?.rol !== 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Solo los superadministradores pueden gestionar roles.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchRoles(currentPage, search);
  }, [currentPage, statusView]);

  const fetchRoles = async (page = 1, searchValue = "") => {
    setLoading(true);
    try {
      const estado = statusView === "active" ? 1 : 0;
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        estado: String(estado),
      });

      if (searchValue.trim()) {
        query.append("search", searchValue.trim());
      }

      const res = await axios.get(`/admin/roles?${query.toString()}`);

      setRoles(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("No se pudieron cargar los roles");
      setRoles([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const safeSearch = normalizeInput(search);
    if (safeSearch.length > 100) {
      toast.error("La búsqueda no puede superar 100 caracteres");
      return;
    }

    if (safeSearch && !SAFE_SEARCH_REGEX.test(safeSearch)) {
      toast.error("La búsqueda contiene caracteres no permitidos");
      return;
    }

    setSearch(safeSearch);
    setCurrentPage(1);
    fetchRoles(1, safeSearch);
  };

  const openCreateModal = () => {
    setEditingRol(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (rol) => {
    setEditingRol(rol);
    setForm({
      NOMBRE: rol.NOMBRE || "",
      DESCRIPCION: rol.DESCRIPCION || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRol(null);
    setForm(initialForm);
  };

  const validateForm = () => {
    const nombre = normalizeInput(form.NOMBRE);
    const descripcion = normalizeInput(form.DESCRIPCION);

    if (!nombre) {
      toast.error("El nombre del rol es obligatorio");
      return false;
    }

    if (!SAFE_NAME_REGEX.test(nombre)) {
      toast.error("El nombre contiene caracteres no permitidos o longitud inválida");
      return false;
    }

    if (!SAFE_DESC_REGEX.test(descripcion)) {
      toast.error("La descripción contiene caracteres no permitidos o es demasiado larga");
      return false;
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const nombre = normalizeInput(form.NOMBRE);
      const descripcion = normalizeInput(form.DESCRIPCION);

      if (editingRol && !Number.isInteger(editingRol.ID_ROL)) {
        toast.error("ID de rol inválido");
        setSaving(false);
        return;
      }

      const payload = {
        NOMBRE: nombre,
        DESCRIPCION: descripcion,
      };

      if (editingRol) {
        await axios.put(`/admin/roles/${editingRol.ID_ROL}`, payload);
        toast.success("Rol actualizado correctamente");
      } else {
        await axios.post("/admin/roles", payload);
        toast.success("Rol creado correctamente");
      }

      closeModal();
      fetchRoles(currentPage, search);
    } catch (error) {
      const message = error?.response?.data?.message || "No se pudo guardar el rol";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rol) => {
    if (!Number.isInteger(rol?.ID_ROL)) {
      toast.error("ID de rol inválido");
      return;
    }
    setActionType("delete");
    setSelectedRol(rol);
    setMotivoBaja("");
    setShowActionModal(true);
  };

  const handleReactivate = async (rol) => {
    if (!Number.isInteger(rol?.ID_ROL)) {
      toast.error("ID de rol inválido");
      return;
    }
    setActionType("reactivate");
    setSelectedRol(rol);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    if (actionLoading) {
      return;
    }

    setShowActionModal(false);
    setActionType(null);
    setSelectedRol(null);
    setMotivoBaja("");
  };

  const handleConfirmAction = async () => {
    if (!selectedRol || !Number.isInteger(selectedRol.ID_ROL)) {
      toast.error("ID de rol inválido");
      return;
    }

    if (actionType === "delete") {
      const motivo = normalizeInput(motivoBaja);
      if (motivo.length > 100 || !SAFE_DESC_REGEX.test(motivo || "")) {
        toast.error("El motivo contiene caracteres no permitidos o excede 100 caracteres");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (actionType === "delete") {
        await axios.delete(`/admin/roles/${selectedRol.ID_ROL}`, {
          data: { motivo: normalizeInput(motivoBaja) },
        });
        toast.success("Rol eliminado correctamente");
      } else {
        await axios.patch(`/admin/roles/${selectedRol.ID_ROL}/reactivate`);
        toast.success("Rol activado correctamente");
      }

      closeActionModal();
      fetchRoles(currentPage, search);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (actionType === "delete" ? "No se pudo eliminar el rol" : "No se pudo activar el rol");
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      default:
        return "Pendiente";
    }
  };

  const handleOpenDetail = async (rolId) => {
    if (!Number.isInteger(rolId)) {
      toast.error("ID de rol inválido");
      return;
    }

    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailRol(null);
    setDetailStatusFilter("all");

    try {
      const res = await axios.get(`/admin/roles/${rolId}`);
      setDetailRol(res.data?.data || null);
    } catch (error) {
      const message =
        error?.response?.data?.message || "No se pudo cargar el detalle del rol";
      toast.error(message);
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailLoading(false);
    setDetailRol(null);
    setDetailStatusFilter("all");
  };

  const detailAdmins = detailRol?.administradores || [];
  const filteredDetailAdmins = detailAdmins.filter((admin) => {
    if (detailStatusFilter === "all") {
      return true;
    }
    return admin.STATUS === detailStatusFilter;
  });

  const handleStatusChange = (nextStatus) => {
    if (nextStatus === statusView) {
      return;
    }

    setStatusView(nextStatus);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Gestión de Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Crea, actualiza y controla los roles de administradores.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={statusView === "inactive"}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Nuevo rol
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
          <div className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700">
            <button
              onClick={() => handleStatusChange("active")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusView === "active"
                  ? "bg-green-600 text-white"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => handleStatusChange("inactive")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                statusView === "inactive"
                  ? "bg-amber-600 text-white"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar por nombre de rol..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-300">
            <Loader2 className="animate-spin" size={18} />
            Cargando roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-300">
            {statusView === "active" ? "No hay roles activos registrados." : "No hay roles inactivos registrados."}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {roles.map((rol) => (
                    <tr key={rol.ID_ROL} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {rol.ID_ROL}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {rol.NOMBRE}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {rol.DESCRIPCION || "Sin descripción"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenDetail(rol.ID_ROL)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(rol)}
                            disabled={statusView === "inactive"}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar rol"
                          >
                            <Pencil size={18} />
                          </button>
                          {statusView === "active" ? (
                            <button
                              onClick={() => handleDelete(rol)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Eliminar rol"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(rol)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Activar rol"
                            >
                              <RefreshCw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((rol) => (
                <div key={rol.ID_ROL} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID: {rol.ID_ROL}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1">
                        {rol.NOMBRE}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {rol.DESCRIPCION || "Sin descripción"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenDetail(rol.ID_ROL)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(rol)}
                        disabled={statusView === "inactive"}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar rol"
                      >
                        <Pencil size={18} />
                      </button>
                      {statusView === "active" ? (
                        <button
                          onClick={() => handleDelete(rol)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar rol"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(rol)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Activar rol"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Mostrando {Math.min((currentPage - 1) * limit + 1, total)} a {Math.min(currentPage * limit, total)} de {total}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRol ? "Editar Rol" : "Nuevo Rol"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.NOMBRE}
                  onChange={(e) => setForm((prev) => ({ ...prev, NOMBRE: e.target.value }))}
                  maxLength={100}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Administrador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.DESCRIPCION}
                  onChange={(e) => setForm((prev) => ({ ...prev, DESCRIPCION: e.target.value }))}
                  rows={4}
                  maxLength={255}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el alcance del rol"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {editingRol ? "Guardar cambios" : "Crear rol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalle del Rol
              </h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-auto max-h-[calc(85vh-72px)]">
              {detailLoading ? (
                <div className="py-10 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-300">
                  <Loader2 className="animate-spin" size={18} />
                  Cargando detalle...
                </div>
              ) : detailRol ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">ID Rol</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{detailRol.ID_ROL}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Nombre</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{detailRol.NOMBRE}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Administradores</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {detailRol.administradores?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                      Administradores asociados
                    </h3>

                    {detailAdmins.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button
                          onClick={() => setDetailStatusFilter("all")}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            detailStatusFilter === "all"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          Todos ({detailAdmins.length})
                        </button>
                        <button
                          onClick={() => setDetailStatusFilter("pending")}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            detailStatusFilter === "pending"
                              ? "bg-yellow-600 border-yellow-600 text-white"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          Pendiente ({detailAdmins.filter((a) => a.STATUS === "pending").length})
                        </button>
                        <button
                          onClick={() => setDetailStatusFilter("approved")}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            detailStatusFilter === "approved"
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          Aprobado ({detailAdmins.filter((a) => a.STATUS === "approved").length})
                        </button>
                        <button
                          onClick={() => setDetailStatusFilter("rejected")}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            detailStatusFilter === "rejected"
                              ? "bg-red-600 border-red-600 text-white"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          Rechazado ({detailAdmins.filter((a) => a.STATUS === "rejected").length})
                        </button>
                      </div>
                    )}

                    {detailAdmins.length > 0 ? (
                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">ID</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Nombre</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredDetailAdmins.map((admin) => (
                              <tr key={admin.NUM_ADMIN}>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{admin.NUM_ADMIN}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{admin.NOMBRE}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{admin.EMAIL}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{getStatusText(admin.STATUS)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        Este rol no tiene administradores asociados.
                      </div>
                    )}

                    {detailAdmins.length > 0 && filteredDetailAdmins.length === 0 && (
                      <div className="mt-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        No hay administradores en el estado seleccionado.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-300">
                  No se encontró información del rol.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showActionModal && selectedRol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {actionType === "delete" ? "Confirmar eliminación" : "Confirmar activación"}
              </h2>
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className={`rounded-xl p-4 border mb-4 ${
                actionType === "delete"
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              }`}>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {actionType === "delete"
                    ? "Vas a desactivar este rol. Esta acción podrá revertirse más adelante desde Inactivos."
                    : "Vas a activar nuevamente este rol para que pueda utilizarse en el sistema."}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedRol.NOMBRE}
                </p>
              </div>

              {actionType === "delete" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo de baja (opcional)
                  </label>
                  <textarea
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    rows={3}
                    maxLength={100}
                    placeholder="Ej: Rol temporal, ya no se utilizará"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Máximo 100 caracteres.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-60 ${
                    actionType === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {actionLoading && <Loader2 className="animate-spin" size={16} />}
                  {actionType === "delete" ? "Eliminar rol" : "Activar rol"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
