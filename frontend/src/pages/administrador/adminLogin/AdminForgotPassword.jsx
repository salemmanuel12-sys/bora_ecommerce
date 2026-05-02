import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../../api/axios";

const initialResetForm = {
  email: "",
  codigo: "",
  nuevaPassword: "",
  confirmarPassword: "",
  resetToken: "",
};

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialResetForm);

  useEffect(() => {
    const emailParam = (searchParams.get("email") || "").trim().toLowerCase();
    const codeParam = (searchParams.get("code") || "").trim();

    if (emailParam && codeParam) {
      setForm((prev) => ({
        ...prev,
        email: emailParam,
        codigo: codeParam,
      }));
      setStep(2);
    }
  }, [searchParams]);

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Debes ingresar un correo");
      return;
    }

    try {
      setLoadingEmail(true);
      const safeEmail = email.trim().toLowerCase();
      const res = await axios.post("/admin/auth/request-reset", { email: safeEmail });
      toast.success(res.data.message || "Si el correo existe, se envió un código");
      setStep(2);
      setForm((prev) => ({
        ...prev,
        email: safeEmail,
        codigo: "",
        nuevaPassword: "",
        confirmarPassword: "",
        resetToken: "",
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo enviar el código");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!form.codigo.trim()) {
      toast.error("Debes ingresar el código");
      return;
    }

    try {
      setLoadingVerify(true);
      const res = await axios.post("/admin/auth/verify-reset-code", {
        email: form.email,
        code: form.codigo.trim(),
      });

      toast.success(res.data.message || "Código verificado correctamente");
      const resetToken = res.data?.data?.resetToken || "";
      if (!resetToken) {
        toast.error("No se recibió resetToken válido");
        return;
      }
      setForm((prev) => ({ ...prev, resetToken }));
      setStep(3);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo verificar el código");
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleRequestChange = async (e) => {
    e.preventDefault();

    if (!form.resetToken.trim()) {
      toast.error("Primero verifica el código");
      return;
    }

    if (form.nuevaPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (form.nuevaPassword !== form.confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoadingReset(true);
      const res = await axios.post("/admin/auth/reset-password", {
        resetToken: form.resetToken,
        newPassword: form.nuevaPassword,
      });

      toast.success(res.data.message || "Solicitud de cambio enviada para aprobación");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo procesar la solicitud");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition">
      <div className="bg-white dark:bg-gray-800 p-8 shadow-xl rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Recuperar contraseña Admin
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          {step === 1 && "Ingresa tu correo para recibir un código de verificación"}
          {step === 2 && "Ingresa el código que recibiste por correo"}
          {step === 3 && "Ahora define tu nueva contraseña"}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo del administrador"
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              disabled={loadingEmail}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
            >
              {loadingEmail ? "Enviando código..." : "Enviar código"}
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/70 text-gray-500 dark:text-gray-300"
            />

            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              placeholder="Código de 6 dígitos"
              maxLength={6}
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              disabled={loadingVerify}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
            >
              {loadingVerify ? "Verificando..." : "Verificar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setForm(initialResetForm);
              }}
              className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cambiar correo
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestChange} className="space-y-4">
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/70 text-gray-500 dark:text-gray-300"
            />

            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              placeholder="Código de 6 dígitos"
              maxLength={6}
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              value={form.nuevaPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, nuevaPassword: e.target.value }))}
              placeholder="Nueva contraseña"
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              value={form.confirmarPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmarPassword: e.target.value }))}
              placeholder="Confirmar contraseña"
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              disabled={loadingReset}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
            >
              {loadingReset ? "Enviando solicitud..." : "Solicitar cambio de contraseña"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(2);
              }}
              className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Volver a verificar código
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-sm">
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Volver al login admin
          </Link>
        </div>
      </div>
    </div>
  );
}
