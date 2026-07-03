import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa6";
import boraLogo from "../../assets/logoBueno.png";

function SocialIcon({ label, href, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-[#38ddd6]/50 hover:bg-white/15"
    >
      {children}
    </a>
  );
}

function FooterUsuario({ catalogPath = "/", catalogLabel = "Catálogo" }) {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#231f20] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-4">
            <img src={boraLogo} alt="Isaak Yuniell" className="h-16 w-16 rounded-full bg-white object-contain p-1" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#38ddd6]">Isaak Yuniell</p>
              <h2
                className="mt-1 text-3xl"
                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
              >
                Piezas con identidad propia
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
            Diseños artesanales con una mezcla de brillo contemporáneo, color y elegancia para quienes buscan joyería con carácter.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <SocialIcon label="Facebook" href="https://www.facebook.com/share/18ZdyWcick/">
              <FaFacebookF className="h-4 w-4" aria-hidden="true" />
            </SocialIcon>
            <SocialIcon label="YouTube" href="https://youtube.com/@isaakyuniell?si=26UMxbtR650nWwVC">
              <FaYoutube className="h-4 w-4" aria-hidden="true" />
            </SocialIcon>
            <SocialIcon label="TikTok" href="https://www.tiktok.com/@isaakyuniell">
              <FaTiktok className="h-4 w-4" aria-hidden="true" />
            </SocialIcon>
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b24cf]">Explora</p>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li>
              <Link to={catalogPath} className="transition hover:text-[#38ddd6]">
                {catalogLabel}
              </Link>
            </li>
            <li>
              <Link to="/nosotros" className="transition hover:text-[#38ddd6]">
                Nosotros
              </Link>
            </li>
            <li>
              <Link to="/contacto" className="transition hover:text-[#38ddd6]">
                Contacto
              </Link>
            </li>
            <li>
              <Link 
                to="/privacidad" 
                className="transition hover:text-[#38ddd6]"
              >
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#38ddd6]">Contacto</p>
          <div className="mt-5 space-y-4 text-sm text-white/75">
            <p>Facebook y YouTube como canales de inspiración y contacto.</p>
            <p>Horario de atención: Lunes a Viernes, 09:00 a 17:00.</p>
            <p className="text-white">borajoyeria146@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs uppercase tracking-[0.2em] text-white/45 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>Isaak Yuniell</span>
          <span>Diseño editorial para catálogo online</span>
        </div>
      </div>
    </footer>
  );
}

export default FooterUsuario;
