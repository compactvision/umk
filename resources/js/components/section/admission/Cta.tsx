import { Link } from "@inertiajs/react";

export default function Cta() {
  return (
    <section className="relative bg-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Carte 1 */}
          <article className="group relative h-[420px] overflow-hidden rounded-3xl shadow-sm ring-1 ring-slate-200">
            {/* Fond */}
            <img
              src="/assets/img/cta/cta_img1.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
            {/* Contenu */}
            <div className="absolute inset-0 p-6 sm:p-8 flex items-end">
              <div className="w-full rounded-2xl bg-white/85 backdrop-blur-md p-5 sm:p-6 shadow-[0_6px_30px_rgba(15,23,42,0.08)] transition group-hover:bg-white/90">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                  <img
                    src="/assets/img/icon/cta_icon_01.svg"
                    alt=""
                    className="h-6 w-6"
                  />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Coûts et aides financières
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">
                  Comprendre les frais de scolarité et les options d’aide
                  financière est essentiel pour bien planifier votre budget
                  étudiant.
                </p>

                <div className="mt-5">
                  <Link
                    href={route("dashboard.enrollments.index")}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600/10 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40"
                    aria-label="Postuler maintenant"
                  >
                    Postuler maintenant
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M13 5l7 7-7 7M20 12H4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Carte 2 */}
          <article className="group relative h-[420px] overflow-hidden rounded-3xl shadow-sm ring-1 ring-slate-200">
            {/* Fond */}
            <img
              src="/assets/img/cta/cta_img2.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
            {/* Contenu */}
            <div className="absolute inset-0 p-6 sm:p-8 flex items-end">
              <div className="w-full rounded-2xl bg-white/85 backdrop-blur-md p-5 sm:p-6 shadow-[0_6px_30px_rgba(15,23,42,0.08)] transition group-hover:bg-white/90">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
                  <img
                    src="/assets/img/icon/cta_icon_02.svg"
                    alt=""
                    className="h-6 w-6"
                  />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Visitez notre campus
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">
                  Découvrez notre environnement académique en personne et
                  appréciez un cadre d’études exceptionnel.
                </p>

                <div className="mt-5">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                    aria-label="Réserver une visite"
                  >
                    Réserver une visite
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M13 5l7 7-7 7M20 12H4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
