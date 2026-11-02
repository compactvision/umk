import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import { admissionFaculties, normalizeFacultyName } from '@/lib/admissions';
import { fields } from '@/lib/usk';
import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Building2, Check, Clock3, GraduationCap, Languages, Mail } from 'lucide-react';
import '../../../css/public-faculty.css';
type Faculty = { id: number; name: string; code: string; description?: string; duration_years?: number; levels: Level[] };
type Level = {
    id: number;
    title: string;
    code: string;
    description?: string;
    image?: string;
    detail?: { duration_years?: number; language?: string; illustration_image?: string; course_objective?: string };
};
type Related = { id: number; name: string; code: string };
const imageUrl = (value?: string) => (value ? (/^(https?:\/\/|\/)/.test(value) ? value : `/storage/${value}`) : '');
export default function FacultyShow({ faculty, otherFaculties = [] }: { faculty: Faculty; otherFaculties?: Related[] }) {
    const orientation = admissionFaculties.find((item) => normalizeFacultyName(faculty.name).includes(item.match));
    const image = `/assets/usk/${orientation?.image || fields.find((field) => normalizeFacultyName(faculty.name).includes(normalizeFacultyName(field.name)))?.image || 'academic.jpg'}`;
    const subtitle =
        faculty.description ||
        orientation?.description ||
        'Un parcours de savoir, de réflexion et d’engagement au sein de l’Université Simon Kimbangu.';
    return (
        <App>
            <div className="public-faculty">
                <header className="pf-hero">
                    <div className="usk-container">
                        <nav className="pf-breadcrumb" aria-label="Fil d’Ariane">
                            <Link href="/">Accueil</Link>
                            <span>/</span>
                            <Link href="/courses">Facultés & formations</Link>
                            <span>/</span>
                            <span>{faculty.code}</span>
                        </nav>
                        <div className="pf-hero-grid">
                            <div className="pf-hero-copy">
                                <span className="usk-eyebrow">UNIVERSITÉ SIMON KIMBANGU · FACULTÉ</span>
                                <h1>{faculty.name}</h1>
                                <p>{subtitle}</p>
                                <div className="usk-actions">
                                    <Link className="usk-button usk-button-gold" href="/admission">
                                        Préparer mon admission
                                        <ArrowUpRight size={18} />
                                    </Link>
                                    <a className="pf-explore" href="#formations">
                                        Explorer les parcours
                                        <ArrowDown size={16} />
                                    </a>
                                </div>
                                <div className="pf-hero-signature">
                                    <span>{faculty.code}</span>
                                    <span>SCIENCE · CONSCIENCE · VÉRITÉ</span>
                                </div>
                            </div>
                            <div className="pf-hero-photo">
                                <PublicImage src={image} alt={`La communauté universitaire de l’USK · ${faculty.name}`} fetchPriority="high" />
                                <span>
                                    <Building2 size={16} />
                                    Kinshasa · Université Simon Kimbangu
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <section className="pf-introduction usk-container">
                    <div>
                        <span className="usk-eyebrow">UN DOMAINE. DES PERSPECTIVES.</span>
                        <h2>
                            Apprendre pour
                            <br />
                            <em>trouver sa voie.</em>
                        </h2>
                    </div>
                    <div>
                        <p className="pf-lead">{orientation?.description || subtitle}</p>
                        {orientation && (
                            <p>
                                Vos centres d’intérêt : {orientation.interests} Ce domaine vous invite à approfondir vos connaissances et à construire
                                votre projet.
                            </p>
                        )}
                        <Link className="usk-link" href="/contact">
                            Échanger avec l’université
                            <ArrowUpRight size={16} />
                        </Link>
                    </div>
                </section>
                {orientation && (
                    <section className="pf-horizons usk-container" aria-labelledby="pf-horizons-title">
                        <div>
                            <span className="usk-eyebrow">CONSTRUIRE SON AVENIR</span>
                            <h2 id="pf-horizons-title">
                                Des horizons <em>à explorer.</em>
                            </h2>
                        </div>
                        <div className="pf-horizon-grid">
                            {orientation.opportunities.map((opportunity, index) => (
                                <article key={opportunity}>
                                    <span>0{index + 1}</span>
                                    <h3>{opportunity}</h3>
                                    <ArrowUpRight size={19} />
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                <section className="pf-programmes" id="formations">
                    <div className="usk-container">
                        <div className="pf-section-heading">
                            <div>
                                <span className="usk-eyebrow">LES CHEMINS DU SAVOIR</span>
                                <h2>
                                    Votre prochain <em>parcours.</em>
                                </h2>
                            </div>
                            <p>
                                Les formations actuellement disponibles
                                <br />
                                au sein de {faculty.name}.
                            </p>
                        </div>
                        {faculty.levels.length ? (
                            <div className="pf-programme-grid">
                                {faculty.levels.map((level) => (
                                    <Link className="pf-programme" href={`/course/${level.id}`} key={level.id}>
                                        <div className="pf-programme-image">
                                            <PublicImage
                                                src={imageUrl(level.image || level.detail?.illustration_image) || image}
                                                alt=""
                                                loading="lazy"
                                            />
                                            <span>{level.code}</span>
                                        </div>
                                        <div className="pf-programme-copy">
                                            <span className="usk-eyebrow">{faculty.code} · FORMATION</span>
                                            <h3>{level.title}</h3>
                                            {level.description && <p>{level.description}</p>}
                                            <div className="pf-programme-facts">
                                                {level.detail?.duration_years && (
                                                    <span>
                                                        <Clock3 size={14} />
                                                        {level.detail.duration_years} an{level.detail.duration_years > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {level.detail?.language && (
                                                    <span>
                                                        <Languages size={14} />
                                                        {level.detail.language}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="pf-programme-link">
                                                Découvrir le programme
                                                <ArrowUpRight size={18} />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="pf-programme-empty">
                                <GraduationCap size={37} strokeWidth={1.3} />
                                <div>
                                    <h3>Construisons votre projet ensemble.</h3>
                                    <p>
                                        Contactez le service des admissions pour connaître les niveaux proposés et les modalités d’accès de cette
                                        faculté.
                                    </p>
                                </div>
                                <Link className="usk-link" href="/contact">
                                    Nous contacter
                                    <ArrowUpRight size={18} />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
                <section className="pf-admission usk-container">
                    <div>
                        <span className="usk-eyebrow">DONNER SUITE À VOTRE AMBITION</span>
                        <h2>
                            Votre avenir
                            <br />
                            <em>commence ici.</em>
                        </h2>
                        <p>Préparez votre candidature avec les informations et l’accompagnement de l’université.</p>
                        <Link href="/admission" className="usk-button usk-button-green">
                            Découvrir les admissions
                            <ArrowUpRight size={18} />
                        </Link>
                    </div>
                    <ol>
                        <li>
                            <span>01</span>
                            <div>
                                <h3>Clarifiez votre parcours</h3>
                                <p>Choisissez votre domaine et faites confirmer votre niveau d’entrée auprès des admissions.</p>
                            </div>
                            <BookOpen size={22} strokeWidth={1.5} />
                        </li>
                        <li>
                            <span>02</span>
                            <div>
                                <h3>Préparez votre dossier</h3>
                                <p>Consultez les pièces demandées et les conditions applicables à votre candidature.</p>
                                <Link href="/admission#conditions">
                                    Voir les conditions
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                            <Check size={22} strokeWidth={1.5} />
                        </li>
                        <li>
                            <span>03</span>
                            <div>
                                <h3>Échangez avec l’USK</h3>
                                <p>Le service des admissions vous accompagne pour préciser les prochaines étapes.</p>
                                <Link href="/contact">
                                    Contacter le service
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                            <Mail size={22} strokeWidth={1.5} />
                        </li>
                    </ol>
                </section>
                {otherFaculties.length > 0 && (
                    <section className="pf-other">
                        <div className="usk-container">
                            <div className="pf-section-heading">
                                <div>
                                    <span className="usk-eyebrow">POURSUIVRE LA DÉCOUVERTE</span>
                                    <h2>
                                        D’autres voies <em>s’ouvrent à vous.</em>
                                    </h2>
                                </div>
                                <Link href="/courses" className="usk-link">
                                    Toutes les formations
                                    <ArrowRight size={17} />
                                </Link>
                            </div>
                            <div className="pf-other-grid">
                                {otherFaculties.map((other) => (
                                    <Link href={`/faculties/${other.id}`} key={other.id}>
                                        <span>{other.code}</span>
                                        <h3>{other.name}</h3>
                                        <ArrowUpRight size={20} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </App>
    );
}
