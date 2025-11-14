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
            Nos réalisations
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Des résultats qui inspirent confiance
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Carte 1 - Taux d'acceptation */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
            <dt className="text-sm font-medium text-slate-600">
              Taux d'acceptation
            </dt>
            <dd className="mt-3 flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                87%
              </span>
              <span className="text-sm font-semibold uppercase text-indigo-600">
                succès
              </span>
            </dd>
            <p className="mt-3 text-sm text-slate-600">
              Des candidatures complètes sont acceptées chaque semestre.
            </p>
          </div>

          {/* Carte 2 - Délai de traitement */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
            <dt className="text-sm font-medium text-slate-600">Délai de traitement</dt>
            <dd className="mt-3 flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                48h
              </span>
              <span className="text-sm font-semibold uppercase text-emerald-600">
                moyen
              </span>
            </dd>
            <p className="mt-3 text-sm text-slate-600">
              Temps moyen de traitement pour une candidature complète.
            </p>
          </div>

          {/* Carte 3 - Satisfaction étudiants */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
            <dt className="text-sm font-medium text-slate-600">Satisfaction étudiants</dt>
            <dd className="mt-3 flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                4.8
              </span>
              <span className="text-sm font-semibold uppercase text-sky-600">
                /5
              </span>
            </dd>
            <p className="mt-3 text-sm text-slate-600">
              Note moyenne de satisfaction pour notre processus d'inscription.
            </p>
          </div>
        </dl>

        {/* Section supplémentaire avec des statistiques plus détaillées */}
        <div className="mt-12 mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-slate-900">1,247</span>
              <span className="block text-sm text-slate-600 mt-1">Inscriptions cette année</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-slate-900">5</span>
              <span className="block text-sm text-slate-600 mt-1">Programmes disponibles</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-slate-900">98%</span>
              <span className="block text-sm text-slate-600 mt-1">Documents traités en ligne</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-slate-900">24/7</span>
              <span className="block text-sm text-slate-600 mt-1">Support disponible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}