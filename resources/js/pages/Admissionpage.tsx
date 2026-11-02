import App from '@/components/layouts/Home/App';
import DocumentChecklist from '@/components/section/admissions/DocumentChecklist';
import FeeSimulator from '@/components/section/admissions/FeeSimulator';
import MediaDialog, { type AdmissionMedia } from '@/components/section/admissions/MediaDialog';
import Orientation from '@/components/section/admissions/Orientation';
import PublicImage from '@/components/seo/PublicImage';
import {
    admissionFaculties,
    admissionFaq,
    admissionSteps,
    admissionsSource,
    admissionsVerified,
    admissionsYear,
    formatUSD,
    normalizeFacultyName,
    type CandidateCategory,
} from '@/lib/admissions';
import { useInstitution } from '@/lib/useInstitution';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    Calculator,
    CalendarDays,
    ChevronDown,
    Download,
    ExternalLink,
    FileText,
    GraduationCap,
    MapPin,
    Maximize2,
    MessageCircle,
    Phone,
    Search,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../css/admissions.css';

const navigation = [
    ['conditions', 'Conditions'],
    ['facultes', 'Facultés'],
    ['frais', 'Frais'],
    ['simulateur', 'Simulateur'],
    ['procedure', 'Procédure'],
    ['orientation', 'Orientation'],
    ['campus', 'Campus'],
    ['faq', 'FAQ'],
    ['flyers', 'Flyers'],
];
const flyers = [
    {
        src: '/assets/usk/flyer-conditions-frais-2026-2027.jpg',
        title: 'Conditions & barème détaillé',
        download: 'USK-conditions-et-frais-2026-2027.jpg',
        text: 'Les pièces du dossier, les frais par faculté et les deux tranches de paiement.',
        number: '01',
    },
    {
        src: '/assets/usk/flyer-inscriptions-2026-2027.jpg',
        title: 'Le guide des inscriptions',
        download: 'USK-inscriptions-2026-2027.jpg',
        text: 'La présentation de l’université et les coordonnées utiles pour votre démarche.',
        number: '02',
    },
];
type FacultyResource = { id: number; name: string; levels?: { id: number; title: string }[] };
export default function Admissionpage() {
    const usk = useInstitution();
    const page = usePage();
    const serverFaculties = (page.props.faculties as { data?: FacultyResource[] } | undefined)?.data ?? [];
    const [facultyId, setFacultyId] = useState('medicine');
    const [category, setCategory] = useState<CandidateCategory>('national');
    const [activeSection, setActiveSection] = useState('conditions');
    const [media, setMedia] = useState<AdmissionMedia | null>(null);
    const [faqCategory, setFaqCategory] = useState('Toutes');
    const [faqSearch, setFaqSearch] = useState('');
    const [openQuestion, setOpenQuestion] = useState<string | null>(admissionFaq[0].question);
    const root = useRef<HTMLDivElement>(null);
    const selected = admissionFaculties.find((f) => f.id === facultyId)!;
    const resource = serverFaculties.find((f) => normalizeFacultyName(f.name).includes(selected.match));
    const faq = admissionFaq.filter(
        (item) =>
            (faqCategory === 'Toutes' || item.category === faqCategory) &&
            normalizeFacultyName(`${item.question} ${item.answer}`).includes(normalizeFacultyName(faqSearch)),
    );
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                }),
            { rootMargin: '-12% 0px -62% 0px', threshold: 0 },
        );
        root.current?.querySelectorAll('[data-admission-section]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return (
        <App>
            <div className="usk-admissions" ref={root}>
                <section className="adm-hero">
                    <div className="usk-container adm-hero-grid">
                        <div className="adm-hero-copy">
                            <div className="adm-breadcrumb">
                                <Link href="/">Accueil</Link>
                                <span>/</span>
                                <span>Admissions</span>
                            </div>
                            <span className="usk-eyebrow">
                                <span className="adm-status-dot" /> Votre rentrée se prépare aujourd’hui · {admissionsYear}
                            </span>
                            <h1>
                                Votre ambition.
                                <br />
                                Votre parcours.
                                <br />
                                <em>Votre place ici.</em>
                            </h1>
                            <p>
                                Un projet qui vous ressemble. Une communauté qui vous accompagne. Préparez votre entrée à l’Université Simon Kimbangu,
                                étape par étape.
                            </p>
                            <div className="adm-hero-actions">
                                <Link href="/register" className="usk-button usk-button-gold">
                                    Commencer ma candidature <ArrowUpRight size={18} />
                                </Link>
                                <a href="#simulateur" className="adm-light-link">
                                    Estimer mes frais <ArrowRight size={17} />
                                </a>
                            </div>
                            <div className="adm-hero-proof">
                                <span>
                                    <ShieldCheck size={16} />
                                    Une information sourcée
                                </span>
                                <span>
                                    <Wallet size={16} />
                                    Deux tranches de paiement
                                </span>
                            </div>
                        </div>
                        <div className="adm-hero-visual">
                            <PublicImage
                                src="/assets/usk/students.jpg"
                                alt="Étudiants de l’Université Simon Kimbangu lors d’une activité universitaire"
                                fetchPriority="high"
                            />
                            <div className="adm-hero-image-label">
                                <span>KINSHASA · RDC</span>
                                <strong>
                                    Le prochain chapitre
                                    <br />
                                    <em>commence avec vous.</em>
                                </strong>
                            </div>
                            <a href="#orientation" className="adm-hero-advisor">
                                <span>
                                    <MessageCircle size={22} />
                                </span>
                                <div>
                                    <small>UNE QUESTION SUR VOTRE PARCOURS ?</small>
                                    <strong>Parlons de votre projet.</strong>
                                    <p>
                                        Service des admissions <ArrowUpRight size={15} />
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className="usk-container adm-hero-bottom">
                        <span>
                            SCIENCE <i /> CONSCIENCE <i /> VÉRITÉ
                        </span>
                        <a href="#conditions">
                            Votre guide, en un seul endroit <ArrowDown size={15} />
                        </a>
                    </div>
                </section>
                <nav className="adm-section-nav" aria-label="Guide des admissions">
                    <div className="usk-container">
                        {navigation.map(([id, label]) => (
                            <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>
                                {label}
                                {id === 'simulateur' && <Calculator size={12} />}
                            </a>
                        ))}
                    </div>
                </nav>
                <div className="adm-overview">
                    <div className="usk-container">
                        <div>
                            <span>01</span>
                            <strong>Choisir sa voie</strong>
                            <small>5 facultés à explorer</small>
                        </div>
                        <ArrowRight size={19} />
                        <div>
                            <span>02</span>
                            <strong>Préparer son dossier</strong>
                            <small>Une checklist pour avancer</small>
                        </div>
                        <ArrowRight size={19} />
                        <div>
                            <span>03</span>
                            <strong>Planifier ses frais</strong>
                            <small>Un simulateur transparent</small>
                        </div>
                        <ArrowRight size={19} />
                        <div>
                            <span>04</span>
                            <strong>Passer à l’action</strong>
                            <small>Un accompagnement humain</small>
                        </div>
                    </div>
                </div>
                <DocumentChecklist />
                <section id="facultes" className="adm-section adm-faculties" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">À chaque ambition, son chemin</span>
                            <span>02 / FACULTÉS</span>
                        </div>
                        <div className="adm-heading">
                            <h2>
                                Cinq voies pour
                                <br />
                                <em>donner forme à l’avenir.</em>
                            </h2>
                            <p>Explorez les domaines qui vous attirent. Le choix d’une faculté met aussi à jour votre estimation des frais.</p>
                        </div>
                        <div className="adm-faculty-selector" role="group" aria-label="Explorer une faculté">
                            {admissionFaculties.map((f) => (
                                <button
                                    type="button"
                                    key={f.id}
                                    aria-pressed={facultyId === f.id}
                                    onClick={() => setFacultyId(f.id)}
                                    className="adm-faculty-option"
                                >
                                    <PublicImage src={`/assets/usk/${f.image}`} alt="" loading="lazy" />
                                    <span>{f.number} / FACULTÉ</span>
                                    <strong>{f.shortName}</strong>
                                    <i>
                                        <ArrowUpRight size={18} />
                                    </i>
                                </button>
                            ))}
                        </div>
                        <div className="adm-faculty-focus" aria-live="polite">
                            <div>
                                <span className="usk-eyebrow">Votre faculté à la loupe</span>
                                <h3>{selected.name}</h3>
                                <p>{selected.description}</p>
                                <div className="adm-faculty-tags">
                                    {selected.opportunities.map((item) => (
                                        <span key={item}>{item}</span>
                                    ))}
                                </div>
                                <small>Domaines à explorer ; les débouchés dépendent du programme et des qualifications requises.</small>
                            </div>
                            <div className="adm-faculty-focus-side">
                                <span>CE QUI VOUS ANIME</span>
                                <p>{selected.interests}</p>
                                {resource?.levels?.length ? (
                                    <div className="adm-program-links">
                                        {resource.levels.slice(0, 3).map((level) => (
                                            <Link href={`/course/${level.id}`} key={level.id}>
                                                {level.title}
                                                <ArrowUpRight size={15} />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Link href="/courses" className="usk-link">
                                        Explorer les formations <ArrowUpRight size={16} />
                                    </Link>
                                )}
                                <a href="#orientation">
                                    J’hésite encore : être accompagné <ArrowRight size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="frais" className="adm-section adm-fees" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">Anticiper pour avancer</span>
                            <span>03 / FRAIS ACADÉMIQUES</span>
                        </div>
                        <div className="adm-heading">
                            <h2>
                                Les chiffres clairs.
                                <br />
                                <em>Le projet, plus serein.</em>
                            </h2>
                            <div>
                                <p>Barème académique {admissionsYear}, en dollars américains. Deux tranches pour organiser votre paiement.</p>
                                <div className="adm-segmented" role="group" aria-label="Catégorie du barème">
                                    <button type="button" aria-pressed={category === 'national'} onClick={() => setCategory('national')}>
                                        Nationaux
                                    </button>
                                    <button type="button" aria-pressed={category === 'international'} onClick={() => setCategory('international')}>
                                        Étrangers
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="adm-fee-table-wrap">
                            <table className="adm-fee-table">
                                <caption className="adm-sr-only">
                                    Frais académiques {admissionsYear} — {category === 'national' ? 'Nationaux' : 'Étrangers'}
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Faculté</th>
                                        <th scope="col">1re tranche</th>
                                        <th scope="col">2e tranche</th>
                                        <th scope="col">Total académique</th>
                                        <th scope="col">
                                            <span className="adm-sr-only">Simuler</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admissionFaculties.map((f) => (
                                        <tr key={f.id} className={facultyId === f.id ? 'is-selected' : ''}>
                                            <th scope="row">
                                                <span>{f.number}</span>
                                                {f.shortName}
                                            </th>
                                            <td>{formatUSD(f.tuition[category].first)}</td>
                                            <td>{formatUSD(f.tuition[category].second)}</td>
                                            <td>
                                                <strong>{formatUSD(f.tuition[category].first + f.tuition[category].second)}</strong>
                                            </td>
                                            <td>
                                                <a
                                                    href="#simulateur"
                                                    onClick={() => setFacultyId(f.id)}
                                                    aria-label={`Simuler les frais de ${f.name}`}
                                                >
                                                    <ArrowUpRight size={19} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="adm-fees-context">
                            <p>
                                <CalendarDays size={16} />
                                <span>
                                    Les échéances et modalités de règlement sont communiquées par les admissions. Le barème peut évoluer sur décision
                                    officielle.
                                </span>
                            </p>
                            <a href={admissionsSource} target="_blank" rel="noreferrer">
                                Consulter la source officielle <ExternalLink size={13} />
                            </a>
                        </div>
                        <details className="adm-extra-fees">
                            <summary>
                                <span>
                                    <FileText size={19} />
                                    Dossier, tests et frais annexes : comprendre ce qui s’ajoute
                                </span>
                                <ChevronDown size={18} />
                            </summary>
                            <div className="adm-extra-fees-content">
                                <label htmlFor="extras-faculty">
                                    Consulter une faculté
                                    <select id="extras-faculty" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                                        {admissionFaculties.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.shortName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <dl>
                                    {selected.extras.map((fee) => (
                                        <div key={fee.label}>
                                            <dt>{fee.label}</dt>
                                            <dd>{fee.amount === 0 ? 'Gratuit' : formatUSD(fee.amount)}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {selected.publishedExtras != null && (
                                    <p className="adm-extra-total">
                                        Total annexe annoncé dans le flyer <strong>{formatUSD(selected.publishedExtras)}</strong>
                                    </p>
                                )}
                                {selected.extraNote && <p className="adm-fee-discrepancy">{selected.extraNote}</p>}
                                <p>
                                    Le flyer mentionne aussi une farde à 6 000 CDF et un concours à 10 $ (20 $ pour les inscriptions spéciales). Leur
                                    application et tout cumul se confirment au bureau des inscriptions.
                                </p>
                                <p>
                                    Les inscriptions spéciales disposent d’un barème distinct : 395 $ pour les nationaux et 495 $ pour les étrangers.
                                    Une autre mention de 175 $ pour les autres facultés figure dans le flyer : faites préciser le régime applicable à
                                    votre dossier.
                                </p>
                                <button type="button" className="usk-link" onClick={() => setMedia(flyers[0])}>
                                    Vérifier le flyer complet <Maximize2 size={15} />
                                </button>
                            </div>
                        </details>
                    </div>
                </section>
                <FeeSimulator facultyId={facultyId} setFacultyId={setFacultyId} category={category} setCategory={setCategory} />
                <section id="procedure" className="adm-section adm-procedure" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">Du projet au premier cours</span>
                            <span>05 / PROCÉDURE</span>
                        </div>
                        <div className="adm-heading">
                            <h2>
                                Un premier pas.
                                <br />
                                <em>Puis un chemin clair.</em>
                            </h2>
                            <p>Les étapes pour préparer une demande complète, avec l’appui du service des admissions.</p>
                        </div>
                        <div className="adm-procedure-grid">
                            {admissionSteps.map((step, i) => (
                                <article key={step.title}>
                                    <span className="adm-step-number">0{i + 1}</span>
                                    <h3>{step.title}</h3>
                                    <p>{step.text}</p>
                                    {step.link.startsWith('#') ? (
                                        <a href={step.link}>
                                            {step.action}
                                            <ArrowUpRight size={15} />
                                        </a>
                                    ) : (
                                        <Link href={step.link}>
                                            {step.action}
                                            <ArrowUpRight size={15} />
                                        </Link>
                                    )}
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                <Orientation facultyId={facultyId} setFacultyId={setFacultyId} category={category} />
                <section id="campus" className="adm-section adm-campus" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">Imaginez votre quotidien</span>
                            <span>07 / CAMPUS</span>
                        </div>
                        <div className="adm-campus-layout">
                            <div className="adm-campus-copy">
                                <span className="adm-line-icon">
                                    <MapPin size={29} strokeWidth={1.3} />
                                </span>
                                <h2>
                                    Votre prochaine
                                    <br />
                                    <em>adresse du savoir.</em>
                                </h2>
                                <p>
                                    À Kalamu, l’USK est un lieu de formation et de rencontres. Venez découvrir les espaces, poser vos questions et
                                    préparer la suite de votre parcours.
                                </p>
                                <address>
                                    <strong>Université Simon Kimbangu</strong>
                                    <span>{usk.address}</span>
                                </address>
                                <div className="adm-campus-actions">
                                    <a
                                        href="https://www.google.com/maps/search/?api=1&query=Université+Simon+Kimbangu+Kalamu+Kinshasa"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="usk-button usk-button-green"
                                    >
                                        Préparer mon itinéraire <ArrowUpRight size={17} />
                                    </a>
                                    <a href={`tel:${usk.phone.replaceAll(' ', '')}`}>
                                        <Phone size={15} />
                                        Confirmer ma visite
                                    </a>
                                </div>
                                <small>Contactez l’équipe pour connaître les horaires d’accueil avant votre déplacement.</small>
                            </div>
                            <div className="adm-campus-gallery">
                                {[
                                    { image: 'campus.jpg', title: 'Le campus de l’USK à Kinshasa' },
                                    { image: 'academic.jpg', title: 'Rencontres de la communauté universitaire' },
                                    { image: 'ceremony.jpg', title: 'Les temps forts de la vie académique' },
                                ].map(({ image, title }, i) => (
                                    <button
                                        type="button"
                                        key={image}
                                        onClick={() => setMedia({ src: `/assets/usk/${image}`, title })}
                                        aria-label={`Agrandir : ${title}`}
                                        className={i === 0 ? 'is-main' : ''}
                                    >
                                        <PublicImage src={`/assets/usk/${image}`} alt={title} loading="lazy" />
                                        <span>
                                            <Maximize2 size={17} />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <section id="faq" className="adm-section adm-faq" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">Avant de vous lancer</span>
                            <span>08 / VOS QUESTIONS</span>
                        </div>
                        <div className="adm-faq-layout">
                            <div className="adm-faq-intro">
                                <h2>
                                    Les bonnes réponses.
                                    <br />
                                    <em>Au bon moment.</em>
                                </h2>
                                <p>Retrouvez les informations pratiques pour préparer votre démarche sans multiplier les déplacements.</p>
                                <a href={`tel:${usk.phone.replaceAll(' ', '')}`} className="adm-faq-contact">
                                    <span>
                                        <Phone size={20} />
                                    </span>
                                    <div>
                                        <small>UNE QUESTION PLUS PRÉCISE ?</small>
                                        <strong>{usk.phone}</strong>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </a>
                            </div>
                            <div>
                                <label className="adm-faq-search">
                                    <Search size={17} />
                                    <span className="adm-sr-only">Rechercher une question</span>
                                    <input
                                        type="search"
                                        value={faqSearch}
                                        onChange={(e) => setFaqSearch(e.target.value)}
                                        placeholder="Diplôme, paiement, inscription…"
                                    />
                                </label>
                                <div className="adm-faq-filters" role="group" aria-label="Thèmes des questions">
                                    {['Toutes', 'Dossier', 'Frais', 'International', 'Campus'].map((item) => (
                                        <button type="button" key={item} aria-pressed={faqCategory === item} onClick={() => setFaqCategory(item)}>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                                <div className="adm-faq-list">
                                    {faq.map((item) => {
                                        const id = `faq-${admissionFaq.indexOf(item)}`;
                                        const open = openQuestion === item.question;
                                        return (
                                            <article key={item.question}>
                                                <h3>
                                                    <button
                                                        id={`${id}-heading`}
                                                        type="button"
                                                        aria-expanded={open}
                                                        aria-controls={`${id}-answer`}
                                                        onClick={() => setOpenQuestion(open ? null : item.question)}
                                                    >
                                                        {item.question}
                                                        <ChevronDown size={18} />
                                                    </button>
                                                </h3>
                                                <div id={`${id}-answer`} role="region" aria-labelledby={`${id}-heading`} hidden={!open}>
                                                    <p>{item.answer}</p>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {!faq.length && (
                                        <div className="adm-faq-empty">
                                            Aucune réponse ne correspond à cette recherche.
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFaqSearch('');
                                                    setFaqCategory('Toutes');
                                                }}
                                            >
                                                Voir toutes les questions <ArrowRight size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="flyers" className="adm-section adm-flyers" data-admission-section>
                    <div className="usk-container">
                        <div className="adm-section-top">
                            <span className="usk-eyebrow">L’essentiel à garder avec vous</span>
                            <span>09 / DOCUMENTS OFFICIELS</span>
                        </div>
                        <div className="adm-heading">
                            <h2>
                                À lire. À garder.
                                <br />
                                <em>À partager.</em>
                            </h2>
                            <p>Les deux flyers officiels des admissions {admissionsYear}, consultables en grand et téléchargeables.</p>
                        </div>
                        <div className="adm-flyer-grid">
                            {flyers.map((flyer) => (
                                <article key={flyer.src}>
                                    <button
                                        type="button"
                                        className="adm-flyer-preview"
                                        onClick={() => setMedia(flyer)}
                                        aria-label={`Agrandir le document : ${flyer.title}`}
                                    >
                                        <PublicImage src={flyer.src} alt={`Flyer officiel USK : ${flyer.title}, ${admissionsYear}`} loading="lazy" />
                                        <span>
                                            <Maximize2 size={17} />
                                            Agrandir le document
                                        </span>
                                    </button>
                                    <div className="adm-flyer-description">
                                        <span>
                                            DOCUMENT {flyer.number} · {admissionsYear}
                                        </span>
                                        <h3>{flyer.title}</h3>
                                        <p>{flyer.text}</p>
                                        <a href={flyer.src} download={flyer.download}>
                                            <Download size={16} />
                                            Télécharger le flyer JPG
                                            <ArrowDown size={16} />
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="adm-source-note">
                            <ShieldCheck size={16} />
                            <p>
                                Informations vérifiées le {admissionsVerified} sur les documents et la{' '}
                                <a href={admissionsSource} target="_blank" rel="noreferrer">
                                    page officielle des admissions <ExternalLink size={11} />
                                </a>
                                . Pour les montants exigibles, les échéances et les cas particuliers, le service des admissions reste votre référence.
                            </p>
                        </div>
                    </div>
                </section>
                <section className="adm-final-cta">
                    <div className="usk-container">
                        <span className="usk-eyebrow">La suite vous appartient</span>
                        <h2>
                            Un projet en tête ?<br />
                            <em>Donnons-lui un départ.</em>
                        </h2>
                        <div>
                            <Link href="/register" className="usk-button usk-button-gold">
                                Créer mon espace candidat <ArrowUpRight size={18} />
                            </Link>
                            <a href="#orientation" className="adm-light-link">
                                Parler aux admissions <ArrowRight size={17} />
                            </a>
                        </div>
                        <GraduationCap className="adm-cta-watermark" size={280} strokeWidth={0.5} aria-hidden="true" />
                    </div>
                </section>
            </div>
            <MediaDialog media={media} onClose={() => setMedia(null)} />
        </App>
    );
}
