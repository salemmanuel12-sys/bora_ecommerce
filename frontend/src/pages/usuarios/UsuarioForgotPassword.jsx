import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import boraLogo from "../../assets/logoBueno.png";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function UsuarioForgotPassword() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/usuarios/home-sesion" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      if (step === 1) {
        if (!form.email) {
          toast.error("Ingresa tu correo");
          return;
        }

        toast.success("Te enviamos un código de recuperación.");
        setStep(2);
        return;
      }

      if (step === 2) {
        if (!form.code) {
          toast.error("Ingresa el código de verificación");
          return;
        }

        toast.success("Código validado. Ya puedes definir tu nueva contraseña.");
        setStep(3);
        return;
      }

      if (!form.password || !form.confirmPassword) {
        toast.error("Completa la nueva contraseña");
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      toast.success("Tu contraseña fue actualizada. Ya puedes ingresar.");
      setStep(1);
      setForm({ email: "", code: "", password: "", confirmPassword: "" });
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
          <div className="flex items-center gap-4">
            <img src={boraLogo} alt="Bora Joyería" className="h-14 w-14 rounded-full bg-white object-contain p-1" />
            <h1
              className="text-3xl leading-none"
              style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
            >
              Joyería Artesanal
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {step === 1 && (
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
          )}

          {step === 2 && (
            <label className="block text-sm font-medium text-slate-700">
              Código de verificación
              <input
                type="text"
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
                placeholder="123456"
              />
            </label>
          )}

          {step === 3 && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Nueva contraseña
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
                  placeholder="********"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Confirmar contraseña
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
                  placeholder="********"
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Procesando..." : step === 1 ? "Enviar código" : step === 2 ? "Validar código" : "Actualizar contraseña"}
          </button>

          <div className="text-center text-sm text-slate-600">
            ¿Recordaste tu contraseña? {" "}
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

export default UsuarioForgotPassword;
