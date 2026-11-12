import { useMemo, useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade, A11y, Keyboard } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

// ---------- Types ----------
type Slide = {
  img: string;           // image principale
  imgAlt: string;        // alt
  title: string;         // titre
  number: number;        // compteur cible (ex: 15 -> "15+")
  suffix?: string;       // suffix (ex: "+")
  kpi: string;           // ex: "Instituts de recherche"
  content: string;       // description
  accent?: "amber" | "yellow" | "orange" | "golden"; // thème de gradient
};

// ---------- Données ----------
const SLIDES: Slide[] = [
  {
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/ULPGL%20GOMA%2C%20Campus%20Mo%C3%AFse%20vue%20de%20devant.jpg?width=1600",
    imgAlt: "Campus universitaire à Goma (RDC)",
    title: "Excellence académique au cœur du Congo",
    number: 15,
    suffix: "+",
    kpi: "Instituts de recherche",
    content: "Des pôles d’excellence qui impulsent l’innovation et les solutions locales à fort impact.",
    accent: "amber",
  },
  {
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Halle%20de%20la%20Rawbank%20%C3%A0%20l%27Universit%C3%A8%20de%20Kinshasa.jpg?width=1600",
    imgAlt: "Hall académique de l’Université de Kinshasa",
    title: "Ressources documentaires & espaces d’apprentissage",
    number: 10,
    suffix: "+",
    kpi: "Bibliothèques & centres de ressources",
    content: "Des espaces modernes, accessibles et connectés pour soutenir la réussite étudiante.",
    accent: "yellow",
  },
  {
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Ista%20kinshasa%20batiment%20vodacom.jpg?width=1600",
    imgAlt: "Bâtiment d’ingénierie à Kinshasa (ISTA)",
    title: "Laboratoires & pratiques de pointe",
    number: 25,
    suffix: "+",
    kpi: "Laboratoires modernes",
    content: "Des environnements techniques pour expérimenter, prototyper et apprendre par la pratique.",
    accent: "orange",
  },
  {
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Secretary%20Blinken%20at%20MOU%20Signing%20Ceremony%20with%20Democratic%20Republic%20of%20the%20Congo%20Foreign%20Minister%20Lutundula%20and%20Zambian%20Foreign%20Minister%20Kakubo%20(52562579804).jpg?width=1600",
    imgAlt: "Cérémonie de signature avec la RDC",
    title: "Un réseau de partenariats internationaux",
    number: 50,
    suffix: "+",
    kpi: "Institutions partenaires",
    content: "Des collaborations qui ouvrent des passerelles pour la recherche et la mobilité.",
    accent: "golden",
  },
];

// ---------- Hooks ----------
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // easeInOutQuad
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useImageLoaded() {
  const [loaded, setLoaded] = useState(false);
  const onLoad = () => setLoaded(true);
  return { loaded, onLoad };
}

// ---------- Utils UI ----------
const GRADIENTS: Record<NonNullable<Slide["accent"]>, string> = {
  amber: "from-amber-400 via-yellow-400 to-orange-400",
  yellow: "from-yellow-300 via-amber-300 to-yellow-400",
  orange: "from-orange-400 via-amber-400 to-yellow-400",
  golden: "from-amber-500 via-yellow-500 to-amber-600",
};

// ✅ Fix: ajouter les variantes manquantes ici
const ringColor: Record<NonNullable<Slide["accent"]>, string> = {
  amber: "ring-amber-100",
  yellow: "ring-yellow-100",
  orange: "ring-orange-100",
  golden: "ring-amber-100",
};

const bgGradient: Record<NonNullable<Slide["accent"]>, string> = {
  amber: "bg-gradient-to-br from-amber-50 to-yellow-50",
  yellow: "bg-gradient-to-br from-yellow-50 to-amber-50",
  orange: "bg-gradient-to-br from-orange-50 to-amber-50",
  golden: "bg-gradient-to-br from-amber-50 to-yellow-50",
};

// ---------- Composant ----------
export default function Fanfact(): React.JSX.Element {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Pause autoplay au survol (UX ++)
  const onEnter = () => swiperRef.current?.autoplay?.stop();
  const onLeave = () => swiperRef.current?.autoplay?.start();

  // Diminuer les animations si l'OS le demande
  const prefersReduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-16 md:py-24">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Nos réalisations
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
            Chiffres clés de notre excellence
          </h2>
          <div className="mt-4 mx-auto h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
        </div>

        <div
          className={`
            rounded-[32px] p-[1.5px]
            bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-200
            shadow-2xl
          `}
        >
          <div
            className={`
              rounded-[32px] bg-white/95 backdrop-blur
              shadow-[0_20px_40px_-15px_rgba(251,191,36,0.25)]
              border border-amber-100/50
            `}
          >
            <Swiper
              modules={[Autoplay, Pagination, EffectFade, A11y, Keyboard]}
              onSwiper={(s) => (swiperRef.current = s)}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              slidesPerView={1}
              loop
              loopAdditionalSlides={2}
              speed={prefersReduced ? 0 : 600}
              keyboard={{ enabled: true }}
              autoplay={
                prefersReduced
                  ? false
                  : { delay: 5000, disableOnInteraction: false }
              }
              
              className="fanfact-swiper"
            >
              {SLIDES.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <div onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    <SlideCard slide={slide} isActive={activeIndex === idx} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Indicateurs de navigation personnalisés */}
        <div className="flex justify-center mt-8 gap-2">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => swiperRef.current?.slideTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? "w-8 bg-gradient-to-r from-amber-500 to-yellow-500" 
                  : "bg-amber-200 hover:bg-amber-300"
              }`}
              aria-label={`Aller à la slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Décors subtils */}
      <img
        src="/assets/img/shape/stamp.png"
        alt=""
        className="pointer-events-none absolute -left-10 -top-10 hidden h-44 w-44 opacity-15 md:block lg:h-56 lg:w-56"
      />
      <img
        src="/assets/img/shape/cap.png"
        alt=""
        className="pointer-events-none absolute -right-10 bottom-0 hidden h-44 w-44 opacity-15 md:block lg:h-56 lg:w-56"
      />

      {/* Styles fins pour la pagination et animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .fanfact-swiper .swiper-pagination-bullets {
          bottom: 18px;
        }
        .fanfact-swiper .swiper-pagination-bullet {
          width: 10px; height: 10px; margin: 4px;
          border-radius: 9999px;
          background: rgba(251,191,36,0.3);
          opacity: 1;
          transition: width .25s ease, height .25s ease, background .25s ease;
        }
        .fanfact-swiper .swiper-pagination-bullet-active {
          width: 22px; height: 10px; background: linear-gradient(to right, #f59e0b, #eab308);
        }
        @media (max-width: 640px) {
          .fanfact-swiper .swiper-pagination-bullets { bottom: 12px; }
        }
      `}</style>
    </section>
  );
}

// ---------- Carte de slide ----------
function SlideCard({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  const count = useCountUp(slide.number, 1000);
  const { loaded, onLoad } = useImageLoaded();

  const grad = GRADIENTS[slide.accent ?? "amber"];
  const ring = ringColor[slide.accent ?? "amber"];
  const bgGrad = bgGradient[slide.accent ?? "amber"];

  return (
    <div className={`grid items-stretch gap-8 p-8 sm:p-10 md:grid-cols-2 md:gap-12 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-2'}`}>
      {/* Visuel */}
      <div
        className={`
          relative overflow-hidden rounded-3xl border bg-gradient-to-br ${bgGrad}
          ${ring}
          border-amber-200/70
          ring-8
          shadow-[0_20px_40px_-15px_rgba(251,191,36,0.15)]
          group
        `}
      >
        {/* Squelette */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100" />
        )}

        {/* Image */}
        <img
          src={slide.img}
          alt={slide.imgAlt}
          onLoad={onLoad}
          className={`
            h-64 w-full object-contain p-6 transition-all duration-700
            md:h-full md:p-10
            group-hover:scale-[1.03] motion-reduce:transform-none
            ${loaded ? "opacity-100" : "opacity-0"}
          `}
          loading="eager"
        />

        {/* Halo dynamique */}
        <div
          className={`
            pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full
            bg-gradient-to-br ${grad} opacity-30 blur-2xl
            transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1
            motion-reduce:transition-none
          `}
        />

        {/* Badge de qualité */}
        <div className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Excellence
        </div>
      </div>

      {/* Contenu */}
      <div className="flex flex-col justify-center">
        <h2 className="text-balance text-2xl font-bold leading-snug text-gray-900 sm:text-3xl md:text-4xl">
          {slide.title}
        </h2>

        {/* KPI block */}
        <div className="mt-8 grid grid-cols-[auto,1fr] items-baseline gap-x-4 gap-y-1">
          <div
            className={`
              inline-flex items-center justify-center rounded-2xl
              bg-gradient-to-br ${grad} px-6 py-3
              text-3xl font-extrabold text-white shadow-lg
              motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-[1.05]
            `}
            aria-label={`${slide.number}${slide.suffix ?? ""} ${slide.kpi}`}
            role="status"
          >
            {count}
            {slide.suffix ?? ""}
          </div>

          <h3 className="text-xl font-semibold text-gray-800">
            {slide.kpi}
          </h3>

          <div />
          <p className="max-w-prose text-base leading-6 text-gray-600 md:text-lg">
            {slide.content}
          </p>
        </div>

        {/* Badges */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge label="Qualité académique" />
          <Badge label="Innovation" />
          <Badge label="Excellence" />
        </div>

        {/* Bouton d'action */}
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          En savoir plus
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full border
        border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700
        shadow-sm
      `}
    >
      {label}
    </span>
  );
}