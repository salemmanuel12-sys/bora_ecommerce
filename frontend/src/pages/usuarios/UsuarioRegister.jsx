import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import boraLogo from "../../assets/logoBueno.png";
import { userAuthService } from "../../api/userAuthService";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function UsuarioRegister() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/usuarios/home-sesion" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre || !form.email || !form.password || !form.confirmPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setSubmitting(true);
      await userAuthService.register({
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      toast.success("Registro creado. Te enviamos un código de verificación al correo.");
      navigate("/usuarios/verificar-email", {
        replace: true,
        state: { email: form.email.trim().toLowerCase() },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo registrar la cuenta.");
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
          <label className="block text-sm font-medium text-slate-700">
            Nombre completo
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="Tu nombre"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="********"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirmar contraseña
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="********"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Registrando..." : "Registrarme"}
          </button>

          <div className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta? {" "}
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

export default UsuarioRegister;
