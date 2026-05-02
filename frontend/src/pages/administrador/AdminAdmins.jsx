import { useNavigate } from "react-router-dom";
import { Users, ShieldCheck, Home, Shield, KeyRound } from "lucide-react";

const modules = [
  {
    label: "AdminAdmins",
    description: "Vista principal de Gestión de Administradores.",
    icon: Home,
    path: "/admin/gestion-administradores",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-600/10",
    hoverBg: "group-hover:bg-sky-600",
    glow: "from-sky-500/10 to-cyan-500/10",
  },
  {
    label: "Gestionar Admins",
    description: "Administra los usuarios con acceso al panel de control.",
    icon: Users,
    path: "/admin/gestion-administradores/manage",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-600/10",
    hoverBg: "group-hover:bg-blue-600",
    glow: "from-blue-500/10 to-indigo-500/10",
  },
  {
    label: "Gestionar Roles",
    description: "Define y administra los roles del sistema.",
    icon: Shield,
    path: "/admin/roles",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600/10",
    hoverBg: "group-hover:bg-indigo-600",
    glow: "from-indigo-500/10 to-purple-500/10",
  },
  {
    label: "Gestionar Permisos",
    description: "Configura permisos y su asignación por rol.",
    icon: KeyRound,
    path: "/admin/permisos",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-600/10",
    hoverBg: "group-hover:bg-violet-600",
    glow: "from-violet-500/10 to-purple-500/10",
  },
  {
    label: "Cambios de Contraseña",
    description: "Aprueba o rechaza solicitudes de cambio de contraseña.",
    icon: ShieldCheck,
    path: "/admin/gestion-administradores/password-changes",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/10",
    hoverBg: "group-hover:bg-emerald-600",
    glow: "from-emerald-500/10 to-teal-500/10",
  },
];

export default function AdminAdmins() {
  const navigate = useNavigate();

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Administrador de Admins
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selecciona un módulo para gestionar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
        {modules.map((item, index) => (
          <AdminCard key={index} item={item} onClick={() => navigate(item.path)} />
        ))}
      </div>
    </div>
  );
}

function AdminCard({ item, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center h-52 rounded-3xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 relative overflow-hidden hover:-translate-y-1 active:scale-[0.98]"
    >
      {/* Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-br ${item.glow} transition duration-300`} />

      {/* Icono */}
      <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${item.bg} ${item.color} ${item.hoverBg} group-hover:text-white transition-all duration-300 shadow-md`}>
        <Icon size={30} />
      </div>

      {/* Texto */}
      <span className="mt-4 text-base font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition text-center px-4">
        {item.label}
      </span>
      <span className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-center px-6 leading-relaxed">
        {item.description}
      </span>
    </button>
  );
}
