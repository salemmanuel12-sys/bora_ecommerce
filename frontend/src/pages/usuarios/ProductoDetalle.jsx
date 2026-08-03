import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Star, ZoomIn, ShoppingCart, ChevronLeft, Minus, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import NavbarSesion from "../../components/usuarios/NavbarSesion";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { productoDetalleService } from "../../api/productoDetalleService";
import { carritoService } from "../../api/carritoService";
import { addGuestItemFromProducto, getGuestCartCount } from "../../lib/guestCart";
import { formatTierLabel, normalizeMayoreoRows, resolveMayoreoPricing } from "../../lib/mayoreoPricing";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function toImageUrl(url) {
  if (!url) return null;
  return `${STATIC_BASE_URL}/uploads/${url}`;
}

function Stars({ value = 0, size = 18, onSelect, interactive = false }) {
  const rounded = Math.round(Number(value || 0));

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= rounded;
        const Component = interactive ? "button" : "span";

        return (
          <Component
            key={starValue}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onSelect?.(starValue) : undefined}
            className={interactive ? "transition hover:scale-110" : undefined}
          >
            <Star
              size={size}
              className={active ? "fill-[#f6b70a] text-[#f6b70a]" : "text-[#d4d0df]"}
            />
          </Component>
        );
      })}
    </div>
  );
}

function ProductoDetalle() {
  const { productoId } = useParams();
  const { user, logout } = useAuth();

  const [producto, setProducto] = useState(null);
  const [opiniones, setOpiniones] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomImageUrl, setZoomImageUrl] = useState("");

  const [myRating, setMyRating] = useState(5);
  const [myTitle, setMyTitle] = useState("");
  const [myComment, setMyComment] = useState("");
  const [savingOpinion, setSavingOpinion] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const roleValue = user?.rol ?? user?.role ?? user?.rolId ?? user?.ROL_ID;
  const isAdmin = Number(roleValue) === 1 || Number(roleValue) === 2;
  const isLoggedShopUser = Boolean(user && !isAdmin);

  const imagenes = useMemo(() => {
    const rows = Array.isArray(producto?.imagenes) ? [...producto.imagenes] : [];
    return rows.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
  }, [producto]);

  const selectedImage = imagenes[selectedImageIndex] || imagenes[0] || null;
  const maxStock = Math.max(0, Number(producto?.stock || 0));
  const mayoreoTiers = useMemo(
    () => normalizeMayoreoRows(producto?.descuentosMayoreo || []),
    [producto?.descuentosMayoreo]
  );
  const selectedPricing = useMemo(
    () => resolveMayoreoPricing(producto?.price, selectedQuantity, mayoreoTiers),
    [producto?.price, selectedQuantity, mayoreoTiers]
  );

  useEffect(() => {
    const loadDetalle = async () => {
      setLoading(true);
      setError("");

      try {
        const [prod, opinionsResult] = await Promise.all([
          productoDetalleService.getPublicById(productoId),
          productoDetalleService.listPublicOpiniones(productoId, { page: 1, limit: 20 }),
        ]);

        setProducto(prod);
        setOpiniones(opinionsResult.data || []);
        setSummary(opinionsResult.resumen || {
          averageRating: Number(prod?.averageRating || 0),
          totalRatings: Number(prod?.totalRatings || 0),
          distribution: [
            { stars: 5, count: 0 },
            { stars: 4, count: 0 },
            { stars: 3, count: 0 },
            { stars: 2, count: 0 },
            { stars: 1, count: 0 },
          ],
        });
        setSelectedQuantity(1);
      } catch (requestError) {
        setProducto(null);
        setOpiniones([]);
        setError(requestError?.response?.data?.message || "No se pudo cargar el detalle del producto.");
      } finally {
        setLoading(false);
      }
    };

    loadDetalle();
  }, [productoId]);

  useEffect(() => {
    const loadCartCount = async () => {
      if (isLoggedShopUser) {
        try {
          const cart = await carritoService.getCart();
          setCartCount(Number(cart?.itemCount || 0));
          return;
        } catch (_error) {
          setCartCount(0);
          return;
        }
      }

      setCartCount(getGuestCartCount());
    };

    loadCartCount();
  }, [isLoggedShopUser]);

  useEffect(() => {
    if (maxStock <= 0) {
      setSelectedQuantity(1);
      return;
    }

    setSelectedQuantity((prev) => Math.min(Math.max(1, prev), maxStock));
  }, [maxStock]);

  const handleAddToCart = async () => {
    if (!producto?.id) return;

    try {
      setAddingToCart(true);

      if (isLoggedShopUser) {
        const cart = await carritoService.addItem(producto.id, selectedQuantity);
        setCartCount(Number(cart?.itemCount || 0));
      } else {
        const next = addGuestItemFromProducto(producto, selectedQuantity);
        setCartCount(Number(next?.itemCount || 0));
      }

      toast.success("Producto agregado al carrito.");
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "No se pudo agregar el producto.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleEnviarOpinion = async (event) => {
    event.preventDefault();

    if (!isLoggedShopUser) {
      toast.error("Inicia sesión para calificar este producto.");
      return;
    }

    if (!myComment.trim() && !myTitle.trim()) {
      toast.error("Escribe al menos un título o comentario.");
      return;
    }

    try {
      setSavingOpinion(true);
      await productoDetalleService.upsertMiOpinion(productoId, {
        rating: myRating,
        title: myTitle.trim() || null,
        comment: myComment.trim() || null,
      });

      toast.success("Tu opinión fue enviada para revisión.");
      setMyTitle("");
      setMyComment("");

      const refreshed = await productoDetalleService.listPublicOpiniones(productoId, { page: 1, limit: 20 });
      setOpiniones(refreshed.data || []);
      setSummary(refreshed.resumen || summary);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "No se pudo guardar tu opinión.");
    } finally {
      setSavingOpinion(false);
    }
  };

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      {isLoggedShopUser ? (
        <NavbarSesion
          active="catalogo"
          userName={user?.nombre || "Cliente"}
          cartCount={cartCount}
          onLogout={logout}
          categories={[]}
        />
      ) : (
        <NavbarPublic active="catalogo" cartCount={cartCount} categories={[]} />
      )}

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to={isLoggedShopUser ? "/usuarios/home-sesion" : "/"}
          className="inline-flex items-center gap-2 rounded-full border border-[#e6e2f5] bg-white px-4 py-2 text-sm font-medium text-[#6a40d8] transition hover:bg-[#f7f2ff]"
        >
          <ChevronLeft size={16} />
          Volver al catálogo
        </Link>
      </section>

      <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="h-[450px] animate-pulse rounded-[2rem] border border-[#ece7f7] bg-white/80" />
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
            <p className="text-xl text-rose-800" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              {error}
            </p>
          </div>
        ) : !producto ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
            <p className="text-xl text-rose-800" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              Producto no encontrado.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-[#ebe6f7] bg-white p-4 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.35)] sm:p-6">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#f0ecfa] bg-[#faf9ff]">
                {selectedImage ? (
                  <button
                    type="button"
                    onClick={() => setZoomImageUrl(toImageUrl(selectedImage.url) || "")}
                    className="group relative block w-full"
                  >
                    <img
                      src={toImageUrl(selectedImage.url) || ""}
                      alt={producto.name}
                      className="h-[410px] w-full object-cover transition duration-300 group-hover:scale-125"
                    />
                    <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#4b3d74]">
                      <ZoomIn size={14} /> Zoom
                    </span>
                  </button>
                ) : (
                  <div className="grid h-[410px] place-items-center text-sm text-[#7a748d]">Sin imagen disponible</div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {imagenes.map((img, index) => {
                  const active = index === selectedImageIndex;
                  return (
                    <button
                      key={img.id || index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`overflow-hidden rounded-xl border transition ${active ? "border-[#6a40d8] ring-2 ring-[#d7c7ff]" : "border-[#ece7f7] hover:border-[#d5c8f5]"}`}
                    >
                      <img
                        src={toImageUrl(img.url) || ""}
                        alt={`${producto.name} ${index + 1}`}
                        className="h-20 w-full object-cover transition hover:scale-110"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#ebe6f7] bg-white p-6 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.35)] sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-[#7a52de]">
                {producto.categoria?.name || producto.subcategoria?.categoria?.name || "Colección"}
              </p>
              <h1 className="mt-2 text-5xl leading-[0.95] text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                {producto.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Stars value={summary.averageRating} size={20} />
                <span className="text-sm font-semibold text-[#4d4466]">
                  {Number(summary.averageRating || 0).toFixed(1)} de 5
                </span>
                <span className="rounded-full bg-[#f3efff] px-3 py-1 text-xs font-semibold text-[#6a40d8]">
                  {Number(summary.totalRatings || 0)} valoraciones
                </span>
              </div>

              <p className="mt-6 text-sm leading-7 text-[#5c5968]">
                {producto.description || "Pieza artesanal con acabados premium y diseño contemporáneo."}
              </p>

              {Array.isArray(producto.atributos) && producto.atributos.length > 0 ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Atributos</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {producto.atributos.map((item) => (
                      <div key={`${item.id || item.atributoId}-${item.valorId}`} className="rounded-2xl border border-[#ece7f7] bg-[#fcfbff] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f86a7]">
                          {item.atributo?.nombre || "Atributo"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#2d2641]">
                          {item.valor?.valor || "Sin valor"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(producto.peso !== null && producto.peso !== undefined)
              || (producto.alto !== null && producto.alto !== undefined)
              || (producto.ancho !== null && producto.ancho !== undefined)
              || (producto.largo !== null && producto.largo !== undefined) ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Dimensiones y peso</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {producto.peso !== null && producto.peso !== undefined ? (
                      <div className="rounded-2xl border border-[#ece7f7] bg-[#fcfbff] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f86a7]">Peso</p>
                        <p className="mt-1 text-sm font-semibold text-[#2d2641]">{Number(producto.peso).toFixed(2)} kg</p>
                      </div>
                    ) : null}
                    {producto.alto !== null && producto.alto !== undefined ? (
                      <div className="rounded-2xl border border-[#ece7f7] bg-[#fcfbff] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f86a7]">Alto</p>
                        <p className="mt-1 text-sm font-semibold text-[#2d2641]">{Number(producto.alto).toFixed(2)} cm</p>
                      </div>
                    ) : null}
                    {producto.ancho !== null && producto.ancho !== undefined ? (
                      <div className="rounded-2xl border border-[#ece7f7] bg-[#fcfbff] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f86a7]">Ancho</p>
                        <p className="mt-1 text-sm font-semibold text-[#2d2641]">{Number(producto.ancho).toFixed(2)} cm</p>
                      </div>
                    ) : null}
                    {producto.largo !== null && producto.largo !== undefined ? (
                      <div className="rounded-2xl border border-[#ece7f7] bg-[#fcfbff] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f86a7]">Largo</p>
                        <p className="mt-1 text-sm font-semibold text-[#2d2641]">{Number(producto.largo).toFixed(2)} cm</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Precio</p>
                  {selectedPricing.descuentoAplicado ? (
                    <>
                      <p className="mt-1 text-4xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                        {formatCurrency(selectedPricing.unitPrice)}
                      </p>
                      <p className="text-sm text-[#8b83a6] line-through">{formatCurrency(selectedPricing.basePrice)}</p>
                      <p className="text-xs font-semibold text-[#16786f]">Ahorro total: {formatCurrency(selectedPricing.ahorroTotal)}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-4xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                      {formatCurrency(producto.price)}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${Number(producto.stock || 0) > 0 ? "bg-[#e6fcfb] text-[#108e89]" : "bg-[#fde8f4] text-[#b02a75]"}`}>
                  {Number(producto.stock || 0) > 0 ? "Disponible" : "Agotado"}
                </span>
              </div>

              {mayoreoTiers.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-[#ece7f7] bg-[#fcfbff] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Precios por mayoreo</p>
                  <div className="mt-2 space-y-1 text-sm text-[#4d4466]">
                    {mayoreoTiers.map((tier) => (
                      <p key={`${tier.cantidadMin}-${tier.cantidadMax}-${tier.tipoDescuento}`}>
                        {formatTierLabel(tier)}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between rounded-xl border border-[#ece7f7] bg-[#fbf9ff] px-4 py-3">
                <span className="text-sm font-semibold text-[#4d4466]">Cantidad</span>
                <div className="inline-flex items-center rounded-full border border-[#e6e2f5] bg-white">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 text-[#6a40d8]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-sm font-medium">{selectedQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity((prev) => Math.min(maxStock || 1, prev + 1))}
                    className="px-3 py-2 text-[#6a40d8]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={Number(producto.stock || 0) <= 0 || addingToCart}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart size={16} />
                {Number(producto.stock || 0) > 0 ? (addingToCart ? "Agregando..." : "Agregar al carrito") : "Próximamente"}
              </button>
            </div>
          </div>
        )}
      </section>

      {!loading && !error && producto ? (
        <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-[#ebe6f7] bg-white p-6 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.3)] sm:p-8">
              <h2 className="text-3xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                Califica este producto
              </h2>
              <p className="mt-2 text-sm text-[#5f5b6f]">
                Tu valoración se muestra con estrellas y tu opinión pasa a revisión antes de publicarse.
              </p>

              {!isLoggedShopUser ? (
                <div className="mt-5 rounded-2xl border border-[#efe8ff] bg-[#faf7ff] p-4 text-sm text-[#57468a]">
                  Inicia sesión para enviar tu calificación y opinión.
                </div>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={handleEnviarOpinion}>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Tu calificación</label>
                    <Stars value={myRating} size={24} interactive onSelect={setMyRating} />
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Título</span>
                    <input
                      type="text"
                      value={myTitle}
                      onChange={(event) => setMyTitle(event.target.value)}
                      maxLength={150}
                      placeholder="Ejemplo: Excelente acabado"
                      className="w-full rounded-xl border border-[#ebe6f7] px-3 py-2.5 text-sm outline-none ring-[#6a40d8] transition focus:ring"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Opinión</span>
                    <textarea
                      value={myComment}
                      onChange={(event) => setMyComment(event.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="Comparte tu experiencia con esta pieza"
                      className="w-full rounded-xl border border-[#ebe6f7] px-3 py-2.5 text-sm outline-none ring-[#6a40d8] transition focus:ring"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={savingOpinion}
                    className="rounded-xl bg-[#231f20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingOpinion ? "Enviando..." : "Enviar opinión"}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-[2rem] border border-[#ebe6f7] bg-white p-6 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.3)] sm:p-8">
              <h2 className="text-3xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                Opiniones de usuarios
              </h2>

              <div className="mt-5 rounded-xl border border-[#ece7f7] bg-[#fcfbff] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8f86a7]">Distribución por estrellas</p>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(summary.distribution) ? summary.distribution : []).map((row) => {
                    const total = Number(summary.totalRatings || 0);
                    const count = Number(row.count || 0);
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={row.stars} className="grid grid-cols-[50px_1fr_74px] items-center gap-3">
                        <span className="text-sm font-semibold text-[#4f4768]">{row.stars}★</span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#ece7f7]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#f6b70a] to-[#ffd878]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-right text-xs font-semibold text-[#6d6488]">{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {opiniones.length === 0 ? (
                  <p className="rounded-xl border border-[#eee8ff] bg-[#faf7ff] p-4 text-sm text-[#5f5b6f]">
                    Aún no hay opiniones aprobadas para este producto.
                  </p>
                ) : (
                  opiniones.map((opinion) => (
                    <article key={opinion.id} className="rounded-xl border border-[#ece7f7] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#312845]">{opinion.usuario?.nombre || "Cliente"}</p>
                        <Stars value={opinion.rating} size={16} />
                      </div>
                      {opinion.title ? <p className="mt-2 text-sm font-semibold text-[#43395e]">{opinion.title}</p> : null}
                      {opinion.comment ? <p className="mt-1 text-sm leading-6 text-[#5f5b6f]">{opinion.comment}</p> : null}
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <FooterUsuario catalogPath={isLoggedShopUser ? "/usuarios/home-sesion" : "/"} catalogLabel="Catálogo" />

      {zoomImageUrl ? (
        <button
          type="button"
          onClick={() => setZoomImageUrl("")}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        >
          <img
            src={zoomImageUrl}
            alt="Zoom del producto"
            className="max-h-[92vh] max-w-[96vw] rounded-xl border border-white/20 shadow-2xl"
          />
        </button>
      ) : null}
    </main>
  );
}

export default ProductoDetalle;
