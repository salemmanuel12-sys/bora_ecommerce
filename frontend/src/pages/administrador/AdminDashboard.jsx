import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "../../api/axios";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    pendingInvitations: 0,
  });

  useEffect(() => {
    // Cargar estadísticas del backend
    const loadStats = async () => {
      try {
        // Aquí irían las llamadas a APIs para obtener estadísticas reales
        // Por ahora usamos valores por defecto
        setStats({
          totalAdmins: 5,
          totalUsers: 1250,
          pendingInvitations: 3,
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      }
    };

    loadStats();
  }, []);

  return (
    <>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-blue-900 dark:text-blue-100">
          Bienvenido, <strong>{user?.nombre || user?.email}</strong> 👋
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Administradores" value={stats.totalAdmins} />
        <Card title="Usuarios Totales" value={stats.totalUsers} />
        <Card title="Invitaciones Pendientes" value={stats.pendingInvitations} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Enviar Invitación"
            description="Invitar nuevo administrador"
            color="bg-blue-500"
            onClick={() => navigate("/admin/gestion-administradores/invite")}
          />
          <ActionCard
            title="Gestionar Usuarios"
            description="Aprobar o rechazar administradores"
            color="bg-green-500"
            onClick={() => navigate("/admin/gestion-administradores/manage")}
          />
          <ActionCard
            title="Gestionar Roles"
            description="Crear, editar o eliminar roles"
            color="bg-cyan-600"
            onClick={() => navigate("/admin/gestion-administradores")}
          />
          <ActionCard
            title="Ver Reportes"
            description="Estadísticas del sistema"
            color="bg-purple-500"
            onClick={() => navigate("/admin/gestion-administradores")}
          />
        </div>
      </div>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 transition hover:scale-105">
      <h3 className="text-gray-500 dark:text-gray-300">
        {title}
      </h3>
      <p className="text-2xl font-bold mt-2 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ActionCard({ title, description, color, onClick }) {
  return (
    <div 
      className={`${color} shadow rounded-2xl p-6 transition hover:scale-105 cursor-pointer text-white`}
      onClick={onClick}
    >
      <h3 className="text-lg font-bold">
        {title}
      </h3>
      <p className="text-sm mt-2 opacity-90">
        {description}
      </p>
    </div>
  );
}