import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // 🔥 Espera a que termine de restaurar sesión
  if (loading) return null;

  if (!user) {
    return <Navigate to="/user" replace />;
  }

  return children;
}