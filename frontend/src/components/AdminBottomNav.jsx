import { LayoutDashboard, UserCog, Shield, KeyRound, ClipboardList } from "lucide-react";
import { BookOpen } from "lucide-react";
import { Users } from "lucide-react";
import { Megaphone } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", end: true },
  { label: "Sesiones", icon: UserCog, path: "/admin/sessions", end: false },
  { label: "Roles", icon: Shield, path: "/admin/roles", end: false },
  { label: "Permisos", icon: KeyRound, path: "/admin/permisos", end: false },
  { label: "Catálogos", icon: BookOpen, path: "/admin/catalogos", end: false },
  { label: "Pedidos", icon: ClipboardList, path: "/admin/pedidos", end: false },
  { label: "Usuarios", icon: Users, path: "/admin/gestion-usuarios", end: false },
  { label: "Anuncios", icon: Megaphone, path: "/admin/anuncios", end: false },
];

const ADMIN_MODULE_PATHS = [
  "/admin/sessions",
  "/admin/roles",
  "/admin/permisos",
  "/admin/pedidos",
  "/admin/gestion-usuarios",
  "/admin/anuncios",
];

export default function AdminBottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-2xl py-2">
        {menu.map((item, i) => (
          <MobileNavItem
            key={i}
            item={item}
            forceActive={
              item.path === "/admin/sessions" &&
              ADMIN_MODULE_PATHS.some((path) => location.pathname.startsWith(path))
            }
          />
        ))}
      </div>
    </div>
  );
}

function MobileNavItem({ item, forceActive = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => {
        const active = isActive || forceActive;
        return `flex flex-col items-center justify-center text-xs transition-all duration-300 ${
          active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
        }`;
      }}
    >
      {({ isActive }) => {
        const active = isActive || forceActive;

        return (
          <>
            <div
              className={`p-2 rounded-xl transition-all duration-300 ${
                active
                  ? "bg-blue-600/10 shadow-[0_0_15px_rgba(37,99,235,0.45)]"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={20} />
            </div>
            <span className="mt-1">{item.label}</span>
          </>
        );
      }}
    </NavLink>
  );
}
