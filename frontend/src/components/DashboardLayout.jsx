import { useState, useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { Bell, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Breadcrumb from "./Breadcrumb";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  // 🎨 Generar iniciales
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (
      names[0][0].toUpperCase() +
      names[names.length - 1][0].toUpperCase()
    );
  };

  // 🎨 Colores posibles
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-teal-500",
  ];

  // 🎨 Color consistente basado en el nombre
  const avatarColor = useMemo(() => {
    if (!user?.name) return "bg-gray-500";
    const charCodeSum = user.name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  }, [user]);

  // 🌙 Inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex-1 flex flex-col">

        {/* NAVBAR */}
        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">

          <Breadcrumb />

          <div className="flex items-center gap-6">

            {/* Mensajes */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <MessageCircle size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </button>

            {/* Notificaciones */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                5
              </span>
            </button>

            {/* Usuario */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-xl transition"
                >
                  {/* Avatar dinámico */}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-white font-semibold ${avatarColor}`}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role}
                    </p>
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200"
                    >
                      <LogOut size={18} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto pb-20 md:pb-6">
          <Outlet />
        </div>

      </div>

      <BottomNav />

    </div>
  );
}