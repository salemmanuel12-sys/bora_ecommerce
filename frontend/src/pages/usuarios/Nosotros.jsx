import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gem, Sparkles, Heart, ChevronRight } from "lucide-react";
import nosotrosImg from "../../assets/nosotros.jpeg";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function Nosotros() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getGuestCartCount());
  }, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarPublic active="nosotros" cartCount={cartCount} />

      {/* Hero sección */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-[#e8e3f5] bg-white shadow-[0_35px_80px_-50px_rgba(70,40,160,0.35)]">
          <div className="grid lg:grid-cols-2">
            {/* Imagen */}
            <div className="relative h-80 lg:h-auto">
              <img
                src={nosotrosImg}
                alt="Bora Joyería — Nuestra historia"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 lg:to-transparent" />
            </div>

            {/* Texto */}
            <div className="relative flex flex-col justify-center overflow-hidden px-8 py-12 sm:px-12">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#38ddd6]/12 blur-3xl" />
              <div className="absolute -bottom-8 left-6 h-32 w-32 rounded-full bg-[#9b24cf]/10 blur-3xl" />
              <div className="relative">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#ebe4ff] bg-[#faf7ff] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6a40d8]">
                  <Gem size={14} />
                  Nuestra historia
                </p>
                <h2
                  className="mt-5 text-5xl leading-[0.95] text-[#231f20] sm:text-6xl"
                  style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                >
                  Hechas con pasión, llevadas con orgullo
                </h2>
                <p className="mt-5 text-sm leading-7 text-[#5b5866] sm:text-base">
                  Bora Joyería Artesanal nació de un amor profundo por los materiales y la identidad propia. Cada pieza es diseñada a mano con la intención de capturar momentos, emociones y personalidades únicas.
                </p>
                <p className="mt-4 text-sm leading-7 text-[#5b5866] sm:text-base">
                  Trabajamos con técnicas artesanales heredadas y materiales cuidadosamente seleccionados, combinando la tradición con una estética contemporánea que habla de quiénes somos.
                </p>
                <div className="mt-8">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full bg-[#231f20] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Ver catálogo
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#6a40d8]">Lo que nos define</p>
          <h2
            className="mt-4 text-4xl text-[#231f20] sm:text-5xl"
            style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
          >
            Nuestros valores
          </h2>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Gem size={24} />,
              color: "text-[#6a40d8]",
              bg: "bg-[#faf7ff]",
              border: "border-[#e8e3f5]",
              titulo: "Artesanía auténtica",
              desc: "Cada pieza es elaborada a mano por artesanas con años de experiencia, garantizando unicidad y calidad en cada detalle.",
            },
            {
              icon: <Heart size={24} />,
              color: "text-[#9b24cf]",
              bg: "bg-[#fdf4ff]",
              border: "border-[#f0d8fa]",
              titulo: "Con alma en cada pieza",
              desc: "Diseñamos joyería que cuenta historias. Cada colección nace de emociones reales, momentos vividos y sueños propios.",
            },
            {
              icon: <Sparkles size={24} />,
              color: "text-[#169b95]",
              bg: "bg-[#f1fffe]",
              border: "border-[#daf8f6]",
              titulo: "Estética contemporánea",
              desc: "Equilibramos la tradición artesanal con tendencias actuales, creando piezas modernas que permanecen atemporales.",
            },
          ].map(({ icon, color, bg, border, titulo, desc }) => (
            <div
              key={titulo}
              className={`rounded-[2rem] border ${border} ${bg} p-8 shadow-[0_28px_70px_-50px_rgba(70,40,160,0.2)]`}
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${border} bg-white ${color}`}>
                {icon}
              </div>
              <h3
                className="mt-5 text-2xl text-[#231f20]"
                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
              >
                {titulo}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5b5866]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-12 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#231f20] px-8 py-14 text-center text-white shadow-[0_35px_80px_-50px_rgba(0,0,0,0.5)] sm:px-12">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#38ddd6]/15 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-[#9b24cf]/20 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#38ddd6]">Bora Joyería</p>
            <h2
              className="mt-4 text-4xl leading-tight sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
            >
              Encuentra la pieza que te represente
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70">
              Explora nuestra colección artesanal o contáctanos para crear algo completamente único para ti.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(122,82,222,0.8)] transition hover:opacity-95"
              >
                Ver colección
                <ChevronRight size={16} />
              </Link>
              <Link
                to="/contacto"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FooterUsuario catalogPath="/" catalogLabel="Catalogo" />
    </main>
  );
}

export default Nosotros;
