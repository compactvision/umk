import React, { useEffect, useState } from "react";

/**
 * Preloader UMK — premium, fluide, accessible.
 * - Props:
 *   - minDuration: durée minimale d’affichage (ms)
 *   - logoSrc: chemin du logo
 *   - title: titre affiché
 *   - subtitle: sous-texte
 */
export default function Preloader({
  minDuration = 1800,
  logoSrc = "/assets/img/logo/logo.png",
  title = "UMK se prépare…",
  subtitle = "Chargement de votre expérience",
}: {
  minDuration?: number;
  logoSrc?: string;
  title?: string;
  subtitle?: string;
}) {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Durée minimale + on attend que la page soit (quasi) prête
    const minTimer = setTimeout(() => {
      setExiting(true);
      const offTimer = setTimeout(() => setMounted(false), 700); // durée du fade-out
      return () => clearTimeout(offTimer);
    }, minDuration);

    return () => clearTimeout(minTimer);
  }, [minDuration]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "transition-opacity duration-700 ease-out",
        exiting ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
    >
      {/* Fond dégradé clair */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-sky-50 to-white" />

      {/* Grille subtile */}
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Lueur diagonale */}
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-20 [background:radial-gradient(1200px_500px_at_10%_-10%,#4f46e5,transparent),radial-gradient(800px_400px_at_110%_10%,#06b6d4,transparent)] animate-[sheen_7s_ease-in-out_infinite]" />

      {/* Particules flottantes */}
      <Particles />

      {/* Contenu central */}
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Anneau + logo */}
        <div className="relative h-32 w-32 sm:h-36 sm:w-36">
          {/* Anneau statique (fond) */}
          <div className="absolute inset-0 rounded-full bg-slate-200/60 [mask:radial-gradient(farthest-side,transparent_70%,black_72%)]" />
          {/* Anneau conique animé */}
          <div className="absolute inset-0 rounded-full shadow-[0_8px_30px_rgba(15,23,42,0.12)] [background:conic-gradient(#4f46e5,#06b6d4,#4f46e5)] [mask:radial-gradient(farthest-side,transparent_calc(70%-3px),black_0)] animate-[spin_1.1s_linear_infinite]" />
          {/* Orbe en orbite */}
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-indigo-600 shadow-[0_0_0_6px_rgba(99,102,241,.15)] animate-[orbit_1.1s_linear_infinite]" />
          {/* Logo */}
          <div className="absolute inset-2 rounded-full bg-white/80 backdrop-blur-sm ring-1 ring-white/50 flex items-center justify-center">
            <img
              src={logoSrc}
              alt="Logo UMK"
              className="h-14 w-14 object-contain sm:h-16 sm:w-16 animate-[pop_600ms_cubic-bezier(.2,.9,.25,1.2)_both]"
            />
          </div>
        </div>

        {/* Titre + sous-titre */}
        <h1 className="mt-6 text-base font-semibold tracking-tight text-slate-800 sm:text-lg">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

        {/* Barre de progression indéterminée */}
        <div className="mt-6 h-2 w-64 max-w-full overflow-hidden rounded-full bg-slate-200 sm:h-2.5">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 animate-[progress_1.6s_ease-in-out_infinite]" />
        </div>

        {/* Astuce/qualité */}
        <p className="mt-3 text-[11px] uppercase tracking-[.16em] text-slate-400">
          Optimisation des ressources…
        </p>
      </div>

      {/* Styles additionnels (keyframes + accessibility) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orbit {
          from { transform: translate(-50%, 0) rotate(0deg) translateY(-4px); }
          to   { transform: translate(-50%, 0) rotate(360deg) translateY(-4px); }
        }
        @keyframes pop {
          0% { transform: scale(.85); opacity:.6; }
          60% { transform: scale(1.02); opacity:1; }
          100% { transform: scale(1); }
        }
        @keyframes sheen {
          0%, 100% { opacity:.18; }
          50% { opacity:.28; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0) translateX(0) scale(1); opacity:.75; }
          50% { transform: translateY(-10px) translateX(4px) scale(1.05); opacity:.95; }
        }
        @keyframes progress {
          0% { transform: translateX(-120%); }
          50% { transform: translateX(-20%); }
          100% { transform: translateX(120%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-[spin_1.1s_linear_infinite],
          .animate-[orbit_1.1s_linear_infinite],
          .animate-[progress_1.6s_ease-in-out_infinite],
          .animate-[sheen_7s_ease-in-out_infinite] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/** Petites particules décoratives flottantes */
function Particles() {
  // positions/délais pour 8 particules
  const ps = [
    { top: "12%", left: "18%", delay: "0s" },
    { top: "22%", left: "76%", delay: ".2s" },
    { top: "40%", left: "10%", delay: ".35s" },
    { top: "58%", left: "82%", delay: ".5s" },
    { top: "70%", left: "28%", delay: ".65s" },
    { top: "78%", left: "60%", delay: ".8s" },
    { top: "32%", left: "55%", delay: ".95s" },
    { top: "86%", left: "44%", delay: "1.1s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {ps.map((p, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full bg-sky-400/70 shadow-[0_0_0_6px_rgba(56,189,248,0.08)] animate-[float_4.5s_ease-in-out_infinite]"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay as any,
          }}
        />
      ))}
    </div>
  );
}
