import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";
import { loginWithFacebook, loginWithGoogle } from "../../lib/firebaseAuth";
import { userAuthService } from "../../api/userAuthService";
import boraLogo from "../../assets/logoBora1.png";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function UsuarioLogin() {
  const { user, loading, loginUsuario } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }

  if (user) {
    const roleValue = user?.rol ?? user?.role ?? user?.rolId ?? user?.ROL_ID;
    const isAdmin = Number(roleValue) === 1 || Number(roleValue) === 2;

    return <Navigate to={isAdmin ? "/admin/dashboard" : "/usuarios/home-sesion"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Completa email y contraseña");
      return;
    }

    try {
      setSubmitting(true);
      const result = await userAuthService.login(
        form.email.trim().toLowerCase(),
        form.password
      );
      const migration = await loginUsuario(result.user, {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
      });

      if (migration?.moved > 0) {
        const failedText = migration.failed > 0 ? ` ${migration.failed} producto(s) no se pudieron migrar.` : "";
        toast.success(`Se migraron ${migration.moved} producto(s) a tu carrito.${failedText}`);
      }

      toast.success("Bienvenida de nuevo.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No fue posible iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setSubmitting(true);
      const firebaseUser = await loginWithGoogle();
      const result = await userAuthService.socialLogin({
        email: firebaseUser.email,
        nombre: firebaseUser.displayName,
        provider: "google",
        providerUid: firebaseUser.uid,
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

      toast.success(`Bienvenida, ${firebaseUser.displayName || "usuaria"}.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No fue posible iniciar sesión con Google.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setSubmitting(true);
      const firebaseUser = await loginWithFacebook();
      const result = await userAuthService.socialLogin({
        email: firebaseUser.email,
        nombre: firebaseUser.displayName,
        provider: "facebook",
        providerUid: firebaseUser.uid,
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

      toast.success(`Bienvenida, ${firebaseUser.displayName || "usuaria"}.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No fue posible iniciar sesión con Facebook.");
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
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-500 transition focus:ring"
              placeholder="********"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="relative py-1 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="bg-white px-2">o continúa con</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaGoogle className="text-[#DB4437]" />
              Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaFacebookF className="text-[#1877F2]" />
              Facebook
            </button>
          </div>

          <p className="text-center text-xs text-slate-500">
            Para login social, configura Firebase en variables `VITE_FIREBASE_*`.
          </p>

          <div className="text-center text-sm">
            <Link to="/usuarios/forgot-password" className="text-emerald-700 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="text-center text-sm text-slate-600">
            ¿No tienes cuenta? {" "}
            <Link to="/usuarios/registro" className="font-medium text-emerald-700 hover:underline">
              Registrarme
            </Link>
          </div>
        </form>
        </div>
      </section>

      <FooterUsuario catalogPath="/" catalogLabel="Catalogo" />
    </main>
  );
}

export default UsuarioLogin;
