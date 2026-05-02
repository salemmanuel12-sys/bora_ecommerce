export default function AdminReports() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Reportes del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Estadísticas y métricas del sistema Punto Crece.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            Total Usuarios
          </h3>
          <p className="text-3xl font-bold text-blue-600">1,250</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            +12% este mes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            Administradores Activos
          </h3>
          <p className="text-3xl font-bold text-green-600">5</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            3 superadmins, 2 moderadores
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            Invitaciones Pendientes
          </h3>
          <p className="text-3xl font-bold text-yellow-600">3</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Esperando aprobación
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Actividad Reciente
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Nuevo administrador registrado</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Juan Pérez - hace 2 horas</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
              Pendiente
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Invitación enviada</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">María García - hace 5 horas</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Enviada
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Administrador aprobado</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carlos López - hace 1 día</p>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
              Aprobado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}