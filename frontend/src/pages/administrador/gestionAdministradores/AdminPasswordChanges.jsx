import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

import axios from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

export default function AdminPasswordChanges() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [motivo, setMotivo] = useState("");

  const hasPending = useMemo(() => rows.length > 0, [rows]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/auth/password-change-requests");
      setRows(res.data?.solicitudes || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudieron cargar las solicitudes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type, admin) => {
    setActionType(type);
    setSelectedAdmin(admin);
    setMotivo("");
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    if (actionLoading) return;
    setShowActionModal(false);
    setActionType(null);
    setSelectedAdmin(null);
    setMotivo("");
  };

  const handleConfirmAction = async () => {
    if (!selectedAdmin?.NUM_ADMIN) {
      toast.error("Administrador inválido");
      return;
    }

    if (actionType === "reject" && motivo.trim().length > 150) {
      toast.error("El motivo no puede exceder 150 caracteres");
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await axios.put(`/admin/auth/password-change-requests/${selectedAdmin.NUM_ADMIN}/approve`);
        toast.success("Cambio de contraseña aprobado");
      } else {
        await axios.put(`/admin/auth/password-change-requests/${selectedAdmin.NUM_ADMIN}/reject`, {
          motivo: motivo.trim(),
        });
        toast.success("Solicitud rechazada correctamente");
      }

      closeActionModal();
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo completar la acción");
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.rol !== 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Acceso Denegado</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Solo el superadmin puede revisar cambios de contraseña.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Solicitudes de Cambio de Contraseña</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Revisa y valida las solicitudes pendientes de administradores.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={30} />
          </div>
        ) : !hasPending ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={28} />
            </div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">No hay solicitudes pendientes</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cuando un administrador cambie su contraseña, aparecerá aquí para aprobación.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Administrador</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Correo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Fecha solicitud</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Estado</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((row) => (
                    <tr key={row.NUM_ADMIN} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-white">{row.NOMBRE}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{row.EMAIL}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{row.PASSWORD_CAMBIO_FEC_SOLICITUD} {row.PASSWORD_CAMBIO_HORA_SOLICITUD}</td>
                      <td className="px-5 py-4 text-sm text-amber-600 dark:text-amber-400 font-semibold">Pendiente</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openActionModal("approve", row)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Aprobar cambio"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                          <button
                            onClick={() => openActionModal("reject", row)}
                            className="text-red-600 hover:text-red-700"
                            title="Rechazar cambio"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((row) => (
                <div key={row.NUM_ADMIN} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{row.NOMBRE}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{row.EMAIL}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Solicitud: {row.PASSWORD_CAMBIO_FEC_SOLICITUD} {row.PASSWORD_CAMBIO_HORA_SOLICITUD}
                      </p>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">Pendiente</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openActionModal("approve", row)}
                        className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/25 text-emerald-600"
                        title="Aprobar cambio"
                      >
                        <CheckCircle2 size={17} />
                      </button>
                      <button
                        onClick={() => openActionModal("reject", row)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/25 text-red-600"
                        title="Rechazar cambio"
                      >
                        <XCircle size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showActionModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {actionType === "approve" ? "Aprobar cambio de contraseña" : "Rechazar cambio de contraseña"}
              </h2>
            </div>

            <div className="p-5">
              <div className={`rounded-xl p-4 border mb-4 ${
                actionType === "approve"
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {actionType === "approve"
                    ? "Se aplicará la nueva contraseña y el administrador podrá iniciar sesión."
                    : "La solicitud será rechazada y el administrador deberá solicitar un nuevo cambio."}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedAdmin.NOMBRE}
                </p>
              </div>

              {actionType === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo (opcional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={150}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Validación de identidad pendiente"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
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
                    actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading && <Loader2 className="animate-spin" size={16} />}
                  {actionType === "approve" ? "Aprobar" : "Rechazar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
