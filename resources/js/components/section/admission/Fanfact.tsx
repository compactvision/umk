export default function Fanfact() {
    return (
      <section className="relative overflow-hidden bg-slate-50">
        {/* Fond + overlay */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/assets/img/bg/fanfact_bg.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50/90 to-transparent" />
        </div>
  
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Nos chiffres clés
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Une communauté ambitieuse et soutenue
            </p>
          </div>
  
          <dl className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Carte 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <dt className="text-sm font-medium text-slate-600">
                Moyenne de la 1<sup>re</sup> année
              </dt>
              <dd className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  3.97
                </span>
                <span className="text-sm font-semibold uppercase text-indigo-600">
                  moyenne
                </span>
              </dd>
              <p className="mt-3 text-sm text-slate-600">
                La promotion de première année d’UMK affiche une moyenne record.
              </p>
            </div>
  
            {/* Carte 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <dt className="text-sm font-medium text-slate-600">Aides financières</dt>
              <dd className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  82%
                </span>
                <span className="text-sm font-semibold uppercase text-emerald-600">
                  aides
                </span>
              </dd>
              <p className="mt-3 text-sm text-slate-600">
                De nos étudiants en licence bénéficient d’un soutien financier.
              </p>
            </div>
  
            {/* Carte 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <dt className="text-sm font-medium text-slate-600">Diversité internationale</dt>
              <dd className="mt-3 flex items-baseline justify-center gap-2">
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  157
                </span>
                <span className="text-sm font-semibold uppercase text-sky-600">
                  pays
                </span>
              </dd>
              <p className="mt-3 text-sm text-slate-600">
                Représentation de 157 pays et de toutes les régions de France.
              </p>
            </div>
          </dl>
        </div>
      </section>
    );
  }
  