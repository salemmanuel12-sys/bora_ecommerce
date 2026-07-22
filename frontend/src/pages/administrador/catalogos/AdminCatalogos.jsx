import { useNavigate } from "react-router-dom";
import { Tag, ShoppingBag } from "lucide-react";

const modules = [
  {
    label: "Categorías",
    description: "Crea y gestiona las categorías principales del catálogo.",
    icon: Tag,
    path: "/admin/catalogos/categorias",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-600/10",
    hoverBg: "group-hover:bg-sky-600",
    glow: "from-sky-500/10 to-cyan-500/10",
  },
  {
    label: "Productos",
    description: "Gestiona el inventario de productos con precios y stock.",
    icon: ShoppingBag,
    path: "/admin/catalogos/productos",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/10",
    hoverBg: "group-hover:bg-emerald-600",
    glow: "from-emerald-500/10 to-teal-500/10",
  },
];

export default function AdminCatalogos() {
  const navigate = useNavigate();

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Catálogos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selecciona un módulo para gestionar el catálogo de productos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
        {modules.map((item, index) => (
          <CatalogoCard key={index} item={item} onClick={() => navigate(item.path)} />
        ))}
      </div>
    </div>
  );
}

function CatalogoCard({ item, onClick }) {
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
