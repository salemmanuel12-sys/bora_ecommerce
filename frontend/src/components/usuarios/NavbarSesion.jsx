import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, CircleUserRound, LogOut, Menu, Search, ShoppingCart, X } from "lucide-react";
import boraLogo from "../../assets/logoBueno.png";
import { notificacionService } from "../../api/notificacionService";

function isActive(active, value) {
  return active === value;
}

function NavbarSesion({
  userName = "Cliente",
  cartCount = 0,
  active = "catalogo",
  categories = [],
  onSelectCategory,
  catalogPath = "/usuarios/home-sesion",
  onLogout,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openCatalogMenu, setOpenCatalogMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit?.();
  };

  const loadNotifications = useCallback(async () => {
    try {
      const result = await notificacionService.list({ page: 1, limit: 8 });
      const unreadOnly = (Array.isArray(result.data) ? result.data : []).filter((item) => !item.read);
      setNotifications(unreadOnly);
      setUnreadCount(Number(result.unreadCount || 0));
    } catch (_error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Polling liviano para mantener el contador actualizado solo cuando la pestaña está visible.
    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          loadNotifications();
        }
      }, 20000);
    };

    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadNotifications]);

  const handleMarkOneAsRead = async (id) => {
    try {
      await notificacionService.readOne(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_error) {
      // no-op
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionService.readAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (_error) {
      // no-op
    }
  };

  return (
    <>
      <section className="border-b border-[#ece7f7] bg-white text-[#231f20]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.22em] sm:px-6 lg:px-8">
          <span className="text-[#6a40d8]">Envío asegurado en todo México</span>
          <span className="hidden text-[#5b5866] sm:inline">Joyería artesanal con estética contemporánea</span>
        </div>
      </section>

      <nav className="sticky top-0 z-10 border-b border-[#ece7f7] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/usuarios/home-sesion" className="flex items-center gap-3">
            <img src={boraLogo} alt="Isaak Yuniell" className="h-20 w-20 rounded-full object-contain" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9b24cf]">Isaak Yuniell</p>
              <h1
                className="text-2xl leading-none"
                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
              >
                Catálogo
              </h1>
            </div>
          </Link>

          <div className="hidden gap-7 text-sm font-medium lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenCatalogMenu((prev) => !prev)}
                className={`inline-flex items-center gap-1 transition hover:text-[#6a40d8] ${active === "catalogo" || openCatalogMenu ? "font-semibold text-[#6a40d8]" : ""}`}
              >
                Catálogo
                <ChevronDown size={14} />
              </button>

              {openCatalogMenu && (
                <div className="absolute left-0 top-full z-20 mt-3 w-80 overflow-hidden rounded-2xl border border-[#ebe6f7] bg-white shadow-[0_30px_50px_-35px_rgba(70,40,160,0.45)]">
                  <div className="border-b border-[#f0ebfa] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b24cf]">
                      Categorías
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {categories.slice(0, 12).map((categoria) => (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => {
                          onSelectCategory?.(categoria);
                          setOpenCatalogMenu(false);
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#2f2a42] transition hover:bg-[#faf7ff] hover:text-[#6a40d8]"
                      >
                        {categoria}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[#f0ebfa] p-2">
                    <Link
                      to={catalogPath}
                      onClick={() => {
                        onSelectCategory?.(null);
                        setOpenCatalogMenu(false);
                      }}
                      className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#6a40d8] transition hover:bg-[#faf7ff]"
                    >
                      Más
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/nosotros"
              className={isActive(active, "nosotros") ? "font-semibold text-[#6a40d8]" : "transition hover:text-[#6a40d8]"}
            >
              Nosotros
            </Link>
            <Link
              to="/contacto"
              className={isActive(active, "contacto") ? "font-semibold text-[#6a40d8]" : "transition hover:text-[#6a40d8]"}
            >
              Contacto
            </Link>
          </div>

          <div className="ml-auto hidden items-center gap-2 sm:gap-3 md:flex">
            <form
              onSubmit={handleSearchSubmit}
              className="flex h-11 items-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-3 text-[#6a40d8]"
            >
              <Search size={15} />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Buscar producto"
                className="w-32 bg-transparent text-sm text-[#231f20] outline-none placeholder:text-[#8f8aa1] lg:w-44"
              />
            </form>

            <Link
              to="/carrito"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#e8e3f5] bg-white text-[#6a40d8] transition hover:border-[#cdbcf5] hover:bg-[#faf7ff]"
              aria-label="Ir al carrito"
            >
              <ShoppingCart size={17} />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#9b24cf] px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const next = !openNotifications;
                  setOpenNotifications(next);
                  setOpenMenu(false);
                  if (next) {
                    loadNotifications();
                  }
                }}
                className="relative grid h-11 w-11 place-items-center rounded-full border border-[#e8e3f5] bg-white text-[#6a40d8] transition hover:border-[#cdbcf5] hover:bg-[#faf7ff]"
                aria-label="Ver notificaciones"
              >
                <Bell size={17} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#9b24cf] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {openNotifications && (
                <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-[#ebe6f7] bg-white shadow-[0_30px_50px_-35px_rgba(70,40,160,0.45)]">
                  <div className="flex items-center justify-between border-b border-[#f0ebfa] px-4 py-3">
                    <p className="text-sm font-semibold text-[#231f20]">Notificaciones</p>
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-[#6a40d8] transition hover:text-[#9b24cf]"
                    >
                      Marcar todas
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-[#6b6680]">No tienes notificaciones sin leer.</p>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleMarkOneAsRead(item.id)}
                          className={`w-full border-b border-[#f6f2fc] px-4 py-3 text-left transition hover:bg-[#faf7ff] ${
                            item.read ? "bg-white" : "bg-[#f7f1ff]"
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9b24cf]">{item.type}</p>
                          <p className="mt-1 text-sm whitespace-pre-line text-[#3f3954]">{item.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((prev) => !prev);
                  setOpenNotifications(false);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-4 text-sm font-medium text-[#231f20] transition hover:border-[#cdbcf5] hover:bg-[#faf7ff]"
              >
                <CircleUserRound size={16} className="text-[#6a40d8]" />
                <span className="max-w-[120px] truncate">{userName}</span>
              </button>

              {openMenu && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[#ebe6f7] bg-white shadow-[0_30px_50px_-35px_rgba(70,40,160,0.45)]">
                  <div className="border-b border-[#f0ebfa] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b24cf]">
                    Mi cuenta
                  </div>
                  <Link
                    to="/usuarios/direcciones"
                    onClick={() => setOpenMenu(false)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#4f4b5f] transition hover:bg-[#faf7ff]"
                  >
                    Direcciones
                  </Link>
                  <Link
                    to="/usuarios/pagos"
                    onClick={() => setOpenMenu(false)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#4f4b5f] transition hover:bg-[#faf7ff]"
                  >
                    Pagos
                  </Link>
                  <Link
                    to="/usuarios/pedidos"
                    onClick={() => setOpenMenu(false)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#4f4b5f] transition hover:bg-[#faf7ff]"
                  >
                    Pedidos
                  </Link>
                  <div className="mx-3 border-t border-[#f0ebfa]" />
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[#4f4b5f] transition hover:bg-[#faf7ff]"
                  >
                    <LogOut size={15} className="text-[#9b24cf]" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Link
              to="/carrito"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#e8e3f5] bg-white text-[#6a40d8]"
              aria-label="Ir al carrito"
            >
              <ShoppingCart size={17} />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#9b24cf] px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpenMobileMenu((prev) => !prev);
                setOpenNotifications(false);
                setOpenMenu(false);
              }}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#e8e3f5] bg-white text-[#6a40d8]"
              aria-label="Abrir menú"
            >
              {openMobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {openMobileMenu ? (
          <div className="border-t border-[#ece7f7] bg-white px-4 py-4 md:hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="mb-3 flex h-11 items-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-3 text-[#6a40d8]"
            >
              <Search size={15} />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Buscar producto"
                className="w-full bg-transparent text-sm text-[#231f20] outline-none placeholder:text-[#8f8aa1]"
              />
            </form>

            <div className="grid gap-2 text-sm font-medium text-[#2f2a42]">
              <div className="rounded-lg border border-[#f0ebfa] bg-[#faf7ff] px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenCatalogMenu((prev) => !prev)}
                  className={`flex w-full items-center justify-between text-left font-medium ${active === "catalogo" || openCatalogMenu ? "text-[#6a40d8]" : "text-[#2f2a42]"}`}
                >
                  <span>Catálogo</span>
                  <ChevronDown size={14} className={openCatalogMenu ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
                {openCatalogMenu && (
                  <div className="mt-2 grid gap-1 border-t border-[#efe7fb] pt-2">
                    {categories.slice(0, 12).map((categoria) => (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => {
                          onSelectCategory?.(categoria);
                          setOpenMobileMenu(false);
                          setOpenCatalogMenu(false);
                        }}
                        className="rounded-lg px-2 py-2 text-left hover:bg-white"
                      >
                        {categoria}
                      </button>
                    ))}
                    <Link
                      to={catalogPath}
                      onClick={() => {
                        onSelectCategory?.(null);
                        setOpenMobileMenu(false);
                        setOpenCatalogMenu(false);
                      }}
                      className="rounded-lg px-2 py-2 font-semibold text-[#6a40d8] hover:bg-white"
                    >
                      Más
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/nosotros" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Nosotros
              </Link>
              <Link to="/contacto" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Contacto
              </Link>
              <Link to="/usuarios/pedidos" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Pedidos
              </Link>
              <Link to="/usuarios/direcciones" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Direcciones
              </Link>
              <Link to="/usuarios/pagos" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Pagos
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpenMobileMenu(false);
                onLogout?.();
              }}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-4 text-sm font-medium text-[#231f20]"
            >
              <LogOut size={15} className="text-[#9b24cf]" />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </nav>
    </>
  );
}

export default NavbarSesion;
