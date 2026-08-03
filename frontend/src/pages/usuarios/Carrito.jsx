import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { carritoService } from "../../api/carritoService";
import { useAuth } from "../../context/AuthContext";
import { clearGuestCart, getGuestCart, removeGuestItem, updateGuestItem } from "../../lib/guestCart";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import NavbarSesion from "../../components/usuarios/NavbarSesion";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { direccionService } from "../../api/direccionService";
import { pedidoService } from "../../api/pedidoService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");

const STEPS = [
  { id: 1, label: "Carrito", icon: ShoppingCart },
  { id: 2, label: "Dirección", icon: MapPin },
];

const EMPTY_ADDRESS = {
  fullName: "",
  addressTypeId: 2,
  phone: "",
  street: "",
  extNumber: "",  
  intNumber: "",
  city: "",
  state: "",
  stateCode: "",
  postalCode: "",
  country: "Mexico",
  references: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getImageUrl(item) {
  const url = item?.producto?.imagen;
  if (!url) return null;
  if (String(url).startsWith("http://") || String(url).startsWith("https://")) return url;
  return `${STATIC_BASE_URL}/uploads/${url}`;
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <nav aria-label="Pasos del pedido" className="mb-10 flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "border-[#6a40d8] bg-[#6a40d8] text-white"
                    : active
                    ? "border-[#9b24cf] bg-white text-[#9b24cf] shadow-lg shadow-purple-200"
                    : "border-[#e0d8f5] bg-white text-[#c0b8d8]"
                }`}
              >
                {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${
                  active ? "text-[#9b24cf]" : done ? "text-[#6a40d8]" : "text-[#c0b8d8]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-16 sm:w-24 transition-all ${
                  done ? "bg-[#6a40d8]" : "bg-[#e0d8f5]"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
function Carrito() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  // Cart state
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [workingItemId, setWorkingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Wizard step
  const [step, setStep] = useState(1);

  // Step 2 – address
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [states, setStates] = useState([]);
  const [shippingQuotes, setShippingQuotes] = useState([]);
  const [loadingShippingQuotes, setLoadingShippingQuotes] = useState(false);
  const [selectedShippingProviderId, setSelectedShippingProviderId] = useState("");
  const [selectedShippingProviderServiceId, setSelectedShippingProviderServiceId] = useState("");

  const [processingCheckout, setProcessingCheckout] = useState(false);

  const isAuthenticated = Boolean(user);
  const hasItems = useMemo(() => (cart.items || []).length > 0, [cart.items]);
  const subtotal = useMemo(
    () => (cart.items || []).reduce((acc, item) => acc + Number(item.subtotal ?? (Number(item.price) * item.quantity)), 0),
    [cart.items]
  );

  const selectedShippingQuote = useMemo(
    () => shippingQuotes.find(
      (q) => String(q.providerServiceId) === String(selectedShippingProviderServiceId)
        && String(q.providerId) === String(selectedShippingProviderId)
    ) || null,
    [shippingQuotes, selectedShippingProviderServiceId, selectedShippingProviderId]
  );

  const shippingCost = Number(selectedShippingQuote?.cost || 0);
  const grandTotal = Number((subtotal + shippingCost).toFixed(2));
  const isShippingQuoteBlocking = step === 2 && loadingShippingQuotes;

  // Load cart
  useEffect(() => {
    if (authLoading) return;

    const loadCart = async () => {
      try {
        const data = isAuthenticated ? await carritoService.getCart() : getGuestCart();
        setCart(data || { items: [], itemCount: 0, subtotal: 0 });
      } catch (error) {
        toast.error(error?.response?.data?.message || "No se pudo cargar el carrito.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [authLoading, isAuthenticated]);

  // Load addresses
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const loadAddresses = async () => {
      try {
        const rows = await direccionService.list();
        const list = Array.isArray(rows) ? rows : [];
        setAddresses(list);
        if (list.length > 0) setSelectedAddressId(String(list[0].id));
        else setShowAddressForm(true); // auto-open form if no addresses
      } catch {
        setAddresses([]);
        setShowAddressForm(true);
      }
    };

    loadAddresses();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const loadStates = async () => {
      try {
        const rows = await direccionService.listStates();
        setStates(Array.isArray(rows) ? rows : []);
      } catch {
        setStates([]);
      }
    };

    loadStates();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || step !== 2 || !selectedAddressId) {
      return;
    }

    const loadShippingQuotes = async () => {
      try {
        setLoadingShippingQuotes(true);
        const result = await pedidoService.shippingQuotes({
          shippingAddressId: Number(selectedAddressId),
        });

        const quotes = Array.isArray(result?.quotes) ? result.quotes : [];
        setShippingQuotes(quotes);
        setSelectedShippingProviderId(quotes[0]?.providerId ? String(quotes[0].providerId) : "");
        setSelectedShippingProviderServiceId(quotes[0]?.providerServiceId ? String(quotes[0].providerServiceId) : "");
      } catch (error) {
        setShippingQuotes([]);
        setSelectedShippingProviderId("");
        setSelectedShippingProviderServiceId("");
        toast.error(error?.response?.data?.message || "No se pudieron obtener cotizaciones de envio.");
      } finally {
        setLoadingShippingQuotes(false);
      }
    };

    loadShippingQuotes();
  }, [authLoading, isAuthenticated, step, selectedAddressId]);

  // ── Cart actions ──────────────────────────────────────────────────────────
  const updateQuantity = async (item, nextQty) => {
    if (nextQty < 1) return;
    try {
      setWorkingItemId(item.id);
      const nextCart = isAuthenticated
        ? await carritoService.updateItem(item.id, nextQty)
        : updateGuestItem(item.id, nextQty);
      setCart(nextCart || { items: [], itemCount: 0, subtotal: 0 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo actualizar la cantidad.");
    } finally {
      setWorkingItemId(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setWorkingItemId(itemId);
      const nextCart = isAuthenticated
        ? await carritoService.removeItem(itemId)
        : removeGuestItem(itemId);
      setCart(nextCart || { items: [], itemCount: 0, subtotal: 0 });
      toast.success("Artículo eliminado.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo eliminar el artículo.");
    } finally {
      setWorkingItemId(null);
    }
  };

  const clearCart = async () => {
    try {
      setClearing(true);
      const nextCart = isAuthenticated ? await carritoService.clearCart() : clearGuestCart();
      setCart(nextCart || { items: [], itemCount: 0, subtotal: 0 });
      toast.success("Carrito vaciado.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo vaciar el carrito.");
    } finally {
      setClearing(false);
    }
  };

  // ── Address actions ───────────────────────────────────────────────────────
  const saveAddress = async () => {
    const required = ["fullName", "addressTypeId", "phone", "street", "extNumber", "intNumber", "city", "stateCode", "postalCode"];
    if (required.some((f) => !String(newAddress[f] || "").trim())) {
      toast.error("Completa todos los campos requeridos.");
      return;
    }
    try {
      setSavingAddress(true);
      const created = await direccionService.create({
        ...newAddress,
        fullName: newAddress.fullName.trim(),
        addressTypeId: newAddress.addressTypeId,  
        phone: newAddress.phone.trim(),
        street: newAddress.street.trim(),
        extNumber: newAddress.extNumber.trim(),
        intNumber: newAddress.intNumber.trim(), 
        city: newAddress.city.trim(),
        stateCode: newAddress.stateCode.trim(),
        state: newAddress.state.trim(),
        postalCode: newAddress.postalCode.trim(),
        country: (newAddress.country || "Mexico").trim(),
        references: newAddress.references?.trim() || "",
      });

      console.log("Created address:", created);
      const next = [created, ...addresses];
      setAddresses(next);
      setSelectedAddressId(String(created.id));
      setShowAddressForm(false);
      setNewAddress(EMPTY_ADDRESS);
      toast.success("Dirección guardada.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo guardar la dirección.");
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      setDeletingAddressId(addressId);
      await direccionService.remove(addressId);

      const nextAddresses = addresses.filter((item) => item.id !== addressId);
      setAddresses(nextAddresses);

      if (String(selectedAddressId) === String(addressId)) {
        setSelectedAddressId(nextAddresses[0]?.id ? String(nextAddresses[0].id) : "");
      }

      if (nextAddresses.length === 0) {
        setShowAddressForm(true);
      }

      toast.success("Dirección eliminada.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo eliminar la dirección.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Selecciona una dirección de envío.");
      return;
    }
    if (!selectedShippingProviderServiceId) {
      toast.error("Selecciona una paqueteria para continuar.");
      return;
    }
    if (!selectedShippingProviderId) {
      toast.error("Selecciona una paqueteria valida para continuar.");
      return;
    }
    try {
      setProcessingCheckout(true);
      const payload = {
        shippingAddressId: Number(selectedAddressId),
        shippingProviderId: String(selectedShippingProviderId),
        shippingProviderServiceId: String(selectedShippingProviderServiceId),
      };

      const order = await pedidoService.checkout(payload);
      toast.success(`¡Pedido #${order.id} creado!`);
      navigate(`/usuarios/pagos?orderId=${order.id}&fromCheckout=1`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo completar el pedido.");
    } finally {
      setProcessingCheckout(false);
    }
  };

  // ── Navigation guards ─────────────────────────────────────────────────────
  const goToStep2 = () => {
    if (!isAuthenticated) return; // handled by auth gate UI
    if (!hasItems) { toast.error("Tu carrito está vacío."); return; }
    setStep(2);
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      {isAuthenticated ? (
        <NavbarSesion
          active="carrito"
          userName={user?.nombre || "Cliente"}
          cartCount={cart.itemCount || 0}
          onLogout={logout}
        />
      ) : (
        <NavbarPublic active="carrito" cartCount={cart.itemCount || 0} />
      )}

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1
          className="mb-2 text-5xl leading-none"
          style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
        >
          {step === 1 ? "Tu carrito" : "Dirección de envío"}
        </h1>
        <p className="mb-8 text-sm text-[#5b5866]">
          {step === 1
            ? `${cart.itemCount || 0} artículo(s) en tu compra.`
            : "Confirma tu dirección para crear el pedido y continuar al pago."}
        </p>

        {isAuthenticated && hasItems && <StepBar current={step} />}

        {loading ? (
          <div className="h-40 animate-pulse rounded-[2rem] border border-[#e8e3f5] bg-white" />
        ) : (
          <>
            {/* ── STEP 1: CART ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                {!hasItems ? (
                  <div className="rounded-[2rem] border border-[#e8e3f5] bg-white p-8 text-center shadow-[0_35px_80px_-50px_rgba(70,40,160,0.35)] sm:p-12">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f1fffe] text-[#169b95]">
                      <ShoppingCart size={30} />
                    </div>
                    <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#5b5866] sm:text-base">
                      Aún no agregas productos. Explora el catálogo y guarda tus piezas favoritas.
                    </p>
                    <Link
                      to={isAuthenticated ? "/usuarios/home-sesion" : "/"}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#231f20] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Explorar catálogo <ChevronRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.items.map((item) => {
                      const image = getImageUrl(item);
                      const busy = workingItemId === item.id;
                      return (
                        <article
                          key={item.id}
                          className="rounded-3xl border border-[#e8e3f5] bg-white p-4 shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)] sm:p-5"
                        >
                          <div className="flex gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f8f7fc]">
                              {image ? (
                                <img
                                  src={image}
                                  alt={item.producto?.name || "Producto"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-[#9b8fc0]">
                                  <ShoppingCart size={20} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2
                                className="truncate text-xl"
                                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                              >
                                {item.producto?.name || "Producto"}
                              </h2>
                              <div className="mt-1">
                                <p className="text-sm text-[#5b5866]">{formatCurrency(item.price)} c/u</p>
                                {Number(item.basePrice || item.price) > Number(item.price) ? (
                                  <p className="text-xs text-[#8b83a6] line-through">{formatCurrency(item.basePrice)} c/u</p>
                                ) : null}
                                {item.descuentoAplicado ? (
                                  <p className="text-xs font-semibold text-[#16786f]">
                                    Mayoreo aplicado ({item.descuentoAplicado.cantidadMin}-{item.descuentoAplicado.cantidadMax})
                                  </p>
                                ) : null}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="inline-flex items-center rounded-full border border-[#e6e2f5] bg-white">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item, item.quantity - 1)}
                                    disabled={busy || item.quantity <= 1}
                                    className="px-3 py-2 text-[#6a40d8] disabled:opacity-40"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="px-3 text-sm font-medium">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                    disabled={busy}
                                    className="px-3 py-2 text-[#6a40d8] disabled:opacity-40"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                                >
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-[#231f20]">
                                Subtotal: {formatCurrency(item.subtotal ?? (Number(item.price) * item.quantity))}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}

                    {/* Summary card */}
                    <div className="rounded-3xl border border-[#e8e3f5] bg-white p-6 shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)]">
                      <div className="flex items-center justify-between text-sm text-[#5b5866]">
                        <span>Artículos</span>
                        <span>{cart.itemCount || 0}</span>
                      </div>
                      <div
                        className="mt-2 flex items-center justify-between text-2xl"
                        style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                      >
                        <span>Subtotal</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>

                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={goToStep2}
                          className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          Continuar con el envío <ChevronRight className="ml-1 inline" size={16} />
                        </button>
                      ) : (
                        <div className="mt-5 rounded-xl border border-[#f0d8fa] bg-[#fdf4ff] p-4">
                          <p className="text-sm text-[#5b5866]">
                            Para continuar con la compra, inicia sesión o crea una cuenta.
                          </p>
                          <div className="mt-3 grid gap-2">
                            <Link
                              to="/user"
                              className="rounded-lg bg-[#231f20] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black"
                            >
                              Iniciar sesión
                            </Link>
                            <Link
                              to="/usuarios/registro"
                              className="rounded-lg border border-[#e7d8fb] px-4 py-2.5 text-center text-sm font-semibold text-[#6a40d8] transition hover:bg-white"
                            >
                              Registrarme
                            </Link>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={clearCart}
                        disabled={clearing}
                        className="mt-3 w-full rounded-xl border border-[#f0d8fa] px-4 py-3 text-sm font-medium text-[#9b24cf] transition hover:bg-[#fdf4ff] disabled:opacity-60"
                      >
                        {clearing ? "Vaciando..." : "Vaciar carrito"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 2: DIRECCIÓN ─────────────────────────────────── */}
            {step === 2 && (
              <div className="relative rounded-3xl border border-[#e8e3f5] bg-white p-6 shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)]" aria-busy={isShippingQuoteBlocking}>
                {isShippingQuoteBlocking && (
                  <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-white/80 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center rounded-2xl border border-[#e5dcfb] bg-white px-6 py-5 shadow-[0_16px_45px_-30px_rgba(70,40,160,0.45)]">
                      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#e1d4fa] border-t-[#7a3fe0]" />
                      <p className="mt-3 text-sm font-semibold text-[#4d3a80]">Cotizando paquetería...</p>
                      <p className="mt-1 text-xs text-[#72658f]">Espera un momento mientras obtenemos las opciones de envío.</p>
                    </div>
                  </div>
                )}

                {addresses.length > 0 && !showAddressForm && (
                  <div className="mb-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                      Mis direcciones
                    </p>
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                          String(selectedAddressId) === String(address.id)
                            ? "border-[#6a40d8] bg-[#faf7ff]"
                            : "border-[#ebe6f7] bg-white hover:border-[#c9bef5]"
                        }`}
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={String(address.id)}
                            checked={String(selectedAddressId) === String(address.id)}
                            onChange={() => setSelectedAddressId(String(address.id))}
                            className="mt-0.5 accent-[#6a40d8]"
                          />
                          <div className="text-sm">
                            <p className="font-semibold text-[#231f20]">{address.fullName}</p>
                            <p className="text-[#5b5866]">
                              {address.street}, {address.city}, {address.state} {address.postalCode}
                            </p>
                            {address.phone && (
                              <p className="text-[#8b83a6]">Tel: {address.phone}</p>
                            )}
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={() => deleteAddress(address.id)}
                          disabled={deletingAddressId === address.id}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                          aria-label="Eliminar dirección"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="mt-2 text-xs font-semibold text-[#6a40d8]"
                    >
                      + Agregar nueva dirección
                    </button>
                  </div>
                )}

                {showAddressForm && (
                  <div className="mb-5 space-y-3 rounded-2xl border border-[#ebe6f7] bg-[#faf7ff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                      Nueva dirección
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Nombre completo *"
                        className="col-span-2 w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="Teléfono *"
                        className="col-span-2 w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                        placeholder="Calle y número *"
                        className="col-span-2 w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.extNumber}
                        onChange={(e) => setNewAddress((p) => ({ ...p, extNumber: e.target.value }))}
                        placeholder="Número exterior *"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.intNumber}
                        onChange={(e) => setNewAddress((p) => ({ ...p, intNumber: e.target.value }))}
                        placeholder="Número interior"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />  
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                        placeholder="Ciudad *"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <select
                        value={newAddress.stateCode}
                        onChange={(e) => {
                          const selectedCode = e.target.value;
                          const selectedState = states.find((item) => item.code === selectedCode);
                          setNewAddress((p) => ({
                            ...p,
                            stateCode: selectedCode,
                            state: selectedState?.name || "",
                          }));
                        }}
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      >
                        <option value="">Estado *</option>
                        {states.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress((p) => ({ ...p, postalCode: e.target.value }))}
                        placeholder="Código postal *"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress((p) => ({ ...p, country: e.target.value }))}
                        placeholder="País"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.references}
                        onChange={(e) => setNewAddress((p) => ({ ...p, references: e.target.value }))}
                        placeholder="Referencias (opcional)"
                        className="col-span-2 w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={savingAddress}
                        className="flex-1 rounded-xl bg-[#231f20] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
                      >
                        {savingAddress ? "Guardando..." : "Guardar dirección"}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-xl border border-[#ebe6f7] px-4 py-2.5 text-sm text-[#6a40d8]"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-5 space-y-3 rounded-2xl border border-[#ebe6f7] bg-[#f9fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                    Paqueteria (FedEx / DHL)
                  </p>

                  {loadingShippingQuotes ? (
                    <div className="h-14 animate-pulse rounded-xl border border-[#e8ebf8] bg-white" />
                  ) : shippingQuotes.length === 0 ? (
                    <p className="text-sm text-[#5b5866]">No hay cotizaciones disponibles para esta direccion.</p>
                  ) : (
                    <div className="space-y-2">
                      {shippingQuotes.map((quote) => (
                        <label
                          key={quote.quoteKey || `${quote.providerId}:${quote.providerServiceId}`}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                            String(selectedShippingProviderServiceId) === String(quote.providerServiceId)
                            && String(selectedShippingProviderId) === String(quote.providerId)
                              ? "border-[#6a40d8] bg-[#f5f1ff]"
                              : "border-[#ebe6f7] bg-white hover:border-[#c9bef5]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shippingQuote"
                              value={quote.quoteKey || `${quote.providerId}:${quote.providerServiceId}`}
                              checked={
                                String(selectedShippingProviderServiceId) === String(quote.providerServiceId)
                                && String(selectedShippingProviderId) === String(quote.providerId)
                              }
                              onChange={() => {
                                setSelectedShippingProviderId(String(quote.providerId));
                                setSelectedShippingProviderServiceId(String(quote.providerServiceId));
                              }}
                              className="accent-[#6a40d8]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-[#231f20]">Proveedor: {quote.provider || "N/A"}</p>
                              <p className="text-xs text-[#5b5866]">Vía de transporte: {quote.viaTransport || "N/A"}</p>
                              <p className="text-xs text-[#5b5866]">Fecha estimada: {quote.estimatedDate || "N/A"}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-[#231f20]">{formatCurrency(quote.total ?? quote.cost)}</p>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order mini-summary */}
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#faf7ff] px-4 py-3 text-sm">
                  <div className="text-[#5b5866]">
                    <p>{cart.itemCount} artículo(s)</p>
                    <p>Subtotal: {formatCurrency(subtotal)}</p>
                    <p>Envío: {formatCurrency(shippingCost)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8b83a6]">Total</p>
                    <span
                      className="text-xl font-semibold text-[#231f20]"
                      style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                    >
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isShippingQuoteBlocking}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ebe6f7] px-4 py-3 text-sm text-[#5b5866] transition hover:bg-[#faf7ff]"
                  >
                    <ArrowLeft size={15} /> Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={processingCheckout || isShippingQuoteBlocking || !selectedShippingProviderServiceId}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {processingCheckout ? "Creando pedido..." : "Continuar a pagos"} <ChevronRight className="ml-1 inline" size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <FooterUsuario
        catalogPath={isAuthenticated ? "/usuarios/home-sesion" : "/"}
        catalogLabel={isAuthenticated ? "Catálogo" : "Catálogo"}
      />
    </main>
  );
}

export default Carrito;
