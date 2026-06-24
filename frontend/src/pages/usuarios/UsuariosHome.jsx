import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Gem, Search, SlidersHorizontal, Heart, ShoppingBag, Cookie } from "lucide-react";
import { addGuestItemFromProducto, getGuestCartCount } from "../../lib/guestCart";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import BannerSlider from "../../components/usuarios/BannerSlider";
import FooterUsuario from "../../components/usuarios/FooterUsuario";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getImagenUrl(producto) {
  const first = Array.isArray(producto.imagenes) ? producto.imagenes[0] : null;
  if (!first?.url) {
    return null;
  }

  return `${STATIC_BASE_URL}/uploads/${first.url}`;
}

function ProductPlaceholder({ name }) {
  return (
    <div className="relative h-64 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-white via-[#eefdfd] to-[#f7efff]">
      <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-[#38ddd6]/20 blur-2xl" />
      <div className="absolute -right-8 bottom-6 h-28 w-28 rounded-full bg-[#a01fd0]/20 blur-2xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#231f20]">
        <Gem size={28} />
        <span className="text-center px-6 text-base tracking-wide" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
          {name}
        </span>
      </div>
    </div>
  );
}

function ProductCard({ producto, onAddToCart, adding }) {
  const image = getImagenUrl(producto);
  const stock = Number(producto.stock || 0);
  const categoria = producto.subcategoria?.categoria?.name || "Colección";
  const subcategoria = producto.subcategoria?.name || "Pieza exclusiva";

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#e7e3f4] bg-white shadow-[0_28px_70px_-42px_rgba(113,70,196,0.35)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_32px_80px_-40px_rgba(113,70,196,0.45)]">
      <div className="relative p-3 pb-0">
        {image ? (
          <img
            src={image}
            alt={producto.name}
            className="h-72 w-full rounded-[1.6rem] object-cover"
          />
        ) : (
          <ProductPlaceholder name={producto.name} />
        )}
        <button
          type="button"
          className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-white/90 text-[#6a40d8] transition hover:scale-105 hover:bg-white"
        >
          <Heart size={16} />
        </button>
        <div className="absolute left-6 top-6 rounded-full border border-white/70 bg-[#231f20]/80 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
          {categoria}
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#7a52de]">{subcategoria}</p>
        <h3 className="mt-2 text-[1.9rem] leading-tight text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
          <Link to={`/producto/${producto.id}`} className="transition hover:text-[#6a40d8]">
            {producto.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-[#5e5b69]">{producto.description || "Diseño artesanal de acabado premium."}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-2xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
            {formatCurrency(producto.price)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stock > 0 ? "bg-[#e6fcfb] text-[#108e89]" : "bg-[#fde8f4] text-[#b02a75]"}`}>
            {stock > 0 ? "Disponible" : "Agotado"}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddToCart(producto)}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-4 py-2.5 text-sm font-medium text-white shadow-[0_18px_30px_-18px_rgba(122,82,222,0.8)] transition hover:opacity-95"
            disabled={stock <= 0 || adding}
          >
            {stock > 0 ? (adding ? "Agregando..." : "Agregar al carrito") : "Próximamente"}
          </button>
          <Link
            to={`/producto/${producto.id}`}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#e6e2f5] text-[#6a40d8] transition hover:bg-[#f6f2ff]"
            aria-label={`Ver detalle de ${producto.name}`}
          >
            <ShoppingBag size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function UsuariosHome() {
  const [productos, setProductos] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [sortBy, setSortBy] = useState("featured");
  const [cartCount, setCartCount] = useState(0);
  const [addingProductId, setAddingProductId] = useState(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoriaActiva]);

  useEffect(() => {
    const loadProductos = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/catalogo/productos/public`, {
          params: {
            page: currentPage,
            limit,
            search: search.trim() || undefined,
            categoria: categoriaActiva !== "Todas" ? categoriaActiva : undefined,
          },
        });
        const rows = response?.data?.data;
        setProductos(Array.isArray(rows) ? rows : []);
        setPagination(response?.data?.pagination || { total: 0, page: currentPage, limit, pages: 1 });
      } catch (_error) {
        setProductos([]);
        setPagination({ total: 0, page: 1, limit, pages: 1 });
        setLoadError("No se pudo cargar el catálogo desde la base de datos.");
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, [currentPage, limit, search, categoriaActiva]);

  useEffect(() => {
    setCartCount(getGuestCartCount());
  }, []);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("bora_cookie_consent");

    if (!cookieConsent) {
      setShowCookieBanner(true);
    }

  }, []);

  const handleAddToCart = (producto) => {
    try {
      setAddingProductId(producto.id);
      const next = addGuestItemFromProducto(producto, 1);
      setCartCount(next.itemCount || 0);
      toast.success("Producto agregado al carrito.");
    } catch (_error) {
      toast.error("No se pudo agregar el producto.");
    } finally {
      setAddingProductId(null);
    }
  };

  const categorias = useMemo(() => {
    const unique = new Set(
      productos
        .map((item) => item.subcategoria?.categoria?.name || item.subcategoria?.name)
        .filter(Boolean)
    );
    return ["Todas", ...Array.from(unique)];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    let items = productos.filter((item) => {
      const categoria = item.subcategoria?.categoria?.name || item.subcategoria?.name || "";
      const matchCategoria = categoriaActiva === "Todas" || categoria === categoriaActiva;

      return matchCategoria;
    });

    if (sortBy === "price-asc") {
      items = [...items].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sortBy === "price-desc") {
      items = [...items].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sortBy === "name") {
      items = [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
    }

    return items;
  }, [productos, search, categoriaActiva, sortBy]);

  const headerCategorias = categorias.filter((categoria) => categoria !== "Todas").slice(0, 4);

  const acceptCookies = () => {
    localStorage.setItem(
      "bora_cookie_consent",
      "accepted"
    );

    setShowCookieBanner(false);
  };


  const rejectCookies = () => {
    localStorage.setItem(
      "bora_cookie_consent",
      "rejected"
    );

    setShowCookieBanner(false);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarPublic
        active="catalogo"
        cartCount={cartCount}
        categories={headerCategorias}
        onSelectCategory={setCategoriaActiva}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <BannerSlider />

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#ebe6f7] bg-white/88 p-4 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.3)] backdrop-blur sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
            <label className="relative block">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a40d8]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca anillos, collares, aretes..."
                className="w-full rounded-xl border border-[#ebe6f7] bg-white px-10 py-3 text-sm text-[#231f20] outline-none ring-[#6a40d8] transition focus:ring"
              />
            </label>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-[#ebe6f7] bg-white px-3 py-3 text-sm text-[#231f20] outline-none ring-[#6a40d8] transition focus:ring"
            >
              <option value="featured">Orden destacado</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>

            <div className="inline-flex items-center gap-2 rounded-xl border border-[#daf8f6] bg-[#f1fffe] px-3 py-3 text-sm text-[#169b95]">
              <SlidersHorizontal size={16} />
              {Number(pagination.total || 0)} piezas
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categorias.map((categoria) => {
              const active = categoria === categoriaActiva;
              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setCategoriaActiva(categoria)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-[#6a40d8] bg-[#6a40d8] text-white shadow-[0_14px_24px_-18px_rgba(106,64,216,0.8)]" : "border-[#ebe6f7] bg-white text-[#555261] hover:border-[#cdbcf5] hover:bg-[#faf7ff]"}`}
                >
                  {categoria}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[440px] animate-pulse rounded-[2rem] border border-[#ece7f7] bg-white/80" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
            <p className="text-xl text-rose-800" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              {loadError}
            </p>
            <p className="mt-2 text-sm text-rose-700">Verifica que el backend esté en ejecución y vuelve a cargar la página.</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="rounded-[2rem] border border-[#ece7f7] bg-white p-10 text-center shadow-[0_25px_70px_-50px_rgba(70,40,160,0.25)]">
            <p className="text-xl text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              No hay productos en el catálogo de la base de datos.
            </p>
            <p className="mt-2 text-sm text-[#5e5b69]">Agrega o activa productos desde administración para mostrarlos aquí.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCart={handleAddToCart}
                  adding={addingProductId === producto.id}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#ebe6f7] bg-white/90 px-4 py-3 text-sm sm:flex-row">
              <p className="text-[#5e5b69]">
                Página {Number(pagination.page || 1)} de {Math.max(1, Number(pagination.pages || 1))}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={loading || Number(pagination.page || 1) <= 1}
                  className="rounded-lg border border-[#e6e2f5] bg-white px-3 py-1.5 text-xs font-semibold text-[#4f4b5f] transition hover:bg-[#f8f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(Math.max(1, Number(pagination.pages || 1)), prev + 1))}
                  disabled={loading || Number(pagination.page || 1) >= Math.max(1, Number(pagination.pages || 1))}
                  className="rounded-lg border border-[#e6e2f5] bg-white px-3 py-1.5 text-xs font-semibold text-[#4f4b5f] transition hover:bg-[#f8f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <FooterUsuario catalogPath="/" catalogLabel="Catálogo" />

      {showCookieBanner && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[95%] max-w-4xl -translate-x-1/2 rounded-[1.8rem] border border-[#e8e3f5] bg-white p-6 shadow-[0_35px_80px_-40px_rgba(70,40,160,0.45)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4 flex-1">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fdf4ff] text-[#9b24cf]">
                <Cookie size={22}/>
              </div>
              <div>
                <h3
                  className="text-xl text-[#231f20]"
                  style={{
                    fontFamily:
                    '"Cormorant Garamond", "Times New Roman", serif'
                  }}
                >
                  Uso de cookies
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#5b5866]">

                  Utilizamos cookies y tecnologías similares para mejorar
                  tu experiencia, recordar preferencias y analizar el uso
                  del sitio. Al continuar navegando aceptas nuestra política
                  de cookies.

                  {" "}

                  <Link
                    to="/privacidad"
                    className="text-[#6a40d8] underline hover:text-[#9b24cf]"
                  >
                    Ver política de privacidad
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={rejectCookies}
                className="rounded-xl border border-[#ebe6f7] px-5 py-2.5 text-sm text-[#5b5866] transition hover:bg-[#faf7ff]"
              >
                Rechazar
              </button>
              <button
                onClick={acceptCookies}
                className="rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default UsuariosHome;
