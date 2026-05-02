import {
  LayoutDashboard,
  Database,
  Search,
  RefreshCcw,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menu = [
  { label: "Operaciones", icon: LayoutDashboard, path: "/dashboard/operaciones" },
  { label: "Catálogos", icon: Database, path: "/dashboard/catalogos" },
  { label: "Consultas", icon: Search, path: "/dashboard/consultas" },
  { label: "Procesos", icon: RefreshCcw, path: "/dashboard/procesos" },
  { label: "Configuración", icon: Settings, path: "/dashboard/configuracion" },
];

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl
        border-t border-gray-200 dark:border-gray-800
        shadow-2xl
        py-2"
      >
        {menu.map((item, i) => (
          <MobileNavItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function MobileNavItem({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center text-xs transition-all duration-300 ${
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-500 dark:text-gray-400"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`
              p-2 rounded-xl transition-all duration-300
              ${
                isActive
                  ? "bg-indigo-600/10 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }
            `}
          >
            <Icon size={20} />
          </div>
          <span className="mt-1">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}