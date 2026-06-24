import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleUserRound, Menu, Search, ShoppingCart, X } from "lucide-react";
import boraLogo from "../../assets/logo-isaak-yuniell.png";

function isActive(active, value) {
  return active === value;
}

function NavbarPublic({
  cartCount = 0,
  active = "catalogo",
  categories = [],
  onSelectCategory,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}) {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit?.();
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
          <Link to="/" className="flex items-center gap-3">
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
            {categories.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => onSelectCategory?.(categoria)}
                className="transition hover:text-[#6a40d8]"
              >
                {categoria}
              </button>
            ))}
            <Link
              to="/"
              className={isActive(active, "catalogo") ? "font-semibold text-[#6a40d8]" : "transition hover:text-[#6a40d8]"}
            >
              Catálogo
            </Link>
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
              onSubmit={handleSubmit}
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
            <Link
              to="/user"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-4 text-sm font-medium text-[#231f20] transition hover:border-[#cdbcf5] hover:bg-[#faf7ff]"
            >
              <CircleUserRound size={16} className="text-[#6a40d8]" />
              Iniciar sesión
            </Link>
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
              onClick={() => setOpenMobileMenu((prev) => !prev)}
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
              onSubmit={handleSubmit}
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
              <Link to="/" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Catálogo
              </Link>
              <Link to="/nosotros" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Nosotros
              </Link>
              <Link to="/contacto" onClick={() => setOpenMobileMenu(false)} className="rounded-lg px-3 py-2 hover:bg-[#faf7ff]">
                Contacto
              </Link>
              {categories.map((categoria) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(categoria);
                    setOpenMobileMenu(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left hover:bg-[#faf7ff]"
                >
                  {categoria}
                </button>
              ))}
            </div>

            <Link
              to="/user"
              onClick={() => setOpenMobileMenu(false)}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#e8e3f5] bg-white px-4 text-sm font-medium text-[#231f20]"
            >
              <CircleUserRound size={16} className="text-[#6a40d8]" />
              Iniciar sesión
            </Link>
          </div>
        ) : null}
      </nav>
    </>
  );
}

export default NavbarPublic;
