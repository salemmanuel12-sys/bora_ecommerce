import { useNavigate } from "react-router-dom";
import { Users, Star } from "lucide-react";

const modules = [
  {
    label: "Administración de Usuarios",
    description: "Visualiza usuarios del ecommerce y administra su estado.",
    icon: Users,
    path: "/admin/gestion-usuarios/usuarios",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-600/10",
    hoverBg: "group-hover:bg-sky-600",
    glow: "from-sky-500/10 to-cyan-500/10",
  },
  {
    label: "Rankings y Opiniones",
    description: "Revisa y modera calificaciones y opiniones pendientes.",
    icon: Star,
    path: "/admin/gestion-usuarios/opiniones",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-600/10",
    hoverBg: "group-hover:bg-amber-600",
    glow: "from-amber-500/10 to-orange-500/10",
  },
];

export default function AdminGestionUsuarios() {
  const navigate = useNavigate();

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecciona un submódulo para administrar usuarios y moderar contenido.
        </p>
      </div>

      <div className="grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {modules.map((item, index) => (
          <ModuloCard key={index} item={item} onClick={() => navigate(item.path)} />
        ))}
      </div>
    </div>
  );
}

function ModuloCard({ item, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className="group relative flex h-52 flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800"
    >
      <div className={`absolute inset-0 bg-linear-to-br ${item.glow} opacity-0 transition duration-300 group-hover:opacity-100`} />

      <div className={`h-16 w-16 rounded-2xl ${item.bg} ${item.color} ${item.hoverBg} flex items-center justify-center shadow-md transition-all duration-300 group-hover:text-white`}>
        <Icon size={30} />
      </div>

      <span className="mt-4 px-4 text-center text-base font-semibold text-gray-700 transition group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
        {item.label}
      </span>
      <span className="mt-1 px-6 text-center text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        {item.description}
      </span>
    </button>
  );
}
