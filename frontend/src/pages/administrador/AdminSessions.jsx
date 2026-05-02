import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/auth/sessions");
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Error al cargar sesiones:", error);
      toast.error("No se pudieron cargar las sesiones");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      setRevoking(sessionId);
      await axios.delete(`/admin/auth/sessions/${sessionId}`);
      toast.success("Sesión cerrada correctamente");
      loadSessions();
    } catch (error) {
      console.error("Error al revocar sesión:", error);
      toast.error("Error al cerrar la sesión");
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    if (!window.confirm("¿Estás seguro? Cerrarás todas tus sesiones.")) {
      return;
    }

    try {
      setLoading(true);
      await axios.post("/admin/auth/logout-all", {});
      toast.success("Todas las sesiones han sido cerradas");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error("Error al cerrar todas las sesiones:", error);
      toast.error("Error al cerrar las sesiones");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES");
  };

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return "Desconocido";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Otro";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Mis Sesiones Activas
        </h1>
        <button
          onClick={revokeAllSessions}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
        >
          Cerrar Todas las Sesiones
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">Cargando sesiones...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300">
            No tienes sesiones activas
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      {getBrowserInfo(session.userAgent)}
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Activa
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    📍 IP: {session.ipAddress || "No disponible"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    🕐 Creada: {formatDate(session.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ⏰ Expira: {formatDate(session.expiresAt)}
                  </p>
                </div>
                <button
                  onClick={() => revokeSession(session.id)}
                  disabled={revoking === session.id}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition"
                >
                  {revoking === session.id ? "Cerrando..." : "Cerrar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
