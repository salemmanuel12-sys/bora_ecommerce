import { useEffect, useMemo, useState } from "react";
import { Search, X, RefreshCw, Power, Users } from "lucide-react";
import toast from "react-hot-toast";
import { adminUsuariosService } from "../../../api/adminUsuariosService";

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [workingUserId, setWorkingUserId] = useState(null);

  const loadUsuarios = async (targetPage = currentPage) => {
    setLoading(true);
    try {
      const status = statusFilter === "todos" ? undefined : statusFilter;
      const result = await adminUsuariosService.list({
        page: targetPage,
        limit,
        search,
        status,
      });
      setUsuarios(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          total: Array.isArray(result.data) ? result.data.length : 0,
          page: targetPage,
          limit,
          pages: 1,
        }
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudieron cargar los usuarios.");
      setUsuarios([]);
      setPagination({ total: 0, page: 1, limit, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsuarios(currentPage);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, statusFilter, currentPage]);

  const resumen = useMemo(() => {
    const total = Number(pagination.total || 0);
    const activos = usuarios.filter((u) => u.status === "activo").length;
    const inactivos = usuarios.length - activos;
    return { total, activos, inactivos };
  }, [usuarios, pagination.total]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "activo" ? "inactivo" : "activo";

    try {
      setWorkingUserId(user.id);
      await adminUsuariosService.updateStatus(user.id, nextStatus);
      toast.success(`Usuario ${nextStatus === "activo" ? "activado" : "inactivado"} correctamente.`);
      await loadUsuarios(currentPage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el usuario.");
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Administración de Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona el estado de las cuentas del ecommerce.
          </p>
        </div>
        <button
          onClick={loadUsuarios}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Total filtrado" value={resumen.total} />
        <StatCard icon={Power} label="Activos (página)" value={resumen.activos} tone="emerald" />
        <StatCard icon={Power} label="Inactivos (página)" value={resumen.inactivos} tone="rose" />
      </div>

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className="inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-600">
            <FilterBtn label="Todos" active={statusFilter === "todos"} onClick={() => setStatusFilter("todos")} />
            <FilterBtn label="Activos" active={statusFilter === "activo"} onClick={() => setStatusFilter("activo")} />
            <FilterBtn label="Inactivos" active={statusFilter === "inactivo"} onClick={() => setStatusFilter("inactivo")} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={5}>Cargando usuarios...</td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={5}>No hay usuarios para mostrar.</td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{user.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.status === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={workingUserId === user.id}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {workingUserId === user.id
                          ? "Procesando..."
                          : user.status === "activo"
                          ? "Inactivar"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500 dark:text-gray-400">
            Página {Number(pagination.page || 1)} de {Math.max(1, Number(pagination.pages || 1))} · {Number(pagination.total || 0)} registros
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || Number(pagination.page || 1) <= 1}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(Math.max(1, Number(pagination.pages || 1)), prev + 1))}
              disabled={loading || Number(pagination.page || 1) >= Math.max(1, Number(pagination.pages || 1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"}`}
    >
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, tone = "slate" }) {
  const toneClass = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone] || "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
