import { useState } from "react";
import axios from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Función de validación del lado cliente
  const validateForm = () => {
    const newErrors = {};

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || form.email.trim().length === 0) {
      newErrors.email = 'El email es obligatorio';
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validar contraseña
    if (!form.password || form.password.length === 0) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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

      const res = await axios.post("/admin/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      login(
        {
          accessToken: res.data.accessToken || res.data.token,
          refreshToken: res.data.refreshToken || "",
          tokenType: res.data.tokenType || "Bearer",
          expiresIn: res.data.expiresIn || "8h",
        },
        res.data.admin
      );

      toast.success("Bienvenido Administrador 👋");

    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 400 && data.message === "Administrador no encontrado") {
          toast.error("El correo no está registrado");
        } else if (status === 400 && data.message === "Contraseña incorrecta") {
          toast.error("La contraseña es incorrecta");
        } else if (status === 403 && data.message === "Cuenta no autorizada") {
          toast.error("Tu cuenta no ha sido autorizada aún");
        } else if (status === 403 && data.message === "Tu cambio de contraseña está pendiente de aprobación del superadmin") {
          toast.error("Tu cambio de contraseña está pendiente de aprobación del superadmin");
        } else if (status === 403 && data.message === "Debes verificar tu correo") {
          toast.error("Debes verificar tu correo antes de ingresar");
        } else if (status === 500) {
          toast.error("Error interno del servidor");
        } else {
          toast.error(data.message || "Error al iniciar sesión");
        }
      } else {
        toast.error("Error inesperado en el inicio de sesion");
        console.error("Error de login admin:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gray-100 dark:bg-gray-900 transition">

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800
          p-8 shadow-xl rounded-2xl w-96
          border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl mb-6 font-bold text-center
          text-gray-800 dark:text-white">
          Iniciar Sesión - Administrador
        </h2>

        <div className="mb-4">
          <input
            type="email"
            value={form.email}
            className={`w-full border p-3 rounded-lg
              bg-white dark:bg-gray-700
              text-gray-700 dark:text-gray-200
              focus:outline-none focus:ring-2 transition
              ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            placeholder="Email"
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              // Limpiar error cuando el usuario empiece a escribir
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-6">
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

        <button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white mt-5 w-full py-2 rounded-lg transition"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="mt-3 text-sm text-center">
          <Link
            to="/admin/forgot-password"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="mt-4 text-sm text-center">
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ¿Eres usuario regular? Inicia sesión aquí
          </Link>
        </div>
      </form>
    </div>
  );
}
