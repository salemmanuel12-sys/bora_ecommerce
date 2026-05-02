import { Link, useLocation } from "react-router-dom";

const ADMIN_ROUTES = {
  "/admin/dashboard": [{ label: "Dashboard" }],
  "/admin/sessions": [{ label: "Sesiones" }],
  "/admin/roles": [{ label: "Roles" }],
  "/admin/permisos": [{ label: "Permisos" }],
  "/admin/gestion-administradores": [{ label: "Gestión de Administradores" }],
  "/admin/gestion-administradores/manage": [
    { label: "Gestión de Administradores", to: "/admin/gestion-administradores" },
    { label: "Gestionar Admins" },
  ],
  "/admin/gestion-administradores/invite": [
    { label: "Gestión de Administradores", to: "/admin/gestion-administradores" },
    { label: "Enviar Invitación" },
  ],
  "/admin/gestion-administradores/password-changes": [
    { label: "Gestión de Administradores", to: "/admin/gestion-administradores" },
    { label: "Cambios de Contraseña" },
  ],
  "/admin/catalogos": [{ label: "Catálogos" }],
  "/admin/catalogos/categorias": [
    { label: "Catálogos", to: "/admin/catalogos" },
    { label: "Categorías" },
  ],
  "/admin/catalogos/subcategorias": [
    { label: "Catálogos", to: "/admin/catalogos" },
    { label: "Subcategorías" },
  ],
  "/admin/catalogos/productos": [
    { label: "Catálogos", to: "/admin/catalogos" },
    { label: "Productos" },
  ],
  "/admin/pedidos": [{ label: "Gestión de Pedidos" }],
  "/admin/pedidos/listado": [
    { label: "Gestión de Pedidos", to: "/admin/pedidos" },
    { label: "Listado" },
  ],
  "/admin/gestion-usuarios": [{ label: "Gestión de Usuarios" }],
  "/admin/gestion-usuarios/usuarios": [
    { label: "Gestión de Usuarios", to: "/admin/gestion-usuarios" },
    { label: "Administración de Usuarios" },
  ],
  "/admin/gestion-usuarios/opiniones": [
    { label: "Gestión de Usuarios", to: "/admin/gestion-usuarios" },
    { label: "Rankings y Opiniones" },
  ],
  "/admin/anuncios": [{ label: "Gestión de Anuncios" }],
  "/admin/anuncios/banners": [
    { label: "Gestión de Anuncios", to: "/admin/anuncios" },
    { label: "Administrar Banners" },
  ],
};

export default function AdminBreadcrumb() {
  const location = useLocation();
  const crumbs = ADMIN_ROUTES[location.pathname] ?? [];

  return (
    <div className="text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={index} className="flex items-center gap-2">
            {index !== 0 && <span>/</span>}

            {isLast || !crumb.to ? (
              <span
                className={
                  isLast
                    ? "text-gray-700 dark:text-gray-200 font-medium"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
