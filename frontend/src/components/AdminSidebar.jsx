import {
    Moon,
    Sun,
    PanelLeftOpen,
    UserCog,
    BookOpen,
    ClipboardList,
    Users,
    Megaphone,
} from "lucide-react";

import logo from "../assets/logoBueno.png";
import { NavLink, useLocation } from "react-router-dom";

const ADMIN_MODULE_PATHS = ["/admin/gestion-administradores"];
const CATALOGO_MODULE_PATHS = ["/admin/catalogos"];
const PEDIDOS_MODULE_PATHS = ["/admin/pedidos"];
const USUARIOS_MODULE_PATHS = ["/admin/gestion-usuarios"];
const ANUNCIOS_MODULE_PATHS = ["/admin/anuncios"];

export default function AdminSidebar({
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode,
}) {
    const location = useLocation();
    const isAdminModuleActive = ADMIN_MODULE_PATHS.some((p) =>
        location.pathname.startsWith(p)
    );
    const isCatalogoModuleActive = CATALOGO_MODULE_PATHS.some((p) =>
        location.pathname.startsWith(p)
    );
    const isPedidosModuleActive = PEDIDOS_MODULE_PATHS.some((p) =>
        location.pathname.startsWith(p)
    );
    const isUsuariosModuleActive = USUARIOS_MODULE_PATHS.some((p) =>
        location.pathname.startsWith(p)
    );
    const isAnunciosModuleActive = ANUNCIOS_MODULE_PATHS.some((p) =>
        location.pathname.startsWith(p)
    );

    return (
        <div
            className={`
        ${sidebarOpen ? "w-64" : "w-20"}
        hidden md:flex flex-col
        bg-white dark:bg-gray-900
        shadow-2xl
        transition-all duration-300
        overflow-hidden
      `}
        >
            {/* 🔥 Brand */}
            <div className="flex flex-col items-center py-6 border-b border-gray-200 dark:border-gray-800">
                <NavLink to="/admin/gestion-administradores" className="flex flex-col items-center group">
                    <div className="relative">
                        <img
                            src={logo}
                            alt="Bora Joyería Admin"
                            className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    </div>

                    {sidebarOpen && (
                        <div className="mt-3 text-center">
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                Admin Panel
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Bora Joyería
                            </p>
                        </div>
                    )}
                </NavLink>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="
                                    mt-4 w-10 h-10 rounded-xl
                                    border border-gray-300 dark:border-gray-700
                                    flex items-center justify-center
                                    text-gray-600 dark:text-gray-300
                                    hover:border-blue-500
                                    hover:text-blue-600 dark:hover:text-blue-400
                                    transition-all duration-200
                                "
                >
                    <PanelLeftOpen
                        size={18}
                        className={`transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"
                            }`}
                    />
                </button>
            </div>

            {/* 🔹 Navegación */}
            <div className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
                {/* Módulo: Gestión de Administradores */}
                <NavItem
                    item={{ label: "Gestión de Administradores", icon: UserCog, path: "/admin/gestion-administradores" }}
                    sidebarOpen={sidebarOpen}
                    forceActive={isAdminModuleActive}
                />

                {/* Módulo: Catálogos */}
                <NavItem
                    item={{ label: "Catálogos", icon: BookOpen, path: "/admin/catalogos" }}
                    sidebarOpen={sidebarOpen}
                    forceActive={isCatalogoModuleActive}
                />

                <NavItem
                    item={{ label: "Gestión de Pedidos", icon: ClipboardList, path: "/admin/pedidos" }}
                    sidebarOpen={sidebarOpen}
                    forceActive={isPedidosModuleActive}
                />

                <NavItem
                    item={{ label: "Gestión de Usuarios", icon: Users, path: "/admin/gestion-usuarios" }}
                    sidebarOpen={sidebarOpen}
                    forceActive={isUsuariosModuleActive}
                />

                <NavItem
                    item={{ label: "Gestión de Anuncios", icon: Megaphone, path: "/admin/anuncios" }}
                    sidebarOpen={sidebarOpen}
                    forceActive={isAnunciosModuleActive}
                />
            </div>

            {/* 🌙 Dark Mode Switch Responsive */}
            <div
                className={`
                    border-t border-gray-200 dark:border-gray-800
                    flex justify-center items-center
                    ${sidebarOpen ? "p-4" : "py-4"}
                `}
            >
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`
                        relative flex items-center
                        ${sidebarOpen ? "w-16 h-8" : "w-12 h-6"}
                        rounded-full
                        transition-all duration-300
                        ${darkMode ? "bg-gray-700" : "bg-yellow-400"}
                    `}
                >
                    {/* Iconos solo si está expandido */}
                    {sidebarOpen && (
                        <>
                            <div className="absolute left-2 text-white">
                                <Sun size={14} />
                            </div>
                            <div className="absolute right-2 text-white">
                                <Moon size={14} />
                            </div>
                        </>
                    )}

                    {/* Bola animada */}
                    <div
                        className={`
                            absolute
                            ${sidebarOpen ? "top-1 w-6 h-6" : "top-0.5 w-5 h-5"}
                            rounded-full bg-white
                            shadow-md
                            transition-all duration-300
                            flex items-center justify-center
                            ${darkMode
                                ? sidebarOpen
                                    ? "translate-x-8"
                                    : "translate-x-6"
                                : sidebarOpen
                                    ? "translate-x-1"
                                    : "translate-x-1"
                            }
                        `}
                    >
                        {darkMode ? (
                            <Moon size={sidebarOpen ? 14 : 12} className="text-gray-700" />
                        ) : (
                            <Sun size={sidebarOpen ? 14 : 12} className="text-yellow-500" />
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}

function NavItem({ item, sidebarOpen, end = false, forceActive = false }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            end={end}
            title={!sidebarOpen ? item.label : undefined}
            className={({ isActive }) =>
                `
                relative group flex items-center ${sidebarOpen ? "gap-3" : "justify-center"} p-3 rounded-xl
                transition-all duration-200

                ${(isActive || forceActive)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-800"
                }
                `
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={20}
                        className={`
                            transition-colors duration-200
                            ${(isActive || forceActive)
                                ? "text-white"
                                : "text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                            }
                        `}
                    />

                    {sidebarOpen && (
                        <span className="font-medium">
                            {item.label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}
