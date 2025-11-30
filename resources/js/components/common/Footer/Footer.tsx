import { Link, usePage } from '@inertiajs/react';
import { title } from 'process';
import { useState } from 'react';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeLink, setActiveLink] = useState(null);
    const { site } = usePage().props;

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubscribed(true);
                setEmail('');
                setTimeout(() => setSubscribed(false), 5000);
            } else {
                setError(data.message || 'Une erreur est survenue');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const BG = '/assets/img/bg/footer.jpg';

    const quickLinks = [
        {
            title: 'A propos',
            links: "/about"
        },
        {
            title: 'Contact',
            links: "/contact"
        },
        {
            title: 'Actualités',
            links: "/blog"
        },
        {
            title: 'Faculté',
            links: "/courses"
        }
    ]

    const admissions = [
        {
            title: 'Procedure d\'admission',
            links: '/admission'
        },
        {
            title: 'Frais de scolarité',
            links: '/tuitions'
        }
    ]

    return (
        <footer className="relative isolate mt-24 overflow-hidden">
            {/* Fond avec effets avancés */}
            <div className="absolute inset-0 -z-10">
                <img src={BG} alt="" aria-hidden className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95" />

                {/* Éléments décoratifs */}
                <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
                <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-indigo-500/10 blur-3xl"></div>
            </div>

            {/* CTA haut amélioré */}
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-1 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
                    <div className="relative rounded-3xl bg-slate-900/95 p-8 backdrop-blur-sm md:p-10">
                        <div className="grid items-center gap-8 md:grid-cols-2">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-75 blur"></div>
                                    <div className="relative flex items-center gap-3">
                                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                                            <img src="/assets/img/icon/calling-icon01.png" alt="" aria-hidden className="h-7 w-7" />
                                        </span>
                                        <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-xl ring-4 ring-white/20">
                                            <img
                                                src="/assets/img/footer/footer-avatar.png"
                                                alt="Conseiller académique"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-xl font-bold text-white">Besoin d'aide pour votre orientation ?</h3>
                                    <p className="text-blue-100">Profitez d'un entretien gratuit avec notre conseiller académique</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-end">
                                <div className="text-center md:text-right">
                                    <span className="mb-1 block text-sm text-blue-200">Hotline disponible 24h/24</span>
                                    <a
                                        href={`tel:${site.contactPhone}`}
                                        className="inline-block text-2xl font-bold text-white transition-colors duration-300 hover:text-yellow-300"
                                    >
                                        {site.contactPhone}
                                    </a>
                                </div>
                                <a
                                    href={`tel:${site.contactPhone}`}
                                    className="transform rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 inline-block text-center"
                                >
                                    Prendre rendez-vous
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Corps du footer amélioré */}
            <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 border-t border-slate-700/50 pt-12 sm:grid-cols-2 lg:grid-cols-6">
                    {/* Col 1 : logo + adresse + réseaux */}
                    <div className="sm:col-span-1 lg:col-span-2">
                        <a href="#!" className="group mb-6 inline-flex items-center">
                            <img
                                src={site.logoUrl ? `/storage/${site.logoUrl}` : '/assets/img/logo/logo.png'}
                                alt="UMK"
                                className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                            />
                        </a>
                        <p className="mb-6 leading-relaxed text-slate-300">{site.description}</p>

                        <div className="mb-8">
                            <div className="flex items-start gap-3 text-slate-300">
                                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    ></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <div>
                                    <p>
                                        {site.address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-semibold tracking-wide text-slate-300 uppercase">Suivez-nous</h4>
                            <ul className="flex items-center gap-3">
                                {/* Facebook */}
                                <li>
                                    <a
                                        aria-label="Facebook"
                                        href={site.socialLinks.facebook}
                                        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-blue-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06C2 17.04 5.66 21.12 10.4 22v-7.02H7.9v-2.92h2.5V9.84c0-2.46 1.47-3.83 3.72-3.83 1.07 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54v1.86h2.73l-.44 2.92h-2.29V22C18.34 21.12 22 17.04 22 12.06Z" />
                                        </svg>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            Facebook
                                        </span>
                                    </a>
                                </li>
                                {/* X */}
                                <li>
                                    <a
                                        aria-label="X"
                                        href={site.socialLinks.twitter}
                                        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M9.52 6.775 15.48 0h-1.41L8.9 5.883 4.764 0H0l6.247 8.895L0 16h1.412l5.462-6.212L11.236 16H16L9.522 6.775Zm-1.933 2.199-.633-.886L1.92 1.04H4.088l4.064 5.688.633.886 5.282 7.394h-2.168L7.589 8.974Z" />
                                        </svg>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            X (Twitter)
                                        </span>
                                    </a>
                                </li>
                                {/* LinkedIn */}
                                <li>
                                    <a
                                        aria-label="LinkedIn"
                                        href={site.socialLinks.linkedin}
                                        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-blue-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.45 20.45h-3.55v-5.45c0-1.3 0-2.95-1.8-2.95-1.8 0-2.05 1.4-2.05 2.85v5.55H9.5V9.5h3.4v1.49h.05c.47-.9 1.62-1.85 3.33-1.85 3.56 0 4.22 2.34 4.22 5.38v5.93ZM6.22 8.01H2.67V4.46h3.55v3.55ZM4.45 2.67a1.78 1.78 0 1 0 0 3.56 1.78 1.78 0 0 0 0-3.56ZM6.22 20.45H2.67V9.5h3.55v10.95Z" />
                                        </svg>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            LinkedIn
                                        </span>
                                    </a>
                                </li>
                                {/* Instagram */}
                                {/* <li>
                                    <a
                                        aria-label="Instagram"
                                        href="#!"
                                        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />
                                        </svg>
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 transform rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            Instagram
                                        </span>
                                    </a>
                                </li> */}
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="mt-8">
                            <h4 className="mb-4 text-sm font-semibold tracking-wide text-slate-300 uppercase">Newsletter</h4>
                            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Votre adresse email"
                                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                    disabled={loading}
                                />
                                {error && (
                                    <p className="text-red-400 text-xs">{error}</p>
                                )}
                                {subscribed && (
                                    <p className="text-green-400 text-xs">✓ Merci de vous être abonné !</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading || subscribed}
                                    className="transform rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Envoi...' : subscribed ? 'Inscrit !' : "S'abonner"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Col 2 : Admissions */}
                    <nav aria-label="Admissions" className="sm:col-span-1">
                        <h3 className="mb-6 flex items-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
                            <span className="mr-3 h-0.5 w-8 bg-blue-500"></span>
                            Admissions
                        </h3>
                        <ul className="space-y-3">
                            {admissions.map((label, index) => (
                                <li key={label}>
                                    <Link
                                        href={label.links}
                                        className="group flex items-center text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-blue-400 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-blue-500"
                                        onMouseEnter={() => setActiveLink(`admissions-${index}`)}
                                        onMouseLeave={() => setActiveLink(null)}
                                    >
                                        <svg
                                            className={`mr-2 h-4 w-4 transition-all duration-300 ${activeLink === `admissions-${index}` ? 'translate-x-1 text-blue-400' : 'text-slate-600'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                        {label.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Col 3 : Accès rapide */}
                    <nav aria-label="Accès rapide" className="sm:col-span-1">
                        <h3 className="mb-6 flex items-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
                            <span className="mr-3 h-0.5 w-8 bg-purple-500"></span>
                            Accès rapide
                        </h3>
                        <ul className="space-y-3">
                            {quickLinks.map(
                                (label, index) => (
                                    <li key={label}>
                                        <Link
                                            href={label.links}
                                            className="group flex items-center text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-purple-400 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-purple-500"
                                            onMouseEnter={() => setActiveLink(`quick-${index}`)}
                                            onMouseLeave={() => setActiveLink(null)}
                                        >
                                            <svg
                                                className={`mr-2 h-4 w-4 transition-all duration-300 ${activeLink === `quick-${index}` ? 'translate-x-1 text-purple-400' : 'text-slate-600'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                            {label.title}
                                        </Link>
                                    </li>
                                ),
                            )}
                        </ul>
                    </nav>

                    {/* Col 4 : Liens utiles */}
                    {/* <nav aria-label="Liens utiles" className="sm:col-span-1">
                        <h3 className="mb-6 flex items-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
                            <span className="mr-3 h-0.5 w-8 bg-green-500"></span>
                            Liens utiles
                        </h3>
                        <ul className="space-y-3">
                            {[
                                'Journées portes ouvertes',
                                "École d'été",
                                'ICCRIP 2024',
                                'Forum WIC',
                                'Débouchés professionnels',
                                'Mentions légales',
                            ].map((label, index) => (
                                <li key={label}>
                                    <a
                                        href="#!"
                                        className="group flex items-center text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-green-400 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-green-500"
                                        onMouseEnter={() => setActiveLink(`useful-${index}`)}
                                        onMouseLeave={() => setActiveLink(null)}
                                    >
                                        <svg
                                            className={`mr-2 h-4 w-4 transition-all duration-300 ${activeLink === `useful-${index}` ? 'translate-x-1 text-green-400' : 'text-slate-600'}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav> */}

                    {/* Col 5 : Boutons d'action */}
                    <div className="sm:col-span-1">
                        <h3 className="mb-6 flex items-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
                            <span className="mr-3 h-0.5 w-8 bg-yellow-500"></span>
                            Actions
                        </h3>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                            {[
                                { label: "S'inscrire", href: '/admission', color: 'blue' },
                                { label: 'Visiter', href: '/about', color: 'purple' },
                                { label: 'Contact', href: '/contact', color: 'yellow' },
                            ].map((btn) => (
                                <li key={btn.label}>
                                    <Link
                                        href={btn.href}
                                        className={`group relative flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 shadow-sm transition-all duration-300 hover:border-${btn.color}-500 hover:bg-${btn.color}-600/20 hover:text-${btn.color}-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-${btn.color}-500 overflow-hidden`}
                                    >
                                        <span className="relative z-10">{btn.label}</span>
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-r from-${btn.color}-600/20 to-${btn.color}-500/20 -translate-x-full transform transition-transform duration-300 group-hover:translate-x-0`}
                                        ></div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bas de page amélioré */}
                <div className="mt-16 border-t border-slate-700/50 pt-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <p className="text-sm text-slate-400">
                            © {new Date().getFullYear()}{' '}
                            <a href="#!" className="font-semibold text-white transition-colors duration-300 hover:text-blue-400">
                                UMK
                            </a>
                            . Tous droits réservés.
                        </p>

                        <div className="flex items-center gap-6">
                            <Link href="/politique" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">
                                Politique de confidentialité
                            </Link>
                            <Link href="/condition" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">
                                Conditions d'utilisation
                            </Link>
                            {/* <Link href="/plan" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">
                                Plan du site
                            </Link> */}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
