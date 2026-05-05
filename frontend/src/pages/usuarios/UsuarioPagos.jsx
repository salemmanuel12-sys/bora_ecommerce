import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CreditCard, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavbarSesion from "../../components/usuarios/NavbarSesion";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { pedidoService } from "../../api/pedidoService";
import { pagoService } from "../../api/pagoService";

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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isApprovedStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["approved", "aprobado", "paid", "pagado"].includes(normalized);
}

function getStripeDiagnosticSemaforo(diagnostics) {
  const status = String(diagnostics?.stripe?.paymentIntent?.status || "").toLowerCase();
  const hasBalanceTx = Boolean(diagnostics?.stripe?.charge?.balanceTransactionId);

  if (hasBalanceTx || diagnostics?.reflectsInStripeBalance) {
    return {
      label: "Verde · Confirmado en Stripe",
      dotClass: "bg-emerald-500",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (["requires_payment_method", "requires_action", "processing"].includes(status)) {
    return {
      label: "Amarillo · Pendiente de confirmacion",
      dotClass: "bg-amber-500",
      chipClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "canceled" || status === "requires_capture" || status === "payment_failed") {
    return {
      label: "Rojo · Pago no consolidado",
      dotClass: "bg-rose-500",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    label: "Amarillo · Sin datos suficientes",
    dotClass: "bg-amber-500",
    chipClass: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function UsuarioPagos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [paymentsByOrder, setPaymentsByOrder] = useState({});
  const [oxxoByOrder, setOxxoByOrder] = useState({});
  const [stripeDiagnosticsByOrder, setStripeDiagnosticsByOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingOrderId, setWorkingOrderId] = useState(null);
  const callbackProcessedRef = useRef("");

  const isPaid = (order, payment) => {
    const paymentStatus = String(payment?.status || "").toLowerCase();
    const orderPaymentStatus = String(order?.paymentStatus || "").toLowerCase();
    return ["approved", "aprobado", "paid", "pagado"].includes(paymentStatus)
      || ["approved", "aprobado", "paid", "pagado"].includes(orderPaymentStatus);
  };

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadData = async () => {
      try {
        const ordersResult = await pedidoService.list({ page: 1, limit: 30 });
        const orderRows = Array.isArray(ordersResult.data) ? ordersResult.data : [];
        setOrders(orderRows);

        const map = {};
        await Promise.all(
          orderRows.map(async (order) => {
            try {
              const payment = await pagoService.getByOrder(order.id);
              map[order.id] = payment;
            } catch (_error) {
              map[order.id] = null;
            }
          })
        );
        setPaymentsByOrder(map);
      } catch (error) {
        toast.error(error?.response?.data?.message || "No se pudo cargar la seccion de pagos.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user]);

  if (authLoading) {
    return null;
  }

  if (!user) {
    navigate("/user", { replace: true });
    return null;
  }

  const refreshPayment = async (orderId) => {
    try {
      setWorkingOrderId(orderId);
      const payment = await pagoService.getByOrder(orderId);
      setPaymentsByOrder((prev) => ({ ...prev, [orderId]: payment }));
      toast.success("Estado de pago actualizado.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar el pago.");
    } finally {
      setWorkingOrderId(null);
    }
  };

  const handleStripeCheckout = async (orderId) => {
    try {
      setWorkingOrderId(orderId);
      const data = await pagoService.createStripeCheckoutSession(orderId);
      if (!data?.checkoutUrl) {
        throw new Error("No se recibio URL de Stripe.");
      }
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No se pudo iniciar Stripe.");
      setWorkingOrderId(null);
    }
  };

  const handlePayPalCheckout = async (orderId) => {
    try {
      setWorkingOrderId(orderId);
      const data = await pagoService.createPayPalOrder(orderId);
      if (!data?.approveUrl) {
        throw new Error("No se recibio URL de PayPal.");
      }
      window.location.assign(data.approveUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No se pudo iniciar PayPal.");
      setWorkingOrderId(null);
    }
  };

  const handleMercadoPagoCheckout = async (orderId) => {
    try {
      setWorkingOrderId(orderId);
      const data = await pagoService.createMercadoPagoPreference(orderId);
      const redirectUrl = data?.sandboxCheckoutUrl || data?.checkoutUrl;
      if (!redirectUrl) {
        throw new Error("No se recibio URL de Mercado Pago.");
      }
      window.location.assign(redirectUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No se pudo iniciar Mercado Pago.");
      setWorkingOrderId(null);
    }
  };

  const handleCreateOxxoVoucher = async (orderId) => {
    const voucherWindow = window.open("", "_blank");

    try {
      setWorkingOrderId(orderId);
      const customerEmail = String(user?.email || "").trim();
      if (!customerEmail) {
        voucherWindow?.close();
        throw new Error("Tu cuenta no tiene email registrado para generar ficha OXXO.");
      }

      const data = await pagoService.createStripeOxxoVoucher(orderId, {
        customerEmail,
      });

      setOxxoByOrder((prev) => ({
        ...prev,
        [orderId]: {
          paymentIntentId: data?.paymentIntentId,
          voucherUrl: data?.voucherUrl || null,
          expiresAfter: data?.expiresAfter || null,
          number: data?.number || null,
          status: data?.status || null,
        },
      }));

      setPaymentsByOrder((prev) => ({
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          method: "Efectivo",
          status: "Pendiente",
          transactionId: data?.paymentIntentId || prev[orderId]?.transactionId,
        },
      }));

      if (data?.voucherUrl) {
        if (voucherWindow) {
          voucherWindow.opener = null;
          voucherWindow.location.href = data.voucherUrl;
        } else {
          window.location.assign(data.voucherUrl);
        }
      } else {
        voucherWindow?.close();
      }
      toast.success("Ficha OXXO generada. Muestra el codigo en caja para pagar.");
    } catch (error) {
      voucherWindow?.close();
      toast.error(error?.response?.data?.message || error?.message || "No se pudo generar ficha OXXO.");
    } finally {
      setWorkingOrderId(null);
    }
  };

  const handleCheckOxxoStatus = async (orderId) => {
    try {
      const currentIntentId = oxxoByOrder[orderId]?.paymentIntentId || paymentsByOrder[orderId]?.transactionId;
      if (!currentIntentId) {
        toast("Genera primero la ficha OXXO para este pedido.");
        return;
      }

      setWorkingOrderId(orderId);
      const data = await pagoService.checkStripeOxxoStatus(orderId, { paymentIntentId: currentIntentId });

      setOxxoByOrder((prev) => ({
        ...prev,
        [orderId]: {
          paymentIntentId: currentIntentId,
          voucherUrl: data?.voucherUrl || prev[orderId]?.voucherUrl || null,
          expiresAfter: data?.expiresAfter || prev[orderId]?.expiresAfter || null,
          number: data?.number || prev[orderId]?.number || null,
          status: data?.status || null,
        },
      }));

      if (data?.payment) {
        setPaymentsByOrder((prev) => ({ ...prev, [orderId]: data.payment }));
      }

      if (data?.paid) {
        setOrders((prev) => prev.map((order) => (
          order.id === orderId
            ? { ...order, paymentStatus: "Pagado", status: order.status === "Pendiente" ? "Pagado" : order.status }
            : order
        )));
        toast.success(`Pago OXXO confirmado para pedido #${orderId}.`);
      } else {
        toast("Aun no se refleja el pago OXXO. Intenta de nuevo en unos minutos.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No se pudo consultar estado OXXO.");
    } finally {
      setWorkingOrderId(null);
    }
  };

  const handleStripeDiagnostics = async (orderId) => {
    try {
      setWorkingOrderId(orderId);

      const payment = paymentsByOrder[orderId] || null;
      const paymentIntentId = String(payment?.transactionId || "").startsWith("pi_")
        ? payment.transactionId
        : undefined;

      const diagnostics = await pagoService.getStripeDiagnostics(orderId, {
        paymentIntentId,
      });

      setStripeDiagnosticsByOrder((prev) => ({
        ...prev,
        [orderId]: diagnostics,
      }));

      if (diagnostics?.reflectsInStripeBalance) {
        toast.success("Stripe reporta balance transaction para este pedido.");
      } else {
        toast("Stripe aun no refleja balance transaction para este pedido.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "No se pudo obtener diagnostico Stripe.");
    } finally {
      setWorkingOrderId(null);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const gateway = params.get("gateway");
    const status = params.get("status");
    const orderId = Number(params.get("orderId") || 0);
    const stripeSessionId = params.get("session_id");
    const paypalToken = params.get("token");
    const mercadoPagoPaymentId = params.get("payment_id");
    const callbackKey = `${gateway}:${status}:${orderId}:${stripeSessionId || paypalToken || mercadoPagoPaymentId || ""}`;

    if (!gateway || !status || !orderId || callbackProcessedRef.current === callbackKey) {
      return;
    }

    callbackProcessedRef.current = callbackKey;

    const runCallback = async () => {
      try {
        setWorkingOrderId(orderId);
        let paymentFromCallback = null;

        if (status === "cancel") {
          toast("Pago cancelado por el usuario.");
          return;
        }

        if (gateway === "stripe") {
          // Primero: polling corto por si el webhook ya actualizó la BD
          for (let attempt = 0; attempt < 3; attempt += 1) {
            paymentFromCallback = await pagoService.getByOrder(orderId);
            if (isApprovedStatus(paymentFromCallback?.status)) {
              break;
            }
            await sleep(1200);
          }

          // Fallback: confirmar directamente via Stripe API si el polling no alcanzó
          if (!isApprovedStatus(paymentFromCallback?.status) && stripeSessionId) {
            try {
              paymentFromCallback = await pagoService.confirmStripeCheckout(orderId, { sessionId: stripeSessionId });
            } catch (_confirmError) {
              // Si ya estaba aprobado (idempotente) o hubo error, tomamos el estado actual
              paymentFromCallback = await pagoService.getByOrder(orderId);
            }
          }

          if (isApprovedStatus(paymentFromCallback?.status)) {
            toast.success(`Pago con Stripe confirmado para pedido #${orderId}.`);
          } else {
            toast("El pago esta pendiente de confirmacion. Revisa en unos minutos.");
          }
        }

        if (gateway === "paypal") {
          if (!paypalToken) {
            throw new Error("No se recibio token de PayPal.");
          }
          await pagoService.capturePayPalOrder(orderId, { paypalOrderId: paypalToken });
          toast.success(`Pago con PayPal confirmado para pedido #${orderId}.`);
        }

        if (gateway === "mercadopago") {
          if (status === "pending") {
            toast("Tu pago en Mercado Pago esta pendiente de aprobacion.");
          } else {
            if (!mercadoPagoPaymentId) {
              throw new Error("No se recibio payment_id de Mercado Pago.");
            }
            await pagoService.confirmMercadoPagoPayment(orderId, { paymentId: mercadoPagoPaymentId });
            toast.success(`Pago con Mercado Pago confirmado para pedido #${orderId}.`);
          }
        }

        const payment = paymentFromCallback || await pagoService.getByOrder(orderId);
        const orderIsPaid = isApprovedStatus(payment?.status);
        setPaymentsByOrder((prev) => ({ ...prev, [orderId]: payment }));
        setOrders((prev) => prev.map((order) => (
          order.id === orderId
            ? {
                ...order,
                paymentStatus: orderIsPaid ? "Pagado" : order.paymentStatus,
                status: orderIsPaid && order.status === "Pendiente" ? "Pagado" : order.status,
              }
            : order
        )));
      } catch (error) {
        toast.error(error?.response?.data?.message || error?.message || "No se pudo completar la confirmacion del pago.");
      } finally {
        setWorkingOrderId(null);
        navigate("/usuarios/pagos", { replace: true });
      }
    };

    runCallback();
  }, [authLoading, location.search, navigate, user]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarSesion
        active="pagos"
        userName={user?.nombre || "Cliente"}
        cartCount={0}
        onLogout={logout}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#9b24cf]">Cuenta</p>
            <h1 className="text-4xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              Formas de pago / pagos
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/usuarios/pedidos" className="rounded-xl border border-[#e7d8fb] px-4 py-2 text-sm font-semibold text-[#6a40d8]">
              Pedidos
            </Link>
            <Link to="/usuarios/direcciones" className="rounded-xl bg-[#231f20] px-4 py-2 text-sm font-semibold text-white">
              Direcciones
            </Link>
          </div>
        </div>

        <article className="rounded-3xl border border-[#ebe6f7] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
          <div className="mb-4 flex items-center gap-2 text-[#6a40d8]">
            <CreditCard size={18} />
            <h2 className="text-2xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              Pagos por pedido
            </h2>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl border border-[#efe8ff] bg-[#faf7ff]" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-[#5b5866]">No hay pedidos para mostrar pagos.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const payment = paymentsByOrder[order.id];
                const oxxoInfo = oxxoByOrder[order.id];
                const stripeDiagnostics = stripeDiagnosticsByOrder[order.id];
                const semaforo = stripeDiagnostics ? getStripeDiagnosticSemaforo(stripeDiagnostics) : null;
                const isWorking = workingOrderId === order.id;

                return (
                  <div key={order.id} className="rounded-2xl border border-[#efe8ff] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#231f20]">Pedido #{order.id}</p>
                      <span className="rounded-full bg-[#f3ebff] px-3 py-1 text-xs font-semibold text-[#6a40d8]">
                        {order.paymentStatus || "pending"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-[#5b5866] sm:grid-cols-2">
                      <p>Total: <strong className="text-[#231f20]">{formatCurrency(order.total)}</strong></p>
                      <p>Fecha: <strong className="text-[#231f20]">{formatDate(order.createdAt)}</strong></p>
                      <p>Metodo: <strong className="text-[#231f20]">{payment?.method || "N/A"}</strong></p>
                      <p>Status pago: <strong className="text-[#231f20]">{payment?.status || "pending"}</strong></p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => refreshPayment(order.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#e7d8fb] px-3 py-2 text-xs font-semibold text-[#6a40d8]"
                      >
                        <RefreshCw size={13} />
                        Refrescar
                      </button>

                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleStripeDiagnostics(order.id)}
                        className="rounded-xl border border-[#0f172a33] px-3 py-2 text-xs font-semibold text-[#0f172a]"
                      >
                        Diagnostico Stripe
                      </button>

                      {!isPaid(order, payment) ? (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleStripeCheckout(order.id)}
                            className="rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Pagar con Stripe
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handlePayPalCheckout(order.id)}
                            className="rounded-xl bg-[#003087] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Pagar con PayPal
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleMercadoPagoCheckout(order.id)}
                            className="rounded-xl bg-[#009ee3] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Pagar con Mercado Pago
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCreateOxxoVoucher(order.id)}
                            className="rounded-xl bg-[#0b5f35] px-3 py-2 text-xs font-semibold text-white"
                          >
                            Pagar en OXXO
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCheckOxxoStatus(order.id)}
                            className="rounded-xl border border-[#d5ead8] px-3 py-2 text-xs font-semibold text-[#0b5f35]"
                          >
                            Revisar OXXO
                          </button>
                        </>
                      ) : null}

                      <Link
                        to={`/usuarios/pedidos/${order.id}`}
                        className="rounded-xl border border-[#e7d8fb] px-3 py-2 text-xs font-semibold text-[#6a40d8]"
                      >
                        Ver pedido
                      </Link>
                    </div>

                    {oxxoInfo?.voucherUrl ? (
                      <div className="mt-3 rounded-xl border border-[#d5ead8] bg-[#f4fbf6] p-3 text-xs text-[#1f3a2c]">
                        <p className="font-semibold">Ficha OXXO disponible</p>
                        <p>Referencia: <strong>{oxxoInfo.number || "N/A"}</strong></p>
                        <p>Vence: <strong>{formatDate(oxxoInfo.expiresAfter ? Number(oxxoInfo.expiresAfter) * 1000 : null)}</strong></p>
                        <a
                          href={oxxoInfo.voucherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block font-semibold text-[#0b5f35] underline"
                        >
                          Abrir ficha PDF
                        </a>
                      </div>
                    ) : null}

                    {stripeDiagnostics ? (
                      <div className="mt-3 rounded-xl border border-[#dbe7ff] bg-[#f6f9ff] p-3 text-xs text-[#1c2b4f]">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">Diagnostico Stripe</p>
                          <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold ${semaforo?.chipClass}`}>
                            <span className={`h-2 w-2 rounded-full ${semaforo?.dotClass}`} />
                            {semaforo?.label}
                          </span>
                        </div>
                        <p>Refleja en saldo de prueba: <strong>{stripeDiagnostics.reflectsInStripeBalance ? "Si" : "No"}</strong></p>
                        <p>PaymentIntent: <strong>{stripeDiagnostics?.stripe?.paymentIntent?.id || "N/A"}</strong></p>
                        <p>Status intent: <strong>{stripeDiagnostics?.stripe?.paymentIntent?.status || "N/A"}</strong></p>
                        <p>Charge: <strong>{stripeDiagnostics?.stripe?.charge?.id || "N/A"}</strong></p>
                        <p>Balance transaction: <strong>{stripeDiagnostics?.stripe?.charge?.balanceTransactionId || "N/A"}</strong></p>
                        <p>Hint: <strong>{stripeDiagnostics?.hint || "N/A"}</strong></p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <FooterUsuario catalogPath="/usuarios/home-sesion" catalogLabel="Catalogo privado" />
    </main>
  );
}

export default UsuarioPagos;
