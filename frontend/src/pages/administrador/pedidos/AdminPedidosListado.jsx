import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CreditCard, Truck, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { adminPedidosService } from "../../../api/adminPedidosService";
import { adminNotificacionesService } from "../../../api/adminNotificacionesService";
import { pagoService } from "../../../api/pagoService";
import { envioService } from "../../../api/envioService";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPedidosListado() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ carrier: "", trackingNumber: "", status: "pending" });
  const [workingAction, setWorkingAction] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await adminPedidosService.list({ page: 1, limit: 100, status: statusFilter, search });
      setOrders(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return orders;
    }

    return orders.filter((order) => {
      const userName = String(order.usuario?.nombre || "").toLowerCase();
      const userEmail = String(order.usuario?.email || "").toLowerCase();
      const id = String(order.id || "");
      return userName.includes(normalized) || userEmail.includes(normalized) || id.includes(normalized);
    });
  }, [orders, search]);

  const openDetail = async (orderId) => {
    try {
      setWorkingAction(`detail-${orderId}`);
      const order = await adminPedidosService.getById(orderId);
      setSelectedOrder(order);
      setSelectedShipment(order.shipment || null);
      setTrackingForm({
        carrier: order.shipment?.carrier || "",
        trackingNumber: order.shipment?.trackingNumber || "",
        status: order.shipment?.status || (order.status === "shipped" ? "shipped" : "pending"),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo cargar el detalle del pedido.");
    } finally {
      setWorkingAction("");
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      setWorkingAction(`pay-${orderId}`);
      await pagoService.updateStatus(orderId, {
        status: "approved",
        transactionId: `ADMIN-${Date.now()}`,
      });
      toast.success(`Pago del pedido #${orderId} actualizado.`);
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        await openDetail(orderId);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el pago.");
    } finally {
      setWorkingAction("");
    }
  };

  const saveShipment = async () => {
    if (!selectedOrder?.id) return;

    try {
      setWorkingAction(`ship-${selectedOrder.id}`);
      const shipment = await envioService.upsert(selectedOrder.id, trackingForm);
      setSelectedShipment(shipment);

      if (["shipped", "delivered"].includes(String(trackingForm.status || ""))) {
        await adminNotificacionesService.attendOrder(selectedOrder.id);
      }

      toast.success("Seguimiento de envio actualizado.");
      await fetchOrders();
      await openDetail(selectedOrder.id);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el envio.");
    } finally {
      setWorkingAction("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Listado de Pedidos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Supervisa compras, valida pagos y registra envios de los usuarios.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="mb-6 grid gap-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:grid-cols-[1.4fr_0.7fr]">
        <label className="relative block">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por pedido, cliente o correo"
            className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Cargando pedidos...</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No hay pedidos para mostrar.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-900/40">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white">#{order.id}<div className="mt-1 text-xs font-normal text-gray-400">{formatDate(order.createdAt)}</div></td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200"><div>{order.usuario?.nombre || "Cliente"}</div><div className="text-xs text-gray-400">{order.usuario?.email || "Sin correo"}</div></td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">{order.paymentStatus}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">{order.status}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(order.id)}
                            disabled={workingAction === `detail-${order.id}`}
                            className="rounded-lg border border-gray-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-700"
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmPayment(order.id)}
                            disabled={workingAction === `pay-${order.id}` || order.paymentStatus === 'paid'}
                            className="rounded-lg border border-gray-200 p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-700"
                            title="Confirmar pago"
                          >
                            <CreditCard size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
            <Truck size={18} />
            <h2 className="text-lg font-semibold">Detalle y seguimiento</h2>
          </div>

          {!selectedOrder ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un pedido para ver detalle, direccion, pago y envio.</p>
          ) : (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/50">
                <p className="font-semibold text-gray-800 dark:text-white">Pedido #{selectedOrder.id}</p>
                <p className="mt-1">Cliente: {selectedOrder.usuario?.nombre || 'Cliente'} </p>
                <p>Correo: {selectedOrder.usuario?.email || 'Sin correo'}</p>
                <p>Total: {formatCurrency(selectedOrder.total)}</p>
                <p>Estado: {selectedOrder.status}</p>
                <p>Pago: {selectedOrder.paymentStatus}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Direccion de envio</p>
                {selectedOrder.shippingAddress ? (
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                    <p className="font-medium text-gray-800 dark:text-white">{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin direccion registrada.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Items</p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700">
                      <span>{item.producto?.name || `Producto #${item.productId}`}</span>
                      <span>{item.quantity} x {formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Actualizar envio</p>
                <div className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                  <input
                    type="text"
                    value={trackingForm.carrier}
                    onChange={(event) => setTrackingForm((prev) => ({ ...prev, carrier: event.target.value }))}
                    placeholder="Paqueteria"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <input
                    type="text"
                    value={trackingForm.trackingNumber}
                    onChange={(event) => setTrackingForm((prev) => ({ ...prev, trackingNumber: event.target.value }))}
                    placeholder="Numero de guia"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <select
                    value={trackingForm.status}
                    onChange={(event) => setTrackingForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                  </select>
                  <button
                    type="button"
                    onClick={saveShipment}
                    disabled={workingAction === `ship-${selectedOrder.id}`}
                    className="w-full rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black disabled:opacity-60"
                  >
                    Guardar seguimiento
                  </button>
                  {selectedShipment ? (
                    <p className="text-xs text-gray-400">
                      Ultimo seguimiento: {selectedShipment.status} {selectedShipment.trackingNumber ? `- ${selectedShipment.trackingNumber}` : ''}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
