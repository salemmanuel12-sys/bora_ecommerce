import {
    LayoutDashboard,
    Database,
    Search,
    Settings,
    RefreshCcw,
    Moon,
    Sun,
    PanelLeftOpen
} from "lucide-react";

import logo from "../assets/Icono.png";
import { NavLink } from "react-router-dom";

const menu = [
    { label: "Operaciones", icon: LayoutDashboard, path: "/dashboard/operaciones" },
    { label: "Catálogos", icon: Database, path: "/dashboard/catalogos" },
    { label: "Consultas", icon: Search, path: "/dashboard/consultas" },
    { label: "Procesos", icon: RefreshCcw, path: "/dashboard/procesos" },
    { label: "Configuración", icon: Settings, path: "/dashboard/configuracion" },
];

export default function Sidebar({
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode,
}) {
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
                <NavLink to="/dashboard" className="flex flex-col items-center group">
                    <div className="relative">
                        <img
                            src={logo}
                            alt="Punto Crece"
                            className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    </div>

                    {sidebarOpen && (
                        <div className="mt-3 text-center">
                            <p className="text-lg font-bold text-gray-800 dark:text-white">
                                Punto Crece
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sistema Administrativo
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
                                    hover:border-red-500 
                                    hover:text-red-600 dark:hover:text-red-400
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

            {/* 🔹 Módulos */}
            <div className="flex-1 p-4 space-y-2">
                {menu.map((item, i) => (
                    <NavItem key={i} item={item} sidebarOpen={sidebarOpen} />
                ))}
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

function NavItem({ item, sidebarOpen }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `
                relative group flex items-center gap-3 p-3 rounded-xl
                transition-all duration-200

                ${isActive
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-gray-800"
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
                            ${isActive
                                ? "text-white"
                                : "text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400"
                            }
                        `}
                    />

                    {sidebarOpen && (
                        <span className="font-medium">
                            {item.label}
                        </span>
                    )}

                    {!sidebarOpen && (
                        <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50">
                            {item.label}
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
}
