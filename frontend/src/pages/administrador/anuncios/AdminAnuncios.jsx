import { useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

const modules = [
  {
    label: "Administrar Banners",
    description: "Crea, edita y elimina banners de ofertas y anuncios.",
    icon: Megaphone,
    path: "/admin/anuncios/banners",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-600/10",
    hoverBg: "group-hover:bg-fuchsia-600",
    glow: "from-fuchsia-500/10 to-pink-500/10",
  },
];

export default function AdminAnuncios() {
  const navigate = useNavigate();

  return (
    <div className="w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Anuncios</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecciona un submódulo para gestionar banners promocionales.
        </p>
      </div>

      <div className="grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className="group relative flex h-52 flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800"
          >
            <div className={`absolute inset-0 bg-linear-to-br ${item.glow} opacity-0 transition duration-300 group-hover:opacity-100`} />

            <div className={`h-16 w-16 rounded-2xl ${item.bg} ${item.color} ${item.hoverBg} flex items-center justify-center shadow-md transition-all duration-300 group-hover:text-white`}>
              <item.icon size={30} />
            </div>

            <span className="mt-4 px-4 text-center text-base font-semibold text-gray-700 transition group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
              {item.label}
            </span>
            <span className="mt-1 px-6 text-center text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
