import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminPrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Esperar a que termine de restaurar sesión
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p>Cargando...</p>
    </div>;
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/administradores_bora" replace />;
  }

  // Verificar si es administrador
  // rol 1 = superadmin, rol 2 = admin
  const roleValue = user?.rol ?? user?.role ?? user?.rolId ?? user?.ROL_ID;
  const isAdmin = Number(roleValue) === 1 || Number(roleValue) === 2;
  
  if (!isAdmin) {
    return <Navigate to="/administradores_bora" replace />;
  }

  return children;
}