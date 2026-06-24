import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gem, Mail, Clock, Send } from "lucide-react";
import { FaFacebookF, FaYoutube } from "react-icons/fa6";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function Contacto() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getGuestCartCount());
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Aquí conectarías con un servicio de email (EmailJS, backend, etc.)
    setEnviado(true);
    setForm({ nombre: "", email: "", mensaje: "" });
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">
      <NavbarPublic active="contacto" cartCount={cartCount} />

      {/* Header de página */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#231f20] px-8 py-14 text-center text-white shadow-[0_35px_80px_-50px_rgba(0,0,0,0.5)] sm:px-12">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#38ddd6]/15 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-[#9b24cf]/20 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#38ddd6]">
              <Mail size={14} />
              Estamos aquí para ti
            </p>
            <h2
              className="mt-5 text-5xl leading-[0.95] sm:text-6xl"
              style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
            >
              Hablemos
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70">
              Tienes una pregunta, una idea especial o quieres conocer más sobre nuestras piezas? Escríbenos y con gusto te atendemos.
            </p>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Info de contacto */}
          <div className="space-y-6">
            {/* Info cards */}
            {[
              {
                icon: <Mail size={22} />,
                color: "text-[#6a40d8]",
                bg: "bg-[#faf7ff]",
                border: "border-[#e8e3f5]",
                titulo: "Correo electrónico",
                contenido: "borajoyeria146@gmail.com",
                sub: "Respondemos en menos de 24 horas.",
              },
              {
                icon: <Clock size={22} />,
                color: "text-[#169b95]",
                bg: "bg-[#f1fffe]",
                border: "border-[#daf8f6]",
                titulo: "Horario de atención",
                contenido: "Lunes a Viernes",
                sub: "09:00 a 17:00 (hora Ciudad de México)",
              },
              {
                icon: <Gem size={22} />,
                color: "text-[#9b24cf]",
                bg: "bg-[#fdf4ff]",
                border: "border-[#f0d8fa]",
                titulo: "Pedidos especiales",
                contenido: "Diseño personalizado",
                sub: "Contáctanos para crear tu pieza exclusiva.",
              },
            ].map(({ icon, color, bg, border, titulo, contenido, sub }) => (
              <div key={titulo} className={`flex items-start gap-4 rounded-[1.5rem] border ${border} ${bg} p-6`}>
                <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${border} bg-white ${color}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#9b8fc0]">{titulo}</p>
                  <p
                    className="mt-1 text-xl text-[#231f20]"
                    style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                  >
                    {contenido}
                  </p>
                  <p className="mt-1 text-sm text-[#5b5866]">{sub}</p>
                </div>
              </div>
            ))}

            {/* Redes sociales */}
            <div className="rounded-[1.5rem] border border-[#e8e3f5] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(70,40,160,0.2)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#6a40d8]">Síguenos</p>
              <p
                className="mt-3 text-2xl text-[#231f20]"
                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
              >
                Inspírate en nuestras redes
              </p>
              <p className="mt-2 text-sm text-[#5b5866]">Encuentra nuestras piezas, novedades y estilo de vida en redes sociales.</p>
              <div className="mt-5 flex items-center gap-3">
                {[
                  
                  { label: "Facebook", href: "https://www.facebook.com/share/18ZdyWcick/", icon: <FaFacebookF className="h-5 w-5" />, bg: "bg-[#6a40d8]" },
                  { label: "YouTube", href: "https://youtube.com/@isaakyuniell?si=26UMxbtR650nWwVC", icon: <FaYoutube className="h-5 w-5" />, bg: "bg-[#9b24cf]" },
                  ,
                ].map(({ label, href, icon, bg }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[0_14px_24px_-18px_rgba(106,64,216,0.5)] transition hover:-translate-y-0.5 hover:opacity-90 ${bg}`}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="rounded-[2rem] border border-[#e8e3f5] bg-white p-8 shadow-[0_35px_80px_-50px_rgba(70,40,160,0.35)] sm:p-10">
            {enviado ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#e6fcfb] text-[#108e89]">
                  <Send size={28} />
                </div>
                <h3
                  className="mt-6 text-3xl text-[#231f20]"
                  style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                >
                  ¡Mensaje enviado!
                </h3>
                <p className="mt-3 text-sm text-[#5b5866]">Gracias por contactarnos. Te responderemos pronto.</p>
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="mt-8 rounded-full border border-[#ebe6f7] px-5 py-2.5 text-sm text-[#6a40d8] transition hover:bg-[#faf7ff]"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b24cf]">Formulario de contacto</p>
                <h3
                  className="mt-3 text-3xl text-[#231f20]"
                  style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
                >
                  Cuéntanos en qué te podemos ayudar
                </h3>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#8b7fa8]" htmlFor="nombre">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className="mt-2 w-full rounded-xl border border-[#ebe6f7] bg-[#faf7ff] px-4 py-3 text-sm text-[#231f20] outline-none ring-[#6a40d8] transition placeholder:text-[#bdb5d4] focus:ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#8b7fa8]" htmlFor="email">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="mt-2 w-full rounded-xl border border-[#ebe6f7] bg-[#faf7ff] px-4 py-3 text-sm text-[#231f20] outline-none ring-[#6a40d8] transition placeholder:text-[#bdb5d4] focus:ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[#8b7fa8]" htmlFor="mensaje">
                      Mensaje
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows={5}
                      required
                      value={form.mensaje}
                      onChange={handleChange}
                      placeholder="Escríbenos aquí tu mensaje, duda o pedido especial..."
                      className="mt-2 w-full resize-none rounded-xl border border-[#ebe6f7] bg-[#faf7ff] px-4 py-3 text-sm text-[#231f20] outline-none ring-[#6a40d8] transition placeholder:text-[#bdb5d4] focus:ring"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6a40d8] via-[#9b24cf] to-[#38ddd6] py-3.5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(122,82,222,0.8)] transition hover:opacity-95"
                  >
                    <Send size={16} />
                    Enviar mensaje
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <FooterUsuario catalogPath="/" catalogLabel="Catalogo" />
    </main>
  );
}

export default Contacto;
