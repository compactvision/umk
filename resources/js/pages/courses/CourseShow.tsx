import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import { admissionFaculties, normalizeFacultyName } from '@/lib/admissions';
import { formatPrice, paymentCategories, paymentTotal } from '@/lib/levelPricing';
import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    Award,
    BookOpen,
    BriefcaseBusiness,
    Check,
    ClipboardCheck,
    Clock3,
    FileCheck2,
    FolderOpen,
    GraduationCap,
    Info,
    Languages,
    Mail,
    Target,
    UserRound,
} from 'lucide-react';
import '../../../css/public-course.css';
import '../../../css/public-faculty.css';
type Condition = { id: number; title: string; description?: string; section: string; is_required: boolean };
type Course = {
    id: number;
    title: string;
    description?: string;
    code: string;
    image?: string;
    faculty: { id: number; name: string; code?: string };
    admission_conditions?: Condition[];
    courses?: { id: number; title: string; code: string | null; credits: number; semester: number | null }[];
    detail?: {
        price?: string | number;
        price_foreign?: string | number;
        price_national_first?: string | number;
        price_national_second?: string | number;
        price_foreign_first?: string | number;
        price_foreign_second?: string | number;
        fees?: number;
        duration_years?: number;
        language?: string;
        courses_number?: number;
        credit_required?: number;
        has_certificate?: boolean;
        illustration_image?: string;
        course_objective?: string;
        options?: (string | { name?: string; title?: string; description?: string })[];
    };
};
type Related = { id: number; title: string; code: string; image?: string; faculty?: { name: string } };
const asset = (value?: string) => (value ? (/^(https?:\/\/|\/)/.test(value) ? value : `/storage/${value}`) : '');
const groups = [
    { id: 'personal_info', label: 'Votre dossier personnel', icon: UserRound },
    { id: 'academic_info', label: 'Votre parcours académique', icon: GraduationCap },
    { id: 'other', label: 'Les pièces complémentaires', icon: FolderOpen },
];
export default function CourseShow({ course, mayLike = [] }: { course: Course; mayLike?: Related[] }) {
    const detail = course.detail;
    const orientation = admissionFaculties.find((faculty) => normalizeFacultyName(course.faculty.name).includes(faculty.match));
    const fallbackImage = `/assets/usk/${orientation?.image || 'academic.jpg'}`;
    const image = asset(detail?.illustration_image || course.image) || fallbackImage;
    const conditions = course.admission_conditions || [];
    const subjects = course.courses ?? [];
    const options = detail?.options || [];
    const facts = [
        {
            label: 'Durée du parcours',
            value: detail?.duration_years ? `${detail.duration_years} an${detail.duration_years > 1 ? 's' : ''}` : 'À confirmer',
            icon: Clock3,
        },
        { label: 'Langue d’enseignement', value: detail?.language || 'À confirmer', icon: Languages },
        { label: 'Crédits requis', value: detail?.credit_required ? `${detail.credit_required} crédits` : 'À confirmer', icon: BookOpen },
        { label: 'Certification', value: detail?.has_certificate ? 'Prévue au programme' : 'Consulter les admissions', icon: Award },
    ];
    return (
        <App>
            <div className="public-course public-faculty">
                <header className="pc-hero">
                    <div className="usk-container">
                        <nav className="pf-breadcrumb" aria-label="Fil d’Ariane">
                            <Link href="/">Accueil</Link>
                            <span>/</span>
                            <Link href={`/faculties/${course.faculty.id}`}>{course.faculty.name}</Link>
                            <span>/</span>
                            <span>{course.code}</span>
                        </nav>
                        <div className="pc-hero-grid">
                            <div>
                                <span className="usk-eyebrow">{course.faculty.code || 'USK'} · FORMATION</span>
                                <h1>{course.title}</h1>
                                <p>
                                    {course.description ||
                                        'Développez vos connaissances et construisez votre projet au sein de l’Université Simon Kimbangu.'}
                                </p>
                                <div className="usk-actions">
                                    <Link className="usk-button usk-button-gold" href="/dashboard/enrollments/create">
                                        Commencer mon inscription
                                        <ArrowUpRight size={18} />
                                    </Link>
                                    <a href="#programme" className="pf-explore">
                                        Découvrir le programme
                                        <ArrowDown size={16} />
                                    </a>
                                </div>
                                <Link className="pc-faculty-link" href={`/faculties/${course.faculty.id}`}>
                                    <GraduationCap size={17} />
                                    {course.faculty.name}
                                    <ArrowUpRight size={15} />
                                </Link>
                            </div>
                            <div className="pc-hero-image">
                                <PublicImage src={image} alt={course.title} fetchPriority="high" />
                                <span>
                                    {course.code}
                                    <small>UNIVERSITÉ SIMON KIMBANGU</small>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="usk-container pc-layout">
                    <div className="pc-main">
                        <section className="pc-programme" id="programme">
                            <span className="usk-eyebrow">APPRENDRE. COMPRENDRE. AGIR.</span>
                            <h2>
                                Un parcours pour
                                <br />
                                <em>aller plus loin.</em>
                            </h2>
                            <p className="pc-lead">
                                {course.description ||
                                    orientation?.description ||
                                    'Le service des admissions vous accompagne pour découvrir ce programme et préciser votre projet de formation.'}
                            </p>
                            <div className="pc-facts">
                                {facts.map((fact) => (
                                    <div key={fact.label}>
                                        <fact.icon size={22} strokeWidth={1.5} />
                                        <span>{fact.label}</span>
                                        <strong>{fact.value}</strong>
                                    </div>
                                ))}
                            </div>
                            <article className="pc-objectives">
                                <div className="pc-section-label">
                                    <Target size={21} strokeWidth={1.5} />
                                    <h3>Les objectifs de la formation</h3>
                                </div>
                                <p>
                                    {detail?.course_objective ||
                                        'Contactez la faculté pour obtenir les objectifs pédagogiques et le contenu détaillé de ce niveau.'}
                                </p>
                                {subjects.length > 0 ? (
                                    <span className="pc-course-count">
                                        <BookOpen size={15} />
                                        {subjects.length} cours au programme
                                    </span>
                                ) : null}
                            </article>
                            {options.length > 0 && (
                                <article className="pc-opportunities">
                                    <div className="pc-section-label">
                                        <BriefcaseBusiness size={21} strokeWidth={1.5} />
                                        <h3>Les perspectives du parcours</h3>
                                    </div>
                                    <ul>
                                        {options.map((option, index) => (
                                            <li key={index}>
                                                <Check size={15} />
                                                <div>
                                                    <strong>{typeof option === 'string' ? option : option.name || option.title}</strong>
                                                    {typeof option !== 'string' && option.description && <p>{option.description}</p>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            )}
                        </section>
                        <section className="pc-curriculum" id="cours" aria-labelledby="curriculum-title">
                            <span className="usk-eyebrow">LE PROGRAMME EN DÉTAIL</span>
                            <h2 id="curriculum-title">
                                Les cours <em>du niveau.</em>
                            </h2>
                            <p className="pc-section-intro">Découvrez les matières et leur répartition par semestre.</p>
                            {subjects.length > 0 ? (
                                <>
                                    <div className="pc-curriculum-summary">
                                        <BookOpen size={18} aria-hidden="true" />
                                        <span>
                                            {subjects.length} cours · {subjects.reduce((total, subject) => total + Number(subject.credits), 0)}{' '}
                                            crédits au total
                                        </span>
                                    </div>
                                    {[1, 2, null].map((semester) => {
                                        const items = subjects.filter((subject) => subject.semester === semester);
                                        if (!items.length) return null;
                                        const label = semester === 1 ? '1er semestre' : semester === 2 ? '2e semestre' : 'Semestre à préciser';
                                        return (
                                            <article className="pc-semester" key={semester ?? 'unspecified'}>
                                                <header>
                                                    <h3>{label}</h3>
                                                    <span>{items.reduce((total, subject) => total + Number(subject.credits), 0)} crédits</span>
                                                </header>
                                                <ul>
                                                    {items.map((subject) => (
                                                        <li key={subject.id}>
                                                            <div>
                                                                {subject.code && <small>{subject.code}</small>}
                                                                <strong>{subject.title}</strong>
                                                            </div>
                                                            <span>
                                                                {subject.credits} crédit{Number(subject.credits) > 1 ? 's' : ''}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </article>
                                        );
                                    })}
                                </>
                            ) : (
                                <p className="pc-section-intro">Le détail des cours sera communiqué prochainement par la faculté.</p>
                            )}
                        </section>
                        <section className="pc-conditions" id="conditions">
                            <span className="usk-eyebrow">PRÉPARER VOTRE CANDIDATURE</span>
                            <h2>
                                Votre dossier,
                                <br />
                                <em>en toute clarté.</em>
                            </h2>
                            <p className="pc-section-intro">
                                Retrouvez les conditions et les pièces attendues pour ce niveau. Les modalités propres à votre situation sont à
                                confirmer auprès des admissions.
                            </p>
                            {conditions.length > 0 ? (
                                <div className="pc-condition-groups">
                                    {groups.map((group) => {
                                        const items = conditions.filter((condition) =>
                                            group.id === 'other'
                                                ? !['personal_info', 'academic_info'].includes(condition.section)
                                                : condition.section === group.id,
                                        );
                                        if (!items.length) return null;
                                        return (
                                            <section className="pc-condition-group" key={group.id}>
                                                <header>
                                                    <group.icon size={21} strokeWidth={1.5} />
                                                    <h3>{group.label}</h3>
                                                    <span>{items.length}</span>
                                                </header>
                                                <ul>
                                                    {items.map((condition) => (
                                                        <li key={condition.id}>
                                                            <FileCheck2 size={18} strokeWidth={1.4} />
                                                            <div>
                                                                <div className="pc-condition-title">
                                                                    <h4>{condition.title}</h4>
                                                                    <span className={condition.is_required ? 'is-required' : ''}>
                                                                        {condition.is_required ? 'Obligatoire' : 'Selon votre situation'}
                                                                    </span>
                                                                </div>
                                                                {condition.description && <p>{condition.description}</p>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="pc-admission-empty">
                                    <ClipboardCheck size={30} strokeWidth={1.3} />
                                    <h3>Préparez votre dossier avec les admissions.</h3>
                                    <p>Le service vous précisera les prérequis, les pièces à fournir et les modalités d’accès à ce programme.</p>
                                    <Link href="/admission#conditions" className="usk-link">
                                        Consulter les conditions générales
                                        <ArrowUpRight size={16} />
                                    </Link>
                                </div>
                            )}
                            <div className="pc-admission-note">
                                <Info size={18} />
                                <p>
                                    La création d’un dossier prépare votre candidature. L’admission est confirmée par l’université après vérification
                                    des pièces et des conditions d’accès.
                                </p>
                            </div>
                        </section>
                    </div>
                    <aside className="pc-sidebar">
                        <div className="pc-enroll-card">
                            <span className="usk-eyebrow">VOTRE PROCHAINE ÉTAPE</span>
                            <GraduationCap size={34} strokeWidth={1.3} />
                            <h2>
                                Donnez vie
                                <br />
                                <em>à votre projet.</em>
                            </h2>
                            <p>Rejoignez votre espace candidat pour commencer et suivre votre inscription.</p>
                            <div className="pc-tuition">
                                <span>Frais académiques</span>
                                <div className="pc-tuition-categories">
                                    {paymentCategories.map((category) => (
                                        <section className="pc-payment-category" key={category.total}>
                                            <h3>{category.label}</h3>
                                            <dl>
                                                <div>
                                                    <dt>1re tranche</dt>
                                                    <dd>{formatPrice(detail?.[category.first])}</dd>
                                                </div>
                                                <div>
                                                    <dt>2e tranche</dt>
                                                    <dd>{formatPrice(detail?.[category.second])}</dd>
                                                </div>
                                                <div className="pc-payment-total">
                                                    <dt>Total</dt>
                                                    <dd>
                                                        {formatPrice(
                                                            paymentTotal(
                                                                detail?.[category.first],
                                                                detail?.[category.second],
                                                                detail?.[category.total],
                                                            ),
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </section>
                                    ))}
                                </div>
                                {Number(detail?.fees) > 0 && <small>Frais complémentaires : {Number(detail?.fees).toLocaleString('fr-FR')} $</small>}
                                <Link href="/admission#frais">
                                    Consulter les modalités
                                    <ArrowUpRight size={13} />
                                </Link>
                            </div>
                            <Link className="usk-button usk-button-green" href="/dashboard/enrollments/create">
                                Commencer mon inscription
                                <ArrowUpRight size={17} />
                            </Link>
                            <a className="pc-checklist-link" href="#conditions">
                                Préparer mon dossier
                                <ArrowDown size={15} />
                            </a>
                            <Link className="pc-contact-link" href="/contact">
                                <Mail size={15} />
                                Une question ? Contactez-nous
                            </Link>
                        </div>
                        <Link href={`/faculties/${course.faculty.id}`} className="pc-back-faculty">
                            <BookOpen size={19} />
                            <span>
                                Découvrir la faculté<strong>{course.faculty.name}</strong>
                            </span>
                            <ArrowUpRight size={17} />
                        </Link>
                    </aside>
                </div>
                {mayLike.length > 0 && (
                    <section className="pf-other">
                        <div className="usk-container">
                            <div className="pf-section-heading">
                                <div>
                                    <span className="usk-eyebrow">POURSUIVRE VOTRE EXPLORATION</span>
                                    <h2>
                                        D’autres parcours <em>à découvrir.</em>
                                    </h2>
                                </div>
                                <Link href="/courses" className="usk-link">
                                    Toutes les formations
                                    <ArrowRight size={17} />
                                </Link>
                            </div>
                            <div className="pc-related">
                                {mayLike.map((related) => (
                                    <Link href={`/course/${related.id}`} key={related.id}>
                                        <span>{related.code}</span>
                                        <h3>{related.title}</h3>
                                        <p>{related.faculty?.name}</p>
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
