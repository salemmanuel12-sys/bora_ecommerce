import { useState } from "react";
import axios from "../../../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function AdminVerifyEmail() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: (searchParams.get("email") || "").trim(),
    codigo: (searchParams.get("code") || "").trim(),
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post("/admin/auth/verify-email", {
        email: form.email,
        codigo: form.codigo,
      });

      toast.success(res.data.message);

      // Redirigir al login de admin
      navigate("/login");

    } catch (error) {
      if (error.response) {
        const { data } = error.response;
        toast.error(data.message || "Error al verificar");
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

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800
          p-8 shadow-xl rounded-2xl w-96
          border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl mb-6 font-bold text-center
          text-gray-800 dark:text-white">
          Verificar Correo - Administrador
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          Ingresa el código que recibiste por correo.
        </p>

        <input
          className="w-full border p-2 rounded-lg
            bg-white dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Email"
          required
          value={form.email || ""}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded-lg mt-3
            bg-white dark:bg-gray-700
            border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-200
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Código de verificación"
          required
          value={form.codigo || ""}
          onChange={(e) =>
            setForm({ ...form, codigo: e.target.value })
          }
        />

        <button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white mt-5 w-full py-2 rounded-lg transition"
        >
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </form>
    </div>
  );
}
