import React, { useEffect, useMemo, useRef, useState } from "react";

type Testimonial = {
  mainImg: string;
  thumbImg: string;
  quote: string;
  name: string;
  role: string;
};

const DATA: Testimonial[] = [
  {
    mainImg: "https://commons.wikimedia.org/wiki/Special:FilePath/ULPGL%20GOMA%2C%20Campus%20Mo%C3%AFse%20vue%20de%20devant.jpg?width=1600",
    thumbImg: "https://ui-avatars.com/api/?name=Prisca+Mbuyi&background=F59E0B&color=fff&size=128",
    quote:
      "À l’UMK, j’ai trouvé un encadrement sérieux et des pratiques de terrain adaptées aux réalités congolaises. Les stages m’ont donné une vraie confiance.",
    name: "Prisca Mbuyi",
    role: "Étudiante en Santé Publique",
  },
  {
    mainImg: "https://commons.wikimedia.org/wiki/Special:FilePath/Halle%20de%20la%20Rawbank%20%C3%A0%20l%27Universit%C3%A8%20de%20Kinshasa.jpg?width=1600",
    thumbImg: "https://ui-avatars.com/api/?name=Ars%C3%A8ne+Kabasele&background=EAB308&color=fff&size=128",
    quote:
      "Les bibliothèques et espaces de travail m’ont permis d’avancer vite sur mes projets. L’accès aux ressources locales et internationales est un atout énorme.",
    name: "Arsène Kabasele",
    role: "Master en Économie & Gestion",
  },
  {
    mainImg: "https://commons.wikimedia.org/wiki/Special:FilePath/Ista%20kinshasa%20batiment%20vodacom.jpg?width=1600",
    thumbImg: "https://ui-avatars.com/api/?name=Esther+Ilunga&background=D97706&color=fff&size=128",
    quote:
      "Les labos et les travaux pratiques m’ont vraiment fait progresser. On code, on prototype, on teste — c’est très concret et motivant.",
    name: "Esther Ilunga",
    role: "Licence en Informatique",
  },
  {
    mainImg: "https://commons.wikimedia.org/wiki/Special:FilePath/Secretary%20Blinken%20at%20MOU%20Signing%20Ceremony%20with%20Democratic%20Republic%20of%20the%20Congo%20Foreign%20Minister%20Lutundula%20and%20Zambian%20Foreign%20Minister%20Kakubo%20(52562579804).jpg?width=1600",
    thumbImg: "https://ui-avatars.com/api/?name=Pr+Jean+Kapinga&background=F59E0B&color=fff&size=128",
    quote:
      "Nos partenariats ouvrent des portes: mobilités, co-encadrements et projets appliqués au service du développement en RDC.",
    name: "Pr. Jean Kapinga",
    role: "Vice-Doyen à la Recherche",
  },
];


export default function Testimonial(): JSX.Element {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const offscreenRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  const total = DATA.length;
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // ------- Helpers
  const go = (n: number) => setActive((i) => (n + total) % total);
  const next = () => go(active + 1);
  const prev = () => go(active - 1);

  // Pré-charger l'image suivante pour adoucir la transition
  useEffect(() => {
    const nextIdx = (active + 1) % total;
    const img = new Image();
    img.src = DATA[nextIdx].mainImg;
  }, [active, total]);

  // Initialisation animation
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Autoplay + barre de progression
  useEffect(() => {
    if (reduced) return;
    let id: number | null = null;
    const run = () => {
      if (!playing || hoverRef.current || focusRef.current || offscreenRef.current) return;
      id = window.setTimeout(() => {
        next();
        animateProgress(); // relance l'anim
      }, 6000);
    };
    const animateProgress = () => {
      const el = progressRef.current;
      if (!el) return;
      el.style.transition = "none";
      el.style.width = "0%";
      // force reflow
      void el.offsetWidth;
      el.style.transition = "width 6s linear";
      el.style.width = playing && !hoverRef.current && !focusRef.current && !offscreenRef.current ? "100%" : "0%";
    };

    animateProgress();
    run();

    return () => {
      if (id) clearTimeout(id);
      const el = progressRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.width = "0%";
      }
    };
  }, [active, playing, reduced]);

  // Pause si la section sort de l'écran
  useEffect(() => {
    if (!sectionRef.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        offscreenRef.current = entries[0]?.intersectionRatio < 0.25;
      },
      { threshold: [0, 0.25, 1] }
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  // Scroll auto de la vignette active dans la vue
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const btn = track.querySelector<HTMLButtonElement>(`button[data-index="${active}"]`);
    if (!btn) return;
    const v = btn.getBoundingClientRect();
    const t = track.getBoundingClientRect();
    const vertical = window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
    if (vertical) {
      if (v.top < t.top || v.bottom > t.bottom) {
        track.scrollTo({ top: btn.offsetTop - track.clientHeight / 2 + btn.offsetHeight / 2, behavior: "smooth" });
      }
    } else {
      if (v.left < t.left || v.right > t.right) {
        track.scrollTo({ left: btn.offsetLeft - track.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
      }
    }
  }, [active]);

  // Clavier
  const onKey = (e: React.KeyboardEvent) => {
    if (["ArrowRight", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(total - 1);
    } else if (e.key === " ") {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  };

  // Gestes tactiles (swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    touch.current = { x: t0.clientX, y: t0.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = (e.changedTouches[0].clientX - touch.current.x);
    const dy = (e.changedTouches[0].clientY - touch.current.y);
    const dt = Date.now() - touch.current.t;
    touch.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && dt < 600) {
      dx < 0 ? next() : prev();
    }
  };

  const t = DATA[active];

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 md:py-32 overflow-hidden"
      aria-label="Témoignages"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        onKeyDown={onKey}
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
        onFocusCapture={() => (focusRef.current = true)}
        onBlurCapture={() => (focusRef.current = false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Témoignages étudiants"
      >
        {/* En-tête de section */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Témoignages
          </span>
          <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-yellow-600 bg-clip-text text-transparent">
            Ce que nos étudiants disent de nous
          </h2>
          <div className="mt-4 mx-auto h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full"></div>
        </div>

        {/* Conteneur principal avec espacement amélioré */}
        <div className="grid items-center gap-16 lg:gap-24 lg:grid-cols-2">
          {/* VISUEL + CONTROLES */}
          <div className={`relative order-2 select-none lg:order-1 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            {/* Container ratio pour éviter le layout shift */}
            <div
              className="relative w-full overflow-hidden rounded-3xl shadow-2xl md:aspect-[4/3] group"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              tabIndex={0}
              aria-live="polite"
              aria-atomic="true"
            >
              {/* Images avec transition améliorée */}
              {DATA.map((item, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
                  }`}
                >
                  <img
                    src={item.mainImg}
                    alt={`Portrait de ${item.name}`}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    style={{ backfaceVisibility: "hidden" }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                </div>
              ))}

              {/* Flèches (desktop) */}
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 md:flex">
                <button
                  type="button"
                  className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-yellow-600 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label="Précédent"
                  onClick={prev}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-yellow-600 shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label="Suivant"
                  onClick={next}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Barre de progression (autoplay) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0">
                <div className="mx-auto mb-4 h-1.5 w-10/12 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm">
                  <div
                    ref={progressRef}
                    className="h-full w-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600"
                    aria-hidden
                  />
                </div>
              </div>

              {/* Compteur & Play/Pause */}
              <div className="absolute left-4 top-4 flex items-center gap-3">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-sm font-semibold text-white">
                  {active + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white ring-1 ring-white/20 hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 transition-all duration-300"
                  aria-label={playing ? "Mettre en pause l'autoplay" : "Relancer l'autoplay"}
                >
                  {playing ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Vignettes (verticales dès lg) - Positionnement corrigé avec plus d'espace */}
            <div className="mt-8 flex items-center justify-center gap-4 lg:absolute lg:right-[-6rem] lg:top-1/2 lg:mt-0 lg:flex-col lg:-translate-y-1/2 lg:pl-8">
              <div
                ref={trackRef}
                className="flex max-h-[180px] gap-3 overflow-x-auto lg:max-h-[300px] lg:flex-col lg:overflow-y-auto
                           [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5
                           [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-indigo-300/60 hover:[&::-webkit-scrollbar-thumb]:bg-indigo-400/70"
                role="tablist"
                aria-label="Vignettes de témoignages"
              >
                {DATA.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    data-index={i}
                    role="tab"
                    aria-selected={active === i}
                    aria-label={`Afficher le témoignage de ${item.name}`}
                    onClick={() => setActive(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 transition-all duration-300
                                ${active === i ? "ring-amber-500 scale-110 shadow-lg" : "ring-transparent hover:ring-amber-300 hover:scale-105"}`}
                  >
                    <img
                      src={item.thumbImg}
                      alt={`Vignette ${item.name}`}
                      className={`h-full w-full object-cover transition duration-300 ${
                        active === i ? "scale-100 opacity-100" : "scale-[.95] opacity-80"
                      }`}
                      loading="lazy"
                    />
                    {active === i && (
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-white" aria-hidden />
                    )}
                  </button>
                ))}
              </div>

              {/* Up/Down desktop */}
              <div className="hidden flex-col gap-3 lg:flex">
                <button
                  type="button"
                  onClick={prev}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-yellow-600 shadow-md ring-1 ring-yellow-200 transition-all duration-300 hover:bg-yellow-50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label="Précédent"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="-rotate-90">
                    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-yellow-600 shadow-md ring-1 ring-yellow-200 transition-all duration-300 hover:bg-yellow-50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  aria-label="Suivant"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="rotate-90">
                    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* TEXTE - Espacement amélioré */}
          <div className={`order-1 lg:order-2 pl-0 lg:pl-8 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative rounded-3xl bg-gradient-to-br from-white to-indigo-50 p-8 shadow-xl md:p-10">
              {/* Icône de citation */}
              <div className="absolute -top-4 -left-4 hidden h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg md:flex">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Témoignage avec transition améliorée */}
              <div className="min-h-[200px]">
                {DATA.map((item, i) => (
                  <blockquote
                    key={i}
                    className={`text-lg leading-7 text-gray-700 transition-all duration-500 sm:text-xl sm:leading-8 md:text-2xl md:leading-9 ${
                      i === active ? "opacity-100 translate-y-0" : "pointer-events-none absolute -translate-y-4 opacity-0"
                    }`}
                  >
                    "{item.quote}"
                  </blockquote>
                ))}
              </div>

              {/* Informations sur l'auteur */}
              <div className="mt-8 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-yellow-100 shadow-md">
                  <img src={t.thumbImg} alt={`Avatar ${t.name}`} className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-yellow-600 font-medium">{t.role}</div>
                </div>
              </div>

              {/* Bullets mobile */}
              <div className="mt-8 flex justify-center gap-2 md:hidden">
                {DATA.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Aller au témoignage ${i + 1}`}
                    aria-current={active === i}
                    onClick={() => setActive(i)}
                    className={`h-2.5 rounded-full transition-all ${active === i ? "w-8 bg-gradient-to-r from-amber-500 to-yellow-600" : "w-2.5 bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            {/* Indicateurs de navigation */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={prev}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-yellow-600 shadow-md ring-1 ring-yellow-200 transition-all duration-300 hover:bg-yellow-50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 md:hidden"
                aria-label="Précédent"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-yellow-600 shadow-md ring-1 ring-yellow-200 transition-all duration-300 hover:bg-yellow-50 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 md:hidden"
                aria-label="Suivant"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">Utilisez les flèches du clavier ou la barre d'espace pour naviguer</p>
          </div>
        </div>
      </div>

      {/* Styles pour les animations de blob */}
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
      `}</style>
    </section>
  );
}