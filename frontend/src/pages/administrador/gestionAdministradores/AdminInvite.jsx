import { useEffect, useState } from "react";
import axios from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../../assets/logoBueno.png";

export default function AdminInvite() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rolId: ''
  });
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const res = await axios.get("/admin/roles?page=1&limit=50");
        setRoles(res.data?.data || []);
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast.error("No se pudieron cargar los roles");
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Check if user is superadmin (role 1)
  if (user?.rol !== 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Solo los superadministradores pueden enviar invitaciones.
          </p>
        </div>
      </div>
    );
  }

  // Función de validación del lado cliente
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!form.nombre || form.nombre.trim().length === 0) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (form.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (form.nombre.trim().length > 150) {
      newErrors.nombre = 'El nombre no puede exceder 150 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || form.email.trim().length === 0) {
      newErrors.email = 'El email es obligatorio';
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validar rol
    if (!form.rolId) {
      newErrors.rolId = 'Debe seleccionar un rol';
    } else {
      const rolIdNum = parseInt(form.rolId);
      const rolExiste = roles.some((rol) => rol.ID_ROL === rolIdNum);
      if (!rolExiste) {
        newErrors.rolId = 'Rol inválido';
      }
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

      const res = await axios.post("/admin/auth/invitation/send", {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        rolId: parseInt(form.rolId)
      });

      toast.success(res.data.message);
      setForm({ nombre: '', email: '', rolId: '' }); // Limpiar formulario
      setErrors({}); // Limpiar errores
      
      // Redirigir a AdminManagement después de 1.5 segundos
      setTimeout(() => {
        navigate("/admin/gestion-administradores/manage");
      }, 1500);

    } catch (error) {
      setLoading(false);
      if (error.response) {
        const { data } = error.response;
        toast.error(data.message || "Error al enviar invitación");
      } else {
        toast.error("No se pudo conectar con el servidor");
      }
    }
  };

  return (
    <>
      {/* Loading Splash Screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <img
              src={logo}
              alt="Punto Crece"
              className="w-24 h-24 animate-bounce"
            />
            <p className="text-white text-lg font-semibold">Enviando invitación...</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Enviar Invitación
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Invita a un nuevo administrador al sistema. Recibirán un email con instrucciones para registrarse.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={form.nombre}
                className={`w-full border p-3 rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-700 dark:text-gray-200
                  focus:outline-none focus:ring-2 transition
                  ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                placeholder="Ingresa el nombre completo"
                onChange={(e) => {
                  setForm({ ...form, nombre: e.target.value });
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errors.nombre) {
                    setErrors({ ...errors, nombre: '' });
                  }
                }}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.email}
                className={`w-full border p-3 rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-700 dark:text-gray-200
                  focus:outline-none focus:ring-2 transition
                  ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                placeholder="correo@ejemplo.com"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol
              </label>
              <select
                value={form.rolId}
                className={`w-full border p-3 rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-700 dark:text-gray-200
                  focus:outline-none focus:ring-2 transition
                  ${errors.rolId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                onChange={(e) => {
                  setForm({ ...form, rolId: e.target.value });
                  // Limpiar error cuando el usuario seleccione un rol
                  if (errors.rolId) {
                    setErrors({ ...errors, rolId: '' });
                  }
                }}
              >
                <option value="">Selecciona un rol</option>
                {rolesLoading ? (
                  <option value="" disabled>Cargando roles...</option>
                ) : (
                  roles.map((rol) => (
                    <option key={rol.ID_ROL} value={rol.ID_ROL}>
                      {rol.NOMBRE}
                    </option>
                  ))
                )}
              </select>
              {errors.rolId && (
                <p className="text-red-500 text-sm mt-1">{errors.rolId}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/admin/gestion-administradores")}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition"
            >
              {loading ? "Enviando..." : "Enviar Invitación"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
