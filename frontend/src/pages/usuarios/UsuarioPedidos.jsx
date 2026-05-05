import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, Package, RefreshCw, Truck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavbarSesion from "../../components/usuarios/NavbarSesion";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { pedidoService } from "../../api/pedidoService";
import { pagoService } from "../../api/pagoService";
import { envioService } from "../../api/envioService";
import { notificacionService } from "../../api/notificacionService";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Badge({ children }) {
  return <span className="rounded-full bg-[#f3ebff] px-3 py-1 text-xs font-semibold text-[#6a40d8]">{children}</span>;
}

function UsuarioPedidos() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, loading: authLoading, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const cartCount = 0;

  const statusColor = useMemo(
    () => ({
      // Inglés (legacy)
      pending: "text-amber-700 bg-amber-100",
      paid: "text-emerald-700 bg-emerald-100",
      shipped: "text-sky-700 bg-sky-100",
      delivered: "text-green-700 bg-green-100",
      cancelled: "text-rose-700 bg-rose-100",
      // Español (valores reales del backend)
      Pendiente: "text-amber-700 bg-amber-100",
      Pagado: "text-emerald-700 bg-emerald-100",
      Aprobado: "text-emerald-700 bg-emerald-100",
      Enviado: "text-sky-700 bg-sky-100",
      Entregado: "text-green-700 bg-green-100",
      Cancelado: "text-rose-700 bg-rose-100",
    }),
    []
  );

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadNotifications = async () => {
      try {
        const result = await notificacionService.list({ page: 1, limit: 8 });
        const unreadOnly = (Array.isArray(result.data) ? result.data : []).filter((item) => !item.read);
        setNotifications(unreadOnly);
        setUnreadCount(Number(result.unreadCount || 0));
      } catch (_error) {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      try {
        if (orderId) {
          const order = await pedidoService.getById(orderId);
          setSelectedOrder(order || null);

          try {
            const paymentInfo = await pagoService.getByOrder(orderId);
            setPayment(paymentInfo || null);
          } catch (_paymentError) {
            setPayment(null);
          }

          try {
            const shipmentInfo = await envioService.getByOrder(orderId);
            setShipment(shipmentInfo || null);
          } catch (_shipmentError) {
            setShipment(null);
          }

          setOrders([]);
          setPagination(null);
        } else {
          const result = await pedidoService.list({ page: 1, limit: 20 });
          setOrders(Array.isArray(result.data) ? result.data : []);
          setPagination(result.pagination || null);
          setSelectedOrder(null);
          setPayment(null);
          setShipment(null);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "No se pudo cargar la informacion de pedidos.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [authLoading, user, orderId]);

  if (authLoading) {
    return null;
  }

  if (!user) {
    navigate("/user", { replace: true });
    return null;
  }

  const handleCheckoutRefresh = async () => {
    if (!orderId) {
      return;
    }

    try {
      setActionLoading(true);
      const order = await pedidoService.getById(orderId);
      setSelectedOrder(order || null);

      try {
        const paymentInfo = await pagoService.getByOrder(orderId);
        setPayment(paymentInfo || null);
      } catch (_paymentError) {
        setPayment(null);
      }

      try {
        const shipmentInfo = await envioService.getByOrder(orderId);
        setShipment(shipmentInfo || null);
      } catch (_shipmentError) {
        setShipment(null);
      }

      const notif = await notificacionService.list({ page: 1, limit: 8 });
      const unreadOnly = (Array.isArray(notif.data) ? notif.data : []).filter((item) => !item.read);
      setNotifications(unreadOnly);
      setUnreadCount(Number(notif.unreadCount || 0));
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el estado del pedido.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder?.id) {
      return;
    }

    try {
      setActionLoading(true);
      await pedidoService.cancel(selectedOrder.id);
      toast.success("Pedido cancelado.");
      await handleCheckoutRefresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo cancelar el pedido.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      await notificacionService.readAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success("Notificaciones marcadas como leidas.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudieron actualizar notificaciones.");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarSesion
        active="pedidos"
        userName={user?.nombre || "Cliente"}
        cartCount={cartCount}
        onLogout={logout}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#9b24cf]">Flujo de compra</p>
            <h1 className="text-4xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              {orderId ? `Pedido #${orderId}` : "Mis pedidos"}
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/carrito" className="rounded-xl border border-[#e7d8fb] px-4 py-2 text-sm font-semibold text-[#6a40d8]">
              Volver al carrito
            </Link>
            {!orderId ? null : (
              <Link to="/usuarios/pedidos" className="rounded-xl bg-[#231f20] px-4 py-2 text-sm font-semibold text-white">
                Ver todos
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <div>
            {loading ? (
              <div className="h-44 animate-pulse rounded-3xl border border-[#ebe6f7] bg-white" />
            ) : orderId ? (
              <div className="space-y-4">
                {selectedOrder ? (
                  <article className="rounded-3xl border border-[#ebe6f7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-2xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                        Detalle del pedido
                      </h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[selectedOrder.status] || "bg-slate-100 text-slate-700"}`}>
                        {selectedOrder.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[#5b5866] sm:grid-cols-2">
                      <p>Total: <strong className="text-[#231f20]">{formatCurrency(selectedOrder.total)}</strong></p>
                      <p>Pago: <strong className="text-[#231f20]">{selectedOrder.paymentStatus || "pending"}</strong></p>
                      <p>Creado: <strong className="text-[#231f20]">{formatDate(selectedOrder.createdAt)}</strong></p>
                      <p>Metodo: <strong className="text-[#231f20]">{payment?.method || selectedOrder.payment?.method || "N/A"}</strong></p>
                    </div>

                    <div className="mt-5 space-y-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#9b24cf]">Items</p>
                      {(selectedOrder.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#f0e9ff] px-4 py-2 text-sm">
                          <span>{item.producto?.name || `Producto #${item.productId}`}</span>
                          <span>{item.quantity} x {formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCheckoutRefresh}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#ebe6f7] px-4 py-2 text-sm text-[#6a40d8]"
                      >
                        <RefreshCw size={14} />
                        Actualizar
                      </button>

                      {selectedOrder.status === "pending" ? (
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={actionLoading}
                          className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
                        >
                          Cancelar pedido
                        </button>
                      ) : null}
                    </div>
                  </article>
                ) : (
                  <div className="rounded-3xl border border-[#ebe6f7] bg-white p-8 text-center">
                    Pedido no encontrado.
                  </div>
                )}

                <article className="rounded-3xl border border-[#ebe6f7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
                  <div className="mb-3 flex items-center gap-2 text-[#6a40d8]">
                    <Truck size={16} />
                    <h3 className="text-xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                      Estado de envio
                    </h3>
                  </div>
                  {shipment ? (
                    <div className="space-y-2 text-sm text-[#5b5866]">
                      <p>Carrier: <strong className="text-[#231f20]">{shipment.carrier || "-"}</strong></p>
                      <p>Guia: <strong className="text-[#231f20]">{shipment.trackingNumber || "-"}</strong></p>
                      <p>Estado: <strong className="text-[#231f20]">{shipment.status || "pending"}</strong></p>
                      <p>Enviado: <strong className="text-[#231f20]">{formatDate(shipment.shippedAt)}</strong></p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#5b5866]">Aun no hay envio registrado para este pedido.</p>
                  )}
                </article>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="rounded-3xl border border-[#ebe6f7] bg-white p-8 text-center">
                    Todavia no tienes pedidos registrados.
                  </div>
                ) : (
                  orders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-[#ebe6f7] bg-white p-5 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                          Pedido #{order.id}
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[order.status] || "bg-slate-100 text-slate-700"}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#5b5866]">
                        <p>Total: <strong className="text-[#231f20]">{formatCurrency(order.total)}</strong></p>
                        <p>Pago: <strong className="text-[#231f20]">{order.paymentStatus}</strong></p>
                        <p>Fecha: <strong className="text-[#231f20]">{formatDate(order.createdAt)}</strong></p>
                      </div>
                      <Link to={`/usuarios/pedidos/${order.id}`} className="mt-4 inline-flex items-center rounded-lg bg-[#231f20] px-4 py-2 text-sm font-semibold text-white">
                        Ver detalle
                      </Link>
                    </article>
                  ))
                )}
                {pagination ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8a83a1]">
                    Total: {pagination.total} pedidos
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <article className="rounded-3xl border border-[#ebe6f7] bg-white p-5 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[#6a40d8]">
                  <Bell size={16} />
                  <h3 className="text-lg" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                    Notificaciones
                  </h3>
                </div>
                <Badge>{unreadCount} sin leer</Badge>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-sm text-[#5b5866]">Sin notificaciones sin leer.</p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className={`rounded-xl border px-3 py-2 text-sm ${item.read ? "border-[#f0ebff] text-[#6c6780]" : "border-[#d8c5ff] bg-[#f8f2ff] text-[#3f3854]"}`}>
                      <p className="font-medium">{item.type}</p>
                      <p>{item.message}</p>
                      <p className="mt-1 text-xs opacity-70">{formatDate(item.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllNotifications}
                  className="mt-3 w-full rounded-xl border border-[#e7d8fb] px-4 py-2 text-sm font-semibold text-[#6a40d8]"
                >
                  Marcar todo como leido
                </button>
              ) : null}
            </article>

            <article className="rounded-3xl border border-[#ebe6f7] bg-white p-5 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
              <div className="mb-3 inline-flex items-center gap-2 text-[#6a40d8]">
                <Package size={16} />
                <h3 className="text-lg" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                  Estado rapido
                </h3>
              </div>
              <p className="text-sm text-[#5b5866]">
                Desde esta vista puedes confirmar pagos, revisar envio y cancelar pedidos pendientes usando los endpoints reales del backend.
              </p>
            </article>
          </aside>
        </div>
      </section>

      <FooterUsuario catalogPath="/usuarios/home-sesion" catalogLabel="Catalogo privado" />
    </main>
  );
}

export default UsuarioPedidos;
