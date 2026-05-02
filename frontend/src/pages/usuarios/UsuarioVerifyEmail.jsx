import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { userAuthService } from "../../api/userAuthService";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function UsuarioVerifyEmail() {
  const location = useLocation();
  const { user, loading, loginUsuario } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    code: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/usuarios/home-sesion" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.code) {
      toast.error("Ingresa tu correo y el código");
      return;
    }

    try {
      setSubmitting(true);
      const result = await userAuthService.verifyEmail({
        email: form.email.trim().toLowerCase(),
        code: form.code.trim(),
      });

      const migration = await loginUsuario(result.user, {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
      });

      if (migration?.moved > 0) {
        const failedText = migration.failed > 0 ? ` ${migration.failed} producto(s) no se pudieron migrar.` : "";
        toast.success(`Se migraron ${migration.moved} producto(s) a tu carrito.${failedText}`);
      }

      toast.success("Correo verificado correctamente. Sesión iniciada.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo verificar el correo.");
    } finally {
      setSubmitting(false);
    }
  };

  const cartCount = getGuestCartCount();

  return (
    <main className="min-h-screen bg-slate-50">
      <NavbarPublic active="catalogo" cartCount={cartCount} />

      <section className="grid px-4 py-10">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em]">Ecommerce</p>
          <h1 className="mt-1 text-2xl font-semibold">Verificar correo</h1>
          <p className="mt-1 text-sm text-emerald-100">Confirma tu cuenta con el código enviado a tu email.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Código
            <input
              type="text"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="123456"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Verificando..." : "Verificar email"}
          </button>

          <div className="text-center text-sm text-slate-600">
            ¿Ya verificaste tu cuenta? {" "}
            <Link to="/user" className="font-medium text-emerald-700 hover:underline">
              Ingresar
            </Link>
          </div>
        </form>
        </div>
      </section>

      <FooterUsuario catalogPath="/" catalogLabel="Catalogo" />
    </main>
  );
}

export default UsuarioVerifyEmail;
