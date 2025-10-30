import React, { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeLink, setActiveLink] = useState(null);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail("");
    }
  };

  const BG = "/assets/img/bg/footer.jpg";

  return (
    <footer className="relative isolate mt-24 overflow-hidden">
      {/* Fond avec effets avancés */}
      <div className="absolute inset-0 -z-10">
        <img src={BG} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />
        
        {/* Éléments décoratifs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* CTA haut amélioré */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-1 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
          <div className="relative bg-slate-900/95 backdrop-blur-sm rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-75 animate-pulse"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                      <img
                        src="/assets/img/icon/calling-icon01.png"
                        alt=""
                        aria-hidden
                        className="h-7 w-7"
                      />
                    </span>
                    <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-white/20 shadow-xl">
                      <img
                        src="/assets/img/footer/footer-avatar.png"
                        alt="Conseiller académique"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Besoin d'aide pour votre orientation ?
                  </h3>
                  <p className="text-blue-100">
                    Profitez d'un entretien gratuit avec notre conseiller académique
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-end">
                <div className="text-center md:text-right">
                  <span className="block text-sm text-blue-200 mb-1">
                    Hotline disponible 24h/24
                  </span>
                  <a
                    href="tel:+24305550132"
                    className="inline-block text-2xl font-bold text-white hover:text-yellow-300 transition-colors duration-300"
                  >
                    +243&nbsp;(0)&nbsp;555-0132
                  </a>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
                  Prendre rendez-vous
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corps du footer amélioré */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 border-t border-slate-700/50 pt-12 sm:grid-cols-2 lg:grid-cols-6">
          {/* Col 1 : logo + adresse + réseaux */}
          <div className="sm:col-span-1 lg:col-span-2">
            <a href="#!" className="inline-flex items-center mb-6 group">
              <img
                src="/assets/img/logo/logo.png"
                alt="UMK"
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </a>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Université Moderne de Kinkole - Excellence académique et innovation pour former les leaders de demain.
            </p>
            
            <div className="mb-8">
              <div className="flex items-start gap-3 text-slate-300">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  <p>127, Quai des Martyrs Kinkole</p>
                  <p>Kinshasa, RDC</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">
                Suivez-nous
              </h4>
              <ul className="flex items-center gap-3">
                {/* Facebook */}
                <li>
                  <a
                    aria-label="Facebook"
                    href="#!"
                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-blue-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06C2 17.04 5.66 21.12 10.4 22v-7.02H7.9v-2.92h2.5V9.84c0-2.46 1.47-3.83 3.72-3.83 1.07 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.86h2.73l-.44 2.92h-2.29V22C18.34 21.12 22 17.04 22 12.06Z" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      Facebook
                    </span>
                  </a>
                </li>
                {/* X */}
                <li>
                  <a
                    aria-label="X"
                    href="#!"
                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M9.52 6.775 15.48 0h-1.41L8.9 5.883 4.764 0H0l6.247 8.895L0 16h1.412l5.462-6.212L11.236 16H16L9.522 6.775Zm-1.933 2.199-.633-.886L1.92 1.04H4.088l4.064 5.688.633.886 5.282 7.394h-2.168L7.589 8.974Z" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      X (Twitter)
                    </span>
                  </a>
                </li>
                {/* LinkedIn */}
                <li>
                  <a
                    aria-label="LinkedIn"
                    href="#!"
                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.45 20.45h-3.55v-5.45c0-1.3 0-2.95-1.8-2.95-1.8 0-2.05 1.4-2.05 2.85v5.55H9.5V9.5h3.4v1.49h.05c.47-.9 1.62-1.85 3.33-1.85 3.56 0 4.22 2.34 4.22 5.38v5.93ZM6.22 8.01H2.67V4.46h3.55v3.55ZM4.45 2.67a1.78 1.78 0 1 0 0 3.56 1.78 1.78 0 0 0 0-3.56ZM6.22 20.45H2.67V9.5h3.55v10.95Z" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      LinkedIn
                    </span>
                  </a>
                </li>
                {/* Instagram */}
                <li>
                  <a
                    aria-label="Instagram"
                    href="#!"
                    className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      Instagram
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-4">
                Newsletter
              </h4>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow hover:shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {subscribed ? "Inscrit !" : "S'abonner"}
                </button>
              </form>
            </div>
          </div>

          {/* Col 2 : Admissions */}
          <nav aria-label="Admissions" className="sm:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-blue-500 mr-3"></span>
              Admissions
            </h3>
            <ul className="space-y-3">
              {[
                "Procédure d'inscription",
                "Calendrier académique",
                "Démarches administratives",
                "Critères d'admission",
                "Frais de scolarité",
                "Bourses d'études",
              ].map((label, index) => (
                <li key={label}>
                  <a
                    href="#!"
                    className="group flex items-center text-slate-400 transition-all duration-300 hover:text-blue-400 hover:translate-x-1 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500"
                    onMouseEnter={() => setActiveLink(`admissions-${index}`)}
                    onMouseLeave={() => setActiveLink(null)}
                  >
                    <svg className={`w-4 h-4 mr-2 transition-all duration-300 ${activeLink === `admissions-${index}` ? 'text-blue-400 translate-x-1' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3 : Accès rapide */}
          <nav aria-label="Accès rapide" className="sm:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-purple-500 mr-3"></span>
              Accès rapide
            </h3>
            <ul className="space-y-3">
              {[
                "Presse & Médias",
                "Portail Alumni",
                "Lettres d'information",
                "Départements",
                "Annuaire",
                "Recrutement",
              ].map((label, index) => (
                <li key={label}>
                  <a
                    href="#!"
                    className="group flex items-center text-slate-400 transition-all duration-300 hover:text-purple-400 hover:translate-x-1 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-purple-500"
                    onMouseEnter={() => setActiveLink(`quick-${index}`)}
                    onMouseLeave={() => setActiveLink(null)}
                  >
                    <svg className={`w-4 h-4 mr-2 transition-all duration-300 ${activeLink === `quick-${index}` ? 'text-purple-400 translate-x-1' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 4 : Liens utiles */}
          <nav aria-label="Liens utiles" className="sm:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-green-500 mr-3"></span>
              Liens utiles
            </h3>
            <ul className="space-y-3">
              {[
                "Journées portes ouvertes",
                "École d'été",
                "ICCRIP 2024",
                "Forum WIC",
                "Débouchés professionnels",
                "Mentions légales",
              ].map((label, index) => (
                <li key={label}>
                  <a
                    href="#!"
                    className="group flex items-center text-slate-400 transition-all duration-300 hover:text-green-400 hover:translate-x-1 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-green-500"
                    onMouseEnter={() => setActiveLink(`useful-${index}`)}
                    onMouseLeave={() => setActiveLink(null)}
                  >
                    <svg className={`w-4 h-4 mr-2 transition-all duration-300 ${activeLink === `useful-${index}` ? 'text-green-400 translate-x-1' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 5 : Boutons d'action */}
          <div className="sm:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-yellow-500 mr-3"></span>
              Actions
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              {[
                { label: "S'inscrire", href: "#!", color: "blue" },
                { label: "Visiter", href: "#!", color: "purple" },
                { label: "Carrières", href: "#!", color: "green" },
                { label: "Contact", href: "#!", color: "yellow" },
              ].map((btn) => (
                <li key={btn.label}>
                  <a
                    href={btn.href}
                    className={`group relative flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 shadow-sm transition-all duration-300 hover:border-${btn.color}-500 hover:bg-${btn.color}-600/20 hover:text-${btn.color}-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-${btn.color}-500 overflow-hidden`}
                  >
                    <span className="relative z-10">{btn.label}</span>
                    <div className={`absolute inset-0 bg-gradient-to-r from-${btn.color}-600/20 to-${btn.color}-500/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300`}></div>
                  </a>
                </li>
              ))}
            </ul>

            {/* Badge de certification */}
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Certification ISO 9001</p>
                  <p className="text-xs text-slate-400">Qualité reconnue internationalement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bas de page amélioré */}
        <div className="mt-16 border-t border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-400">
              © 2025{" "}
              <a href="#!" className="font-semibold text-white hover:text-blue-400 transition-colors duration-300">
                UMK
              </a>
              . Tous droits réservés.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#!" className="text-sm text-slate-400 hover:text-white transition-colors duration-300">
                Politique de confidentialité
              </a>
              <a href="#!" className="text-sm text-slate-400 hover:text-white transition-colors duration-300">
                Conditions d'utilisation
              </a>
              <a href="#!" className="text-sm text-slate-400 hover:text-white transition-colors duration-300">
                Plan du site
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}