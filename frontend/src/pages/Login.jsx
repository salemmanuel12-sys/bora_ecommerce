import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../api/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const roleValue = user?.rol ?? user?.role ?? user?.rolId ?? user?.ROL_ID;
  const hasAdminSession = Number(roleValue) === 1 || Number(roleValue) === 2;

  if (authLoading) {
    return null;
  }

  if (user) {
    return <Navigate to={hasAdminSession ? "/admin/dashboard" : "/"} replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Completa email y contrasena");
      return;
    }

    try {
      setLoading(true);
      const data = await authService.loginAdmin(form.email, form.password);
      const adminPayload = data.admin || data.user || {};

      login(
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenType: data.tokenType,
          expiresIn: data.expiresIn,
        },
        adminPayload
      );

      toast.success("Sesion iniciada");
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 401) toast.error("Credenciales invalidas");
      else if (status === 403 && message?.toLowerCase().includes("cambio de contrasena")) {
        toast.error("Tu cambio de contraseña está pendiente de aprobación del superadmin");
      }
      else if (status === 403) toast.error("Cuenta pendiente de aprobacion o sin verificar");
      else toast.error(message || "No fue posible iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-sky-700 to-cyan-600 px-6 py-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em]">Ecommerce</p>
          <h1 className="mt-1 text-2xl font-semibold">Panel Administrativo</h1>
          <p className="mt-1 text-sm text-sky-100">Ingresa con tu cuenta autorizada</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-sky-500 transition focus:ring"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@empresa.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contrasena
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-sky-500 transition focus:ring"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="********"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar sesion"}
          </button>

          <div className="text-center text-sm">
            <Link to="/admin/forgot-password" className="text-sky-700 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
