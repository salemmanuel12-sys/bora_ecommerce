import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Clock, UserPlus, Search, X } from "lucide-react";

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    nombre: '',
    email: '',
    rol_id: '',
    status: ''
  });
  const [filterErrors, setFilterErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'approve' or 'reject'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [motivo, setMotivo] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Función de validación de filtros
  const validateFilter = (field, value) => {
    const errors = { ...filterErrors };

    switch (field) {
      case 'nombre':
        if (value.length > 150) {
          errors.nombre = 'El nombre no puede exceder 150 caracteres';
        } else {
          delete errors.nombre;
        }
        break;

      case 'email':
        if (value.length > 150) {
          errors.email = 'El email no puede exceder 150 caracteres';
        } else if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Formato de email inválido';
        } else {
          delete errors.email;
        }
        break;

      case 'rol_id':
        if (value && !['1', '2', '3'].includes(value)) {
          errors.rol_id = 'Rol inválido';
        } else {
          delete errors.rol_id;
        }
        break;

      case 'status':
        if (value && !['pending', 'approved', 'rejected'].includes(value)) {
          errors.status = 'Estado inválido';
        } else {
          delete errors.status;
        }
        break;
    }

    setFilterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if user is superadmin (role 1)
  if (user?.rol !== 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Solo los superadministradores pueden gestionar administradores.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAdmins(currentPage);
  }, [currentPage, filters]);

  const fetchAdmins = async (page = 1) => {
    try {
      // Construir query string con filtros
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // Agregar filtros solo si tienen valor
      if (filters.nombre.trim()) queryParams.append('nombre', filters.nombre.trim());
      if (filters.email.trim()) queryParams.append('email', filters.email.trim());
      if (filters.rol_id) queryParams.append('rol_id', filters.rol_id);
      if (filters.status) queryParams.append('status', filters.status);

      const res = await axios.get(`/admin/auth/list?${queryParams.toString()}`);
      setAdmins(res.data?.data?.admins || []);
      setTotal(res.data?.data?.total || 0);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Error al cargar la lista de administradores");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    // Validar el filtro antes de aplicarlo
    if (!validateFilter(field, value)) {
      return; // No aplicar el filtro si hay error
    }

    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      nombre: '',
      email: '',
      rol_id: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const handleApprove = async (adminId) => {
    const admin = admins.find(a => a.NUM_ADMIN === adminId);
    if (!admin) return;

    if (!canResolveAdmin(admin)) {
      toast.error(`No disponible: ${getActionDisabledReason(admin)}`);
      return;
    }

    setSelectedAdmin(admin);
    setModalAction('approve');
    setMotivo('');
    setShowModal(true);
  };

  const handleReject = async (adminId) => {
    const admin = admins.find(a => a.NUM_ADMIN === adminId);
    if (!admin) return;

    if (!canResolveAdmin(admin)) {
      toast.error(`No disponible: ${getActionDisabledReason(admin)}`);
      return;
    }

    setSelectedAdmin(admin);
    setModalAction('reject');
    setMotivo('');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!motivo.trim()) {
      toast.error('Debe ingresar un motivo');
      return;
    }

    try {
      const endpoint = modalAction === 'approve' ? 'approve' : 'reject';
      await axios.post(`/admin/auth/${endpoint}/${selectedAdmin.NUM_ADMIN}`, { motivo: motivo.trim() });
      
      const actionText = modalAction === 'approve' ? 'aprobado' : 'rechazado';
      toast.success(`Administrador ${actionText} correctamente`);
      
      setShowModal(false);
      setSelectedAdmin(null);
      setModalAction('');
      setMotivo('');
      fetchAdmins(currentPage); // Refresh current page
    } catch (error) {
      const actionText = modalAction === 'approve' ? 'aprobar' : 'rechazar';
      toast.error(`Error al ${actionText} administrador`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-500" size={20} />;
      case "rejected":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Aprobado";
      case "rejected":
        return "Rechazado";
      default:
        return "Pendiente";
    }
  };

  const getRolText = (rolId) => {
    switch (rolId) {
      case 1:
        return "Super Admin";
      case 2:
        return "Administrador";
      case 3:
        return "Moderador";
      default:
        return "Desconocido";
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';

    const raw = String(value).trim();
    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(6, 8)}-${raw.slice(4, 6)}-${raw.slice(0, 4)}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const hasRegisteredPassword = (admin) => {
    // Si el backend aun no envia PASSWORD_REGISTRADO, evitamos bloquear por defecto.
    if (typeof admin?.PASSWORD_REGISTRADO === 'undefined') {
      return true;
    }
    return Boolean(admin?.PASSWORD_REGISTRADO);
  };

  const canResolveAdmin = (admin) => {
    if (!admin?.EMAIL_VERIFICADO) return false;
    if (admin?.STATUS === 'pending') return hasRegisteredPassword(admin);
    return true;
  };

  const getActionDisabledReason = (admin) => {
    if (canResolveAdmin(admin)) return '';
    if (!admin?.EMAIL_VERIFICADO && !hasRegisteredPassword(admin)) {
      return 'Debe verificar correo y registrar contrasena';
    }
    if (!admin?.EMAIL_VERIFICADO) {
      return 'Debe verificar su correo';
    }
    return 'Debe registrar su contrasena';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Gestión de Administradores
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Revisa y administra las solicitudes de nuevos administradores.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/gestion-administradores/invite')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Invitar Admin</span>
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="text-gray-500 dark:text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros de búsqueda</h3>
          {(filters.nombre || filters.email || filters.rol_id || filters.status) && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={filters.nombre}
              onChange={(e) => handleFilterChange('nombre', e.target.value)}
              className={`w-full border p-2 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${filterErrors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
              placeholder="Buscar por nombre..."
              maxLength="150"
            />
            {filterErrors.nombre && (
              <p className="text-red-500 text-xs mt-1">{filterErrors.nombre}</p>
            )}
          </div>

          {/* Filtro por email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              className={`w-full border p-2 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${filterErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
              placeholder="Buscar por email..."
              maxLength="150"
            />
            {filterErrors.email && (
              <p className="text-red-500 text-xs mt-1">{filterErrors.email}</p>
            )}
          </div>

          {/* Filtro por rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rol
            </label>
            <select
              value={filters.rol_id}
              onChange={(e) => handleFilterChange('rol_id', e.target.value)}
              className={`w-full border p-2 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${filterErrors.rol_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            >
              <option value="">Todos los roles</option>
              <option value="1">Super Admin</option>
              <option value="2">Administrador</option>
              <option value="3">Moderador</option>
            </select>
            {filterErrors.rol_id && (
              <p className="text-red-500 text-xs mt-1">{filterErrors.rol_id}</p>
            )}
          </div>

          {/* Filtro por status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`w-full border p-2 rounded-lg
                bg-white dark:bg-gray-700
                text-gray-700 dark:text-gray-200
                focus:outline-none focus:ring-2 transition
                ${filterErrors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
            {filterErrors.status && (
              <p className="text-red-500 text-xs mt-1">{filterErrors.status}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {admins.map((admin) => (
                <tr key={admin.NUM_ADMIN} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {admin.NOMBRE}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {admin.EMAIL}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getRolText(admin.ROL_ID)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(admin.STATUS)}
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {getStatusText(admin.STATUS)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(admin.FEC_ALTA)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(() => {
                      const canResolve = canResolveAdmin(admin);
                      const disabledReason = getActionDisabledReason(admin);

                      return (
                        <>
                    {admin.STATUS === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(admin.NUM_ADMIN)}
                          className={`text-green-600 dark:text-green-400 ${canResolve ? 'hover:text-green-900 dark:hover:text-green-300' : 'opacity-40 cursor-not-allowed'}`}
                          title={canResolve ? 'Aprobar' : `No disponible: ${disabledReason}`}
                          disabled={!canResolve}
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleReject(admin.NUM_ADMIN)}
                          className={`text-red-600 dark:text-red-400 ${canResolve ? 'hover:text-red-900 dark:hover:text-red-300' : 'opacity-40 cursor-not-allowed'}`}
                          title={canResolve ? 'Rechazar' : `No disponible: ${disabledReason}`}
                          disabled={!canResolve}
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                    {admin.STATUS === "approved" && (
                      <button
                        onClick={() => handleReject(admin.NUM_ADMIN)}
                        className={`text-red-600 dark:text-red-400 ${canResolve ? 'hover:text-red-900 dark:hover:text-red-300' : 'opacity-40 cursor-not-allowed'}`}
                        title={canResolve ? 'Rechazar' : `No disponible: ${disabledReason}`}
                        disabled={!canResolve}
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    {admin.STATUS === "rejected" && (
                      <button
                        onClick={() => handleApprove(admin.NUM_ADMIN)}
                        className={`text-green-600 dark:text-green-400 ${canResolve ? 'hover:text-green-900 dark:hover:text-green-300' : 'opacity-40 cursor-not-allowed'}`}
                        title={canResolve ? 'Aprobar' : `No disponible: ${disabledReason}`}
                        disabled={!canResolve}
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                        </>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden">
          {admins.map((admin) => (
            <div key={admin.NUM_ADMIN} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{admin.NOMBRE}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{admin.EMAIL}</p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(admin.STATUS)}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{getStatusText(admin.STATUS)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rol: {getRolText(admin.ROL_ID)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fecha: {formatDate(admin.FEC_ALTA)}</p>
                </div>
                <div className="flex space-x-2">
                  {(() => {
                    const canResolve = canResolveAdmin(admin);
                    const disabledReason = getActionDisabledReason(admin);

                    return (
                      <>
                  {admin.STATUS === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(admin.NUM_ADMIN)}
                        className={`text-green-600 dark:text-green-400 p-2 ${canResolve ? 'hover:text-green-900 dark:hover:text-green-300' : 'opacity-40 cursor-not-allowed'}`}
                        title={canResolve ? 'Aprobar' : `No disponible: ${disabledReason}`}
                        disabled={!canResolve}
                      >
                        <CheckCircle size={24} />
                      </button>
                      <button
                        onClick={() => handleReject(admin.NUM_ADMIN)}
                        className={`text-red-600 dark:text-red-400 p-2 ${canResolve ? 'hover:text-red-900 dark:hover:text-red-300' : 'opacity-40 cursor-not-allowed'}`}
                        title={canResolve ? 'Rechazar' : `No disponible: ${disabledReason}`}
                        disabled={!canResolve}
                      >
                        <XCircle size={24} />
                      </button>
                    </>
                  )}
                  {admin.STATUS === "approved" && (
                    <button
                      onClick={() => handleReject(admin.NUM_ADMIN)}
                      className={`text-red-600 dark:text-red-400 p-2 ${canResolve ? 'hover:text-red-900 dark:hover:text-red-300' : 'opacity-40 cursor-not-allowed'}`}
                      title={canResolve ? 'Rechazar' : `No disponible: ${disabledReason}`}
                      disabled={!canResolve}
                    >
                      <XCircle size={24} />
                    </button>
                  )}
                  {admin.STATUS === "rejected" && (
                    <button
                      onClick={() => handleApprove(admin.NUM_ADMIN)}
                      className={`text-green-600 dark:text-green-400 p-2 ${canResolve ? 'hover:text-green-900 dark:hover:text-green-300' : 'opacity-40 cursor-not-allowed'}`}
                      title={canResolve ? 'Aprobar' : `No disponible: ${disabledReason}`}
                      disabled={!canResolve}
                    >
                      <CheckCircle size={24} />
                    </button>
                  )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay administradores para gestionar.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, total)} de {total} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para motivo */}
      {showModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {modalAction === 'approve' ? 'Aprobar Administrador' : 'Rechazar Administrador'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Administrador: <span className="font-medium">{selectedAdmin.NOMBRE}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email: <span className="font-medium">{selectedAdmin.EMAIL}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.slice(0, 100))}
                className="w-full border p-3 rounded-lg resize-none
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Ingrese el motivo..."
                rows={3}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {motivo.length}/100 caracteres
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalAction === 'approve' ? 'Aprobar' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
