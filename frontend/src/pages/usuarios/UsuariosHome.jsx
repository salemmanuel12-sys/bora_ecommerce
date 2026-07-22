import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Gem, Search, SlidersHorizontal, Heart, ShoppingBag, Cookie, ChevronLeft, ChevronRight } from "lucide-react";
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

function getCategoryImageUrl(categoria) {
  const imageUrl = categoria?.imageUrl;
  if (!imageUrl) {
    return null;
  }

  const normalized = String(imageUrl).replace(/^\/+/, "");
  return `${STATIC_BASE_URL}/uploads/${normalized}`;
}

function CategoryCard({ categoria, active, onSelect }) {
  const image = getCategoryImageUrl(categoria);

  return (
    <button
      type="button"
      onClick={() => onSelect(categoria)}
      className={`group overflow-hidden rounded-[2rem] border bg-white text-left shadow-[0_24px_70px_-44px_rgba(70,40,160,0.35)] transition hover:-translate-y-1 hover:shadow-[0_32px_80px_-38px_rgba(70,40,160,0.45)] ${active ? "border-[#6a40d8]" : "border-[#ece7f7]"}`}
    >
      <div className="relative h-56 overflow-hidden">
        {image ? (
          <img src={image} alt={categoria.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8f4ff_0%,#edfdfa_100%)] text-[#231f20]">
            <div className="text-center">
              <Gem size={26} className="mx-auto text-[#6a40d8]" />
              <span className="mt-3 block px-6 text-base tracking-wide" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                {categoria.name}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1730]/90 via-[#1e1730]/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#f3e8ff]">Colección</p>
          <h3 className="mt-2 text-[1.5rem] text-white" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
            {categoria.name}
          </h3>
        </div>
      </div>
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-[#5e5b69]">{categoria.description || "Piezas exclusivas de diseño contemporáneo."}</p>
        <span className="text-sm font-semibold text-[#6a40d8]">{active ? "Explorando" : "Ver colección"}</span>
      </div>
    </button>
  );
}

function ProductCard({ producto, onAddToCart, adding }) {
  const image = getImagenUrl(producto);
  const stock = Number(producto.stock || 0);
  const categoria = producto.categoria?.name || "Colección";
  const subcategoria = producto.categoria?.name || "Pieza exclusiva";

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
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [sortBy, setSortBy] = useState("featured");
  const [cartCount, setCartCount] = useState(0);
  const [addingProductId, setAddingProductId] = useState(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [categoriasPagination, setCategoriasPagination] = useState({ total: 0, page: 1, limit: 6, pages: 1 });
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoria]);

  useEffect(() => {
    const loadCategorias = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/catalogo/categorias/public`, {
          params: {
            page: categoryPage,
            limit: 6,
          },
        });
        const rows = response?.data?.data;
        const nextCategorias = Array.isArray(rows) ? rows : [];
        setCategorias(nextCategorias);
        setCategoriasPagination(response?.data?.pagination || { total: 0, page: categoryPage, limit: 6, pages: 1 });
      } catch (_error) {
        setCategorias([]);
        setCategoriasPagination({ total: 0, page: 1, limit: 6, pages: 1 });
        setCategoriesError("No se pudieron cargar las colecciones.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategorias();
  }, [categoryPage]);

  useEffect(() => {
    const loadProductos = async () => {
      if (!selectedCategoria) {
        setProductos([]);
        setPagination({ total: 0, page: 1, limit, pages: 1 });
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/catalogo/productos/public`, {
          params: {
            page: currentPage,
            limit,
            search: search.trim() || undefined,
            categoriaId: selectedCategoria.id,
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
  }, [currentPage, limit, search, selectedCategoria]);

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

  const productosFiltrados = useMemo(() => {
    let items = [...productos];

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
  }, [productos, sortBy]);

  const headerCategorias = categorias.slice(0, 4).map((categoria) => categoria.name);

  const handleSelectCategory = (value) => {
    if (value === null || value === "") {
      setSelectedCategoria(null);
      return;
    }

    if (typeof value === "object" && value !== null) {
      setSelectedCategoria(value);
      return;
    }

    const numericValue = Number(value);
    if (Number.isInteger(numericValue) && numericValue > 0) {
      const matchById = categorias.find((categoria) => Number(categoria.id) === numericValue);
      setSelectedCategoria(matchById || null);
      return;
    }

    const match = categorias.find((categoria) => categoria.name === value || Number(categoria.id) === Number(value));
    setSelectedCategoria(match || null);
  };

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
        onSelectCategory={handleSelectCategory}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <BannerSlider />

      {!selectedCategoria && (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#ebe6f7] bg-white/88 p-4 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.3)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-[#7a52de]">Colecciones de lujo</p>
                <h2 className="mt-2 text-[2rem] text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                  Descubre piezas exclusivas por colección
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e5b69]">
                  Exploramos las colecciones más selectas de joyería fina, desde piezas de diario hasta diseños de alta ceremonia.
                </p>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-[2rem] border border-[#ece7f7] bg-white/80" />
                ))}
              </div>
            ) : categoriesError ? (
              <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                {categoriesError}
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {categorias.map((categoria) => (
                    <CategoryCard
                      key={categoria.id}
                      categoria={categoria}
                      active={false}
                      onSelect={handleSelectCategory}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[1.5rem] border border-[#ece7f7] bg-[#fcfbff] px-4 py-3 text-sm sm:flex-row">
                  <p className="text-[#5e5b69]">
                    Página {Number(categoriasPagination.page || 1)} de {Math.max(1, Number(categoriasPagination.pages || 1))}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={categoriesLoading || Number(categoriasPagination.page || 1) <= 1}
                      className="rounded-full border border-[#e6e2f5] bg-white p-2 text-[#4f4b5f] transition hover:bg-[#f8f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryPage((prev) => Math.min(Math.max(1, Number(categoriasPagination.pages || 1)), prev + 1))}
                      disabled={categoriesLoading || Number(categoriasPagination.page || 1) >= Math.max(1, Number(categoriasPagination.pages || 1))}
                      className="rounded-full border border-[#e6e2f5] bg-white p-2 text-[#4f4b5f] transition hover:bg-[#f8f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {selectedCategoria && (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-[#ece7f7] bg-white/80 p-6 shadow-[0_26px_70px_-44px_rgba(70,40,160,0.28)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#7a52de]">Colección seleccionada</p>
              <h3 className="mt-2 text-[1.8rem] text-[#231f20]" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
                {selectedCategoria.name}
              </h3>
              <p className="mt-2 text-sm text-[#5e5b69]">
                {selectedCategoria.description || "Explora esta colección especial y encuentra tus piezas favoritas."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategoria(null)}
              className="rounded-full border border-[#e7d8fb] bg-[#faf7ff] px-4 py-2 text-sm font-semibold text-[#6a40d8] transition hover:bg-[#f3ebff]"
            >
              Regresar a colecciones
            </button>
          </div>

          <div className="rounded-[2rem] border border-[#ebe6f7] bg-white/88 p-4 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.3)] backdrop-blur sm:p-6">
            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
              <label className="relative block">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a40d8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Busca por nombre..."
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
          </div>

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
      )}

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
