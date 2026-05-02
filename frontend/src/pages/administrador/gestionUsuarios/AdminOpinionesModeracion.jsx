import { useEffect, useMemo, useState } from "react";
import { Star, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { adminProductoOpinionesService } from "../../../api/adminProductoOpinionesService";

export default function AdminOpinionesModeracion() {
  const [opiniones, setOpiniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [workingOpinionId, setWorkingOpinionId] = useState(null);

  const loadOpiniones = async (targetPage = currentPage) => {
    setLoading(true);
    try {
      const result = await adminProductoOpinionesService.listPendientes({
        page: targetPage,
        limit,
      });
      setOpiniones(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          total: Array.isArray(result.data) ? result.data.length : 0,
          page: targetPage,
          limit,
          pages: 1,
        }
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudieron cargar las opiniones pendientes.");
      setOpiniones([]);
      setPagination({ total: 0, page: 1, limit, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpiniones(currentPage);
  }, [currentPage]);

  const resumen = useMemo(() => {
    const totalPendientes = Number(pagination.total || 0);
    const promedio = opiniones.length
      ? (opiniones.reduce((acc, item) => acc + Number(item.rating || 0), 0) / opiniones.length).toFixed(1)
      : "0.0";

    return { totalPendientes, promedio };
  }, [opiniones, pagination.total]);

  const handleDecision = async (opinionId, status) => {
    try {
      setWorkingOpinionId(opinionId);
      await adminProductoOpinionesService.updateStatus(opinionId, status);
      toast.success(`Opinión ${status === "Aprobada" ? "aprobada" : "rechazada"} correctamente.`);
      const pages = Math.max(1, Number(pagination.pages || 1));
      const nextPage = Math.min(currentPage, pages);
      await loadOpiniones(nextPage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el estado de la opinión.");
    } finally {
      setWorkingOpinionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Rankings y Opiniones</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Moderación de opiniones pendientes de aprobación.
          </p>
        </div>
        <button
          onClick={loadOpiniones}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Pendientes" value={resumen.totalPendientes} />
        <StatCard label="Promedio (página)" value={resumen.promedio} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ranking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Opinión</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={5}>Cargando opiniones...</td>
                </tr>
              ) : opiniones.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500" colSpan={5}>No hay opiniones pendientes por moderar.</td>
                </tr>
              ) : (
                opiniones.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">{item.producto?.name || "Producto"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      <p>{item.usuario?.nombre || "Usuario"}</p>
                      <p className="text-xs text-gray-500">{item.usuario?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      <div className="inline-flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${item.id}-${index}`}
                            size={14}
                            className={index < Number(item.rating || 0) ? "fill-[#f6b70a] text-[#f6b70a]" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {item.title ? <p className="font-semibold text-gray-800 dark:text-white">{item.title}</p> : null}
                      <p className="mt-1 line-clamp-3 max-w-md">{item.comment || "Sin comentario"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(item.id, "Aprobada")}
                          disabled={workingOpinionId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={14} /> Aprobar
                        </button>
                        <button
                          onClick={() => handleDecision(item.id, "Rechazada")}
                          disabled={workingOpinionId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle size={14} /> Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500 dark:text-gray-400">
            Página {Number(pagination.page || 1)} de {Math.max(1, Number(pagination.pages || 1))} · {Number(pagination.total || 0)} pendientes
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}
