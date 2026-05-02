import { useState, useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { Bell, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminNotificacionesService } from "../api/adminNotificacionesService";

import AdminSidebar from "../components/AdminSidebar";
import AdminBreadcrumb from "../components/AdminBreadcrumb";
import AdminBottomNav from "../components/AdminBottomNav";

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();

  // 🎨 Generar iniciales
  const getInitials = (name) => {
    if (!name) return "A";
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
      const name = user?.nombre || user?.email || "A";
      const charCodeSum = name
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

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const result = await adminNotificacionesService.list({ page: 1, limit: 8 });
        setNotifications(result.data || []);
        setUnreadCount(Number(result.unreadCount || 0));
      } catch (_error) {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, []);

  const handleReadAllNotifications = async () => {
    try {
      await adminNotificacionesService.readAll();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (_error) {
      // no-op in layout
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex-1 flex flex-col">

        {/* NAVBAR */}
        <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">

          <AdminBreadcrumb />

          <div className="flex items-center gap-6">

            {/* Mensajes */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <MessageCircle size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </button>

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-30 mt-3 w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">Notificaciones</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Modelo Notification</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReadAllNotifications}
                      className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                    >
                      Marcar todas
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                        No hay notificaciones recientes.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-700 ${item.read ? "bg-transparent" : "bg-blue-50/60 dark:bg-blue-950/20"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">{item.type}</p>
                              <p className="mt-1 text-sm whitespace-pre-line text-gray-600 dark:text-gray-300">{item.message}</p>
                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {item.usuario?.nombre || item.usuario?.email || "Usuario"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-white font-semibold ${avatarColor}`}
                    >
                      {getInitials(user.nombre || user.email)}
                    </div>
                  )}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {user.nombre || user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Number(user.rol ?? user.role ?? user.rolId ?? user.ROL_ID) === 1 ? "Super Admin" : "Admin"}
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

      <AdminBottomNav />

    </div>
  );
}