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
  CreditCard,
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
import { tarjetaService } from "../../api/tarjetaService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");

const STEPS = [
  { id: 1, label: "Carrito", icon: ShoppingCart },
  { id: 2, label: "Dirección", icon: MapPin },
  { id: 3, label: "Pago", icon: CreditCard },
];

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Mexico",
  references: "",
};

const EMPTY_CARD = {
  holderName: "",
  cardNumber: "",
  expMonth: "",
  expYear: "",
  cvv: "",
};

const PAYMENT_OPTIONS = [
  {
    value: "card",
    label: "Tarjeta de crédito / débito",
    description: "Visa, Mastercard, American Express",
    icon: "💳",
  },
  {
    value: "transfer",
    label: "Transferencia bancaria",
    description: "SPEI / depósito a cuenta",
    icon: "🏦",
  },
  {
    value: "cash",
    label: "Pago en efectivo",
    description: "OXXO, 7-Eleven u otro establecimiento",
    icon: "💵",
  },
];

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

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
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
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);

  // Step 3 – payment
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState(EMPTY_CARD);

  const isAuthenticated = Boolean(user);
  const hasItems = useMemo(() => (cart.items || []).length > 0, [cart.items]);
  const subtotal = useMemo(
    () => (cart.items || []).reduce((acc, item) => acc + Number(item.price) * item.quantity, 0),
    [cart.items]
  );
  const selectedAddress = useMemo(
    () => addresses.find((a) => String(a.id) === String(selectedAddressId)) || null,
    [addresses, selectedAddressId]
  );

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
      } catch (_error) {
        setAddresses([]);
        setShowAddressForm(true);
      }
    };

    loadAddresses();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const loadCards = async () => {
      try {
        const rows = await tarjetaService.list();
        const list = Array.isArray(rows) ? rows : [];
        setSavedCards(list);

        const defaultCard = list.find((item) => item.isDefault) || list[0];
        if (defaultCard) {
          setSelectedCardId(String(defaultCard.id));
          setShowCardForm(false);
        } else {
          setSelectedCardId("");
          setShowCardForm(true);
        }
      } catch (_error) {
        setSavedCards([]);
        setShowCardForm(true);
      }
    };

    loadCards();
  }, [authLoading, isAuthenticated]);

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
    const required = ["fullName", "phone", "street", "city", "state", "postalCode"];
    if (required.some((f) => !String(newAddress[f] || "").trim())) {
      toast.error("Completa todos los campos requeridos.");
      return;
    }
    try {
      setSavingAddress(true);
      const created = await direccionService.create({
        ...newAddress,
        fullName: newAddress.fullName.trim(),
        phone: newAddress.phone.trim(),
        street: newAddress.street.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        postalCode: newAddress.postalCode.trim(),
        country: (newAddress.country || "Mexico").trim(),
        references: newAddress.references?.trim() || "",
      });
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

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Selecciona una dirección de envío.");
      return;
    }
    try {
      setProcessingCheckout(true);
      const payload = {
        shippingAddressId: Number(selectedAddressId),
        paymentMethod,
      };

      if (paymentMethod === "card") {
        if (selectedCardId) {
          payload.cardId = Number(selectedCardId);
        } else {
          const holderName = String(newCard.holderName || "").trim();
          const cardNumber = onlyDigits(newCard.cardNumber);
          const expMonth = Number.parseInt(String(newCard.expMonth), 10);
          const expYear = Number.parseInt(String(newCard.expYear), 10);
          const cvv = onlyDigits(newCard.cvv);

          if (!holderName || cardNumber.length < 13 || cardNumber.length > 19 || cvv.length < 3 || cvv.length > 4) {
            toast.error("Completa correctamente los datos de la tarjeta.");
            setProcessingCheckout(false);
            return;
          }

          if (!Number.isFinite(expMonth) || expMonth < 1 || expMonth > 12) {
            toast.error("Mes de expiracion invalido.");
            setProcessingCheckout(false);
            return;
          }

          if (!Number.isFinite(expYear) || expYear < 24) {
            toast.error("Anio de expiracion invalido.");
            setProcessingCheckout(false);
            return;
          }

          payload.card = {
            holderName,
            cardNumber,
            expMonth,
            expYear,
            cvv,
            isDefault: savedCards.length === 0,
          };
        }
      }

      const order = await pedidoService.checkout(payload);
      toast.success(`¡Pedido #${order.id} creado!`);
      navigate(`/usuarios/pedidos/${order.id}`);
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

  const goToStep3 = () => {
    if (!selectedAddressId) {
      toast.error("Selecciona o agrega una dirección primero.");
      return;
    }
    setStep(3);
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
          {step === 1 ? "Tu carrito" : step === 2 ? "Dirección de envío" : "Forma de pago"}
        </h1>
        <p className="mb-8 text-sm text-[#5b5866]">
          {step === 1
            ? `${cart.itemCount || 0} artículo(s) en tu compra.`
            : step === 2
            ? "¿A dónde enviamos tu pedido?"
            : "Elige cómo quieres pagar tu pedido."}
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
                              <p className="mt-1 text-sm text-[#5b5866]">{formatCurrency(item.price)} c/u</p>
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
              <div className="rounded-3xl border border-[#e8e3f5] bg-white p-6 shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)]">
                {addresses.length > 0 && !showAddressForm && (
                  <div className="mb-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                      Mis direcciones
                    </p>
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                          String(selectedAddressId) === String(address.id)
                            ? "border-[#6a40d8] bg-[#faf7ff]"
                            : "border-[#ebe6f7] bg-white hover:border-[#c9bef5]"
                        }`}
                      >
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
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                        placeholder="Ciudad *"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                        placeholder="Estado *"
                        className="w-full rounded-xl border border-[#e5dcfb] px-3 py-2.5 text-sm outline-none focus:border-[#9b24cf]"
                      />
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

                {/* Order mini-summary */}
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#faf7ff] px-4 py-3 text-sm">
                  <span className="text-[#5b5866]">{cart.itemCount} artículo(s)</span>
                  <span
                    className="text-xl font-semibold text-[#231f20]"
                    style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                  >
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ebe6f7] px-4 py-3 text-sm text-[#5b5866] transition hover:bg-[#faf7ff]"
                  >
                    <ArrowLeft size={15} /> Atrás
                  </button>
                  <button
                    type="button"
                    onClick={goToStep3}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Continuar al pago <ChevronRight className="ml-1 inline" size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: PAGO ──────────────────────────────────────── */}
            {step === 3 && (
              <div className="rounded-3xl border border-[#e8e3f5] bg-white p-6 shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)]">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                  Elige tu método de pago
                </p>

                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${
                        paymentMethod === option.value
                          ? "border-[#6a40d8] bg-[#faf7ff]"
                          : "border-[#ebe6f7] bg-white hover:border-[#c9bef5]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="accent-[#6a40d8]"
                      />
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#231f20]">{option.label}</p>
                        <p className="text-xs text-[#8b83a6]">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === "card" && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-[#ebe6f7] bg-[#faf7ff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                      Tarjeta para este pago
                    </p>

                    {savedCards.length > 0 && (
                      <div className="space-y-2">
                        {savedCards.map((card) => (
                          <label
                            key={card.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2 text-sm ${
                              String(selectedCardId) === String(card.id)
                                ? "border-[#6a40d8] bg-white"
                                : "border-[#e5dcfb] bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="savedCard"
                                checked={String(selectedCardId) === String(card.id)}
                                onChange={() => {
                                  setSelectedCardId(String(card.id));
                                  setShowCardForm(false);
                                }}
                                className="accent-[#6a40d8]"
                              />
                              <span className="capitalize">{card.brand}</span>
                              <span>**** {card.last4}</span>
                            </div>
                            <span className="text-xs text-[#8b83a6]">
                              {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowCardForm((prev) => !prev);
                        if (!showCardForm) setSelectedCardId("");
                      }}
                      className="text-xs font-semibold text-[#6a40d8]"
                    >
                      {showCardForm ? "Ocultar nueva tarjeta" : "Usar otra tarjeta"}
                    </button>

                    {(showCardForm || savedCards.length === 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newCard.holderName}
                          onChange={(event) => setNewCard((prev) => ({ ...prev, holderName: event.target.value }))}
                          placeholder="Titular"
                          className="col-span-2 rounded-xl border border-[#e5dcfb] px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={newCard.cardNumber}
                          onChange={(event) => setNewCard((prev) => ({ ...prev, cardNumber: event.target.value }))}
                          placeholder="Numero de tarjeta"
                          className="col-span-2 rounded-xl border border-[#e5dcfb] px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          value={newCard.expMonth}
                          onChange={(event) => setNewCard((prev) => ({ ...prev, expMonth: event.target.value }))}
                          placeholder="Mes (MM)"
                          className="rounded-xl border border-[#e5dcfb] px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          value={newCard.expYear}
                          onChange={(event) => setNewCard((prev) => ({ ...prev, expYear: event.target.value }))}
                          placeholder="Anio (YY o YYYY)"
                          className="rounded-xl border border-[#e5dcfb] px-3 py-2 text-sm"
                        />
                        <input
                          type="password"
                          value={newCard.cvv}
                          onChange={(event) => setNewCard((prev) => ({ ...prev, cvv: event.target.value }))}
                          placeholder="CVV"
                          className="col-span-2 rounded-xl border border-[#e5dcfb] px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Resumen del pedido */}
                <div className="mt-6 rounded-2xl border border-[#ebe6f7] bg-[#faf7ff] p-4 text-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b83a6]">
                    Resumen del pedido
                  </p>
                  <div className="space-y-1 text-[#5b5866]">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.producto?.name || "Producto"} × {item.quantity}
                        </span>
                        <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-[#e8e3f5] pt-3">
                    {selectedAddress && (
                      <p className="mb-2 text-xs text-[#8b83a6]">
                        📍 {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}
                      </p>
                    )}
                    <div
                      className="flex items-center justify-between text-2xl text-[#231f20]"
                      style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                    >
                      <span>Total</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#ebe6f7] px-4 py-3 text-sm text-[#5b5866] transition hover:bg-[#faf7ff]"
                  >
                    <ArrowLeft size={15} /> Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={processingCheckout}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {processingCheckout ? "Procesando pedido..." : "Confirmar y pagar"}
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
