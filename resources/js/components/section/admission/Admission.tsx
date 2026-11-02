import { Link } from "@inertiajs/react";

export default function Admission() {
  return (
    <section className="relative bg-gradient-to-b from-white to-slate-50/60">
      {/* décor haut doux */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-white/80 backdrop-blur-sm" />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* Col gauche : texte + CTA */}
          <div className="lg:col-span-5 xl:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Nos enseignants dévoués
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Vivez l’expérience USK avec une excellence académique et des opportunités infinies
            </h2>

            <p className="mt-4 text-slate-700">
              En tant qu’institution publique, l’Université Simon Kimbangu s’engage à favoriser des changements positifs à
              travers l’éducation. Nous sommes déterminés.
            </p>

            <div className="mt-8">
              <Link
                href={route("dashboard.enrollments.index")}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-amber-500/70 transition hover:bg-amber-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Postuler maintenant
                <span className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 21 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M10.48 21c-1.37 0-2.67-.246-3.884-.738A10.51 10.51 0 0 1 1.09 15.237 10.52 10.52 0 0 1 0 11.504h8.568v2.81c0 .26.093.486.278.677.185.192.407.287.667.287.137 0 .263-.027.38-.082.116-.055.215-.123.297-.206l3.822-3.814a1.03 1.03 0 0 0 0-1.354L10.19 6.009a.78.78 0 0 0-.677-.287.86.86 0 0 0-.678.687v2.128H0c.124-1.34.487-2.59 1.089-3.752A10.52 10.52 0 0 1 14.568.82 10.48 10.48 0 0 1 21 10.5 10.48 10.48 0 0 1 14.568 20.18 10.42 10.42 0 0 1 10.48 21Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Col droite : étapes */}
          <div className="lg:col-span-7 xl:col-span-6">
            <ol className="space-y-5">
              {/* Étape 1 */}
              <li className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                      <img
                        src="/assets/img/icon/am_01.svg"
                        alt="Créer un compte"
                        className="h-6 w-6"
                      />
                    </div>
                    <span className="pointer-events-none absolute -left-2 -top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                      1
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Créez votre compte
                    </h3>
                    <p className="mt-1 text-slate-600">
                      Ouvrez un compte étudiant avec votre adresse e-mail pour accéder à l’espace d’inscription et suivre votre dossier.
                    </p>
                  </div>
                </div>
              </li>

              {/* Étape 2 */}
              <li className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
                      <img
                        src="/assets/img/icon/am_02.svg"
                        alt="Accéder à la page d’inscription"
                        className="h-6 w-6"
                      />
                    </div>
                    <span className="pointer-events-none absolute -left-2 -top-2 rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                      2
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Accédez à la page d’inscription
                    </h3>
                    <p className="mt-1 text-slate-600">
                      Depuis votre tableau de bord, ouvrez “Inscription” pour démarrer votre demande et choisir la faculté, le niveau et l’année
                      académique.
                    </p>
                  </div>
                </div>
              </li>

              {/* Étape 3 */}
              <li className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                      <img
                        src="/assets/img/icon/am_03.svg"
                        alt="Remplir les formulaires & téléverser"
                        className="h-6 w-6"
                      />
                    </div>
                    <span className="pointer-events-none absolute -left-2 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                      3
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Remplissez les formulaires & téléversez les documents
                    </h3>
                    <p className="mt-1 text-slate-600">
                      Complétez les informations (personnelles & académiques), puis téléversez les pièces demandées (PDF/JPG/PNG). Validez — et
                      effectuez le paiement si nécessaire.
                    </p>
                  </div>
                </div>
              </li>
            </ol>

            {/* Note/astuce */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-amber-900">
              <p className="text-sm">
                Astuce : vous pouvez sauvegarder un <span className="font-semibold">brouillon</span> et reprendre votre inscription plus tard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Déco douce bas */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}
