import { useLocation, Link } from "react-router-dom";

const routeNames = {
  dashboard: "Dashboard",
  catalogos: "Catálogos",
  categoria: "Categoría",
  subcategoria: "Subcategoría",
  producto: "Producto",
  combo: "Combo",
  cliente: "Cliente",
  proveedor: "Proveedor",
  cajas: "Cajas",
};

export default function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname
    .split("/")
    .filter((x) => x);

  return (
    <div className="text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400">

      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/");
        const isLast = index === pathnames.length - 1;

        const label = routeNames[value] || value;

        return (
          <span key={to} className="flex items-center gap-2">
            {index !== 0 && <span>/</span>}

            {isLast ? (
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-red-600 transition"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}