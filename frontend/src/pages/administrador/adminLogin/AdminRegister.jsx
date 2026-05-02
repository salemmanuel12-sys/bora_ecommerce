import { useState } from "react";
import axios from "../../../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminRegister() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    token,
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Función de validación del lado cliente
  const validateForm = () => {
    const newErrors = {};

    // Validar contraseña
    if (!form.password || form.password.length === 0) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (form.password.length > 128) {
      newErrors.password = 'La contraseña no puede exceder 128 caracteres';
    } else {
      // Validar complejidad
      const hasLetter = /[a-zA-Z]/.test(form.password);
      const hasNumber = /\d/.test(form.password);
      if (!hasLetter || !hasNumber) {
        newErrors.password = 'La contraseña debe contener al menos una letra y un número';
      }
    }

    // Validar confirmación de contraseña
    if (!form.confirmPassword || form.confirmPassword.length === 0) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario antes de enviar
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/admin/auth/register", {
        token: form.token,
        password: form.password
      });

      const backendMessage =
        res?.data?.message ||
        "Registro completado. Te enviamos un correo con el codigo de verificacion.";

      toast.success(backendMessage);
      setSuccessMessage(backendMessage);
      setRegistrationComplete(true);

      // Evita que una sesion previa te envie al dashboard por redirect automatico.
      localStorage.removeItem("user");
      localStorage.removeItem("auth");

    } catch (error) {
      if (error.response) {
        const { data } = error.response;
        toast.error(data.message || "Error al registrarse");
      } else {
        toast.error("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gray-100 dark:bg-gray-900 transition">

      {!registrationComplete ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800
            p-8 shadow-xl rounded-2xl w-96
            border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl mb-6 font-bold text-center
            text-gray-800 dark:text-white">
            Completa tu Registro - Administrador
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            Has sido invitado a unirte como administrador. Establece tu contraseña.
          </p>

          <div className="mb-4">
            <input
              type="password"
              value={form.password}
              className={`w-full border p-3 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
              placeholder="Contraseña"
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                // Limpiar error cuando el usuario empiece a escribir
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-6">
            <input
              type="password"
              value={form.confirmPassword}
              className={`w-full border p-3 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
              placeholder="Confirmar Contraseña"
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                // Limpiar error cuando el usuario empiece a escribir
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' });
                }
              }}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white mt-5 w-full py-2 rounded-lg transition"
          >
            {loading ? "Registrando..." : "Completar Registro"}
          </button>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 shadow-xl rounded-2xl w-96 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl mb-4 font-bold text-center text-gray-800 dark:text-white">
            Revisa tu correo
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            {successMessage || "Registro completado correctamente."}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
            Te enviamos un codigo de verificacion por correo. Debes verificarlo y despues esperar la aprobacion del superadmin para poder iniciar sesion.
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin/verify-email")}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Ir a verificar correo
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 rounded-lg mt-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Volver al login
          </button>
        </div>
      )}
    </div>
  );
}
