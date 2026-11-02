import { useInstitution } from '@/lib/useInstitution';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
export default function Footer() {
    const usk = useInstitution();
    const { publicSettings } = usePage<{ publicSettings?: { copyright_year: number; analytics_enabled: boolean } }>().props;
    return (
        <footer className="usk-footer">
            <div className="usk-container">
                <div className="usk-footer-top">
                    <p>
                        Le savoir nous rassemble.
                        <br />
                        <em>L’avenir se construit ensemble.</em>
                    </p>
                    <Link href="/admission" className="usk-button usk-button-gold">
                        Préparer mon admission <ArrowUpRight size={18} />
                    </Link>
                </div>
                <div className="usk-footer-grid">
                    <div>
                        <Link href="/" className="usk-brand">
                            <img src={usk.logo} width={52} height={52} alt="Logo USK" loading="lazy" />
                            <span>
                                Université<strong>Simon Kimbangu</strong>
                                <small>{usk.motto}</small>
                            </span>
                        </Link>
                        <p>Une communauté de savoir, de foi et d’engagement, au service de la société congolaise et du monde.</p>
                    </div>
                    <div>
                        <h3>Explorer l’USK</h3>
                        <Link href="/">Accueil</Link>
                        <Link href="/about">Notre université</Link>
                        <Link href="/courses">Facultés et formations</Link>
                        <Link href="/blog">Actualités universitaires</Link>
                        <Link href="/contact">Venir nous rencontrer</Link>
                    </div>
                    <div>
                        <h3>Votre parcours</h3>
                        <Link href="/admission">Admissions</Link>
                        <Link href="/admission#frais">Frais académiques</Link>
                        <Link href="/login">Espace étudiant</Link>
                        <Link href="/plan-du-site">Plan du site</Link>
                    </div>
                    <div>
                        <h3>Restons en contact</h3>
                        <a href={`tel:${usk.phone.replaceAll(' ', '')}`}>
                            <Phone size={15} />
                            {usk.phone}
                        </a>
                        <a href={`mailto:${usk.email}`}>
                            <Mail size={15} />
                            {usk.email}
                        </a>
                        <p className="usk-contact-line">
                            <MapPin size={18} />
                            {usk.address}
                        </p>
                    </div>
                </div>
                <nav className="usk-legal-links" aria-label="Informations légales">
                    <Link href="/politique-de-confidentialite">Confidentialité</Link>
                    <Link href="/conditions-generales-utilisation">Conditions d’utilisation</Link>
                    <Link href="/mentions-legales">Mentions légales</Link>
                    <Link href="/politique-des-cookies">Cookies</Link>
                    <Link href="/conditions-inscription">Conditions d’inscription</Link>
                    <Link href="/accessibilite">Accessibilité</Link>
                    {publicSettings?.analytics_enabled && (
                        <button type="button" onClick={() => window.dispatchEvent(new Event('usk:cookie-settings'))}>
                            Gestion des cookies
                        </button>
                    )}
                </nav>
                <div className="usk-footer-bottom">
                    <span>© {publicSettings?.copyright_year ?? new Date().getFullYear()} Université Simon Kimbangu. Tous droits réservés.</span>
                    <span>Science. Conscience. Vérité.</span>
                </div>
            </div>
        </footer>
    );
}
