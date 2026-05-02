import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bannerService } from "../../api/bannerService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");

function toImageUrl(fileName) {
  if (!fileName) return null;
  return `${STATIC_BASE_URL}/uploads-banner/${fileName}`;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await bannerService.listPublic();
        setBanners(Array.isArray(rows) ? rows : []);
      } catch (_error) {
        setBanners([]);
      }
    };

    load();
  }, []);

  const safeBanners = useMemo(() => banners.filter((item) => Boolean(item?.imageUrl)), [banners]);

  useEffect(() => {
    if (safeBanners.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [safeBanners.length]);

  useEffect(() => {
    if (activeIndex >= safeBanners.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, safeBanners.length]);

  if (!safeBanners.length) {
    return null;
  }

  const current = safeBanners[activeIndex];
  const imageUrl = toImageUrl(current.imageUrl);

  return (
    <section className="relative mt-0 w-full overflow-hidden border-y border-[#ece7f7] bg-[#f4f0ff]">
      <div className="relative h-[210px] w-full sm:h-[260px] lg:h-[300px]">
        <div className="absolute inset-0">
          <img src={imageUrl || ""} alt="" className="h-full w-full object-cover blur-sm opacity-45" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,16,38,0.62)_0%,rgba(22,16,38,0.35)_45%,rgba(22,16,38,0.12)_100%)]" />
        </div>

        <img src={imageUrl || ""} alt={current.title || "Banner"} className="relative z-[1] h-full w-full object-contain" />

        <div className="absolute inset-0 z-[2] mx-auto flex h-full w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4dc9d]">Anuncio destacado</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl" style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}>
              {current.title}
            </h2>
            {current.description ? <p className="mt-2 text-sm text-white/90 sm:text-base">{current.description}</p> : null}
            {current.ctaLink && current.ctaText ? (
              <a
                href={current.ctaLink}
                className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#2a1c47] transition hover:bg-[#f3ecff]"
              >
                {current.ctaText}
              </a>
            ) : null}
          </div>
        </div>

        {safeBanners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + safeBanners.length) % safeBanners.length)}
              className="absolute left-2 top-1/2 z-[3] grid h-9 w-9 -translate-y-1/2 place-items-center bg-black/35 text-white transition hover:bg-black/55 sm:left-4"
              aria-label="Banner anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % safeBanners.length)}
              className="absolute right-2 top-1/2 z-[3] grid h-9 w-9 -translate-y-1/2 place-items-center bg-black/35 text-white transition hover:bg-black/55 sm:right-4"
              aria-label="Siguiente banner"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-3 left-1/2 z-[3] flex -translate-x-1/2 gap-1.5">
              {safeBanners.map((item, index) => (
                <button
                  key={item.id || index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 w-6 transition ${index === activeIndex ? "bg-white" : "bg-white/45"}`}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
