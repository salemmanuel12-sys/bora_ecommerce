import { useEffect, useState } from "react";
import { ShieldCheck, Lock, CreditCard, Mail, Cookie, UserRoundCheck } from "lucide-react";
import NavbarPublic from "../../components/usuarios/NavbarPublic";
import FooterUsuario from "../../components/usuarios/FooterUsuario";
import { getGuestCartCount } from "../../lib/guestCart";

function Privacidad() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getGuestCartCount());
  }, []);

  const sections = [
    {
      icon: <ShieldCheck size={22} />,
      title: "Información que recopilamos",
      text:
        "En Bora Joyería podemos recopilar información personal como nombre, correo electrónico, teléfono y datos necesarios para procesar pedidos, responder consultas y brindar una mejor experiencia de compra."
    },
    {
      icon: <Lock size={22} />,
      title: "Protección de tus datos",
      text:
        "Nos comprometemos a proteger tu información mediante medidas de seguridad adecuadas. No vendemos ni compartimos tus datos personales con terceros ajenos al funcionamiento de nuestra tienda."
    },
    {
      icon: <CreditCard size={22} />,
      title: "Pagos y compras",
      text:
        "Los pagos pueden ser procesados mediante plataformas externas seguras. Bora Joyería no almacena información sensible como números completos de tarjetas bancarias."
    },
    {
      icon: <Cookie size={22} />,
      title: "Cookies",
      text:
        "Utilizamos cookies y tecnologías similares para mejorar la navegación, recordar preferencias y ofrecer una experiencia personalizada dentro del sitio."
    },
    {
      icon: <Mail size={22} />,
      title: "Contacto",
      text:
        "Si tienes preguntas sobre el manejo de tus datos personales puedes escribirnos a borajoyeria146@gmail.com."
    },
    {
        icon: <UserRoundCheck size={22} />,
        title: "Eliminación de datos personales",
        text:
            "Si deseas eliminar tus datos personales, puedes enviarnos una solicitud al correo borajoyeria146@gmail.com. También puedes eliminar la autorización de acceso desde la configuración de Facebook en la sección Apps y sitios web."
        },
  ];


  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_28%,#fbf7ff_64%,#ffffff_100%)] text-[#231f20]">

      <NavbarPublic 
        active="privacidad"
        cartCount={cartCount}
      />


      {/* Header */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#231f20] px-8 py-14 text-center text-white shadow-[0_35px_80px_-50px_rgba(0,0,0,0.5)] sm:px-12">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#38ddd6]/15 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-[#9b24cf]/20 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#38ddd6]">
              <ShieldCheck size={14}/>
              Tu información segura
            </p>
            <h2
              className="mt-5 text-5xl leading-[0.95] sm:text-6xl"
              style={{
                fontFamily:
                  '"Cormorant Garamond", "Times New Roman", serif'
              }}
            >
              Política de privacidad
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/70">
              Conoce cómo protegemos, usamos y administramos la información que compartes con nosotros.
            </p>
          </div>
        </div>
      </section>
      {/* Contenido */}
      <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#e8e3f5] bg-white p-8 shadow-[0_35px_80px_-50px_rgba(70,40,160,0.35)] sm:p-10">
          <p className="text-sm leading-7 text-[#5b5866]">
            En Bora Joyería valoramos la confianza de nuestros clientes.
            Esta política describe cómo recopilamos, utilizamos, protegemos y administramos
            la información proporcionada al navegar, realizar compras o interactuar con
            nuestros servicios digitales.

            Los datos personales serán utilizados únicamente para brindar atención,
            procesar pedidos, mejorar la experiencia dentro del sitio y mantener una
            comunicación adecuada con nuestros clientes.
          </p>
          <div className="mt-8 space-y-5">
            {sections.map((item)=>(     
              <div
                key={item.title}
                className="flex gap-4 rounded-[1.5rem] border border-[#e8e3f5] bg-[#faf7ff] p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#6a40d8] border border-[#ebe6f7]">
                  {item.icon}
                </div>
                <div>
                  <h3
                    className="text-xl text-[#231f20]"
                    style={{
                      fontFamily:
                      '"Cormorant Garamond", "Times New Roman", serif'
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5b5866]">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-[#daf8f6] bg-[#f1fffe] p-6">
            <h3
              className="text-2xl text-[#169b95]"
              style={{
                fontFamily:
                '"Cormorant Garamond", "Times New Roman", serif'
              }}
            >
              Actualización de esta política
            </h3>

            <p className="mt-2 text-sm text-[#5b5866]">
              Podemos actualizar esta política cuando sea necesario para mejorar
              nuestros procesos de seguridad y privacidad. Cualquier cambio será
              publicado dentro de esta misma página.
            </p>
          </div>
        </div>
      </section>

      <FooterUsuario 
        catalogPath="/"
        catalogLabel="Catalogo"
      />
    </main>
  );
}

export default Privacidad;