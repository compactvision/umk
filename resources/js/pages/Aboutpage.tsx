import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Compass,
    Globe2,
    GraduationCap,
    HeartHandshake,
    Landmark,
    MoveRight,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const history = [
    {
        year: '1921',
        title: 'À l’origine, une conviction.',
        text: 'La pensée de Papa Simon Kimbangu porte une ambition éducative : permettre aux générations futures de prendre leur place dans le savoir et de bâtir leurs propres institutions.',
        image: 'academic.jpg',
        caption: 'Le savoir comme horizon commun',
    },
    {
        year: '1960',
        title: 'Une ambition qui prend racine.',
        text: 'Papa Joseph Diangienda Kuntima développe les écoles kimbanguistes. Ce mouvement donne une forme concrète à un projet de transmission et d’émancipation par l’éducation.',
        image: 'students.jpg',
        caption: 'Transmettre pour faire grandir',
    },
    {
        year: '1994',
        title: 'L’université se structure.',
        text: 'L’autorisation de fonctionnement ouvre une étape institutionnelle décisive. L’USK poursuit la construction de son organisation et de son offre de formation.',
        image: 'campus.jpg',
        caption: 'Un lieu de formation au cœur de Kinshasa',
    },
    {
        year: '2006',
        title: 'Une reconnaissance qui engage.',
        text: 'La reconnaissance de l’université par décret présidentiel consolide son inscription dans l’enseignement supérieur congolais et accompagne son développement.',
        image: 'ceremony.jpg',
        caption: 'Un engagement porté par toute une communauté',
    },
];
const sections = [
    ['mot-recteur', 'Le Recteur'],
    ['mission', 'Notre mission'],
    ['histoire', 'Notre histoire'],
    ['valeurs', 'Nos valeurs'],
    ['communaute', 'La communauté'],
];
const values = [
    {
        icon: BookOpen,
        title: 'Foi et savoir',
        text: 'Faire se rencontrer la réflexion scientifique et la vie spirituelle, dans le respect du questionnement et de la personne.',
    },
    {
        icon: ShieldCheck,
        title: 'Intégrité et discipline',
        text: 'Associer le sérieux du travail, l’honnêteté intellectuelle et la responsabilité dans chaque parcours.',
    },
    {
        icon: HeartHandshake,
        title: 'Paix et humanisme',
        text: 'Cultiver le dialogue, l’attention aux autres et le sens de la communauté au quotidien.',
    },
    {
        icon: Landmark,
        title: 'Un héritage vivant',
        text: 'Porter la tradition éducative kimbanguiste en l’inscrivant dans les défis de notre temps.',
    },
];

export default function Aboutpage() {
    const [chapter, setChapter] = useState(0);
    const [active, setActive] = useState('mot-recteur');
    const pageRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const page = pageRef.current;
        if (!page || !('IntersectionObserver' in window)) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const reveal = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        reveal.unobserve(entry.target);
                    }
                }),
            { threshold: 0.12 },
        );
        if (!reduce)
            page.querySelectorAll('[data-reveal]').forEach((el) => {
                el.classList.add('usk-reveal-ready');
                reveal.observe(el);
            });
        const navigation = new IntersectionObserver(
            (entries) =>
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                }),
            { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
        );
        page.querySelectorAll('[data-about-section]').forEach((el) => navigation.observe(el));
        return () => {
            reveal.disconnect();
            navigation.disconnect();
        };
    }, []);
    return (
        <App>
            <div className="usk-about" ref={pageRef}>
                <section className="usk-about-hero" aria-labelledby="about-title">
                    <div className="usk-about-hero-grid usk-container">
                        <div className="usk-about-opening">
                            <div className="usk-about-trail">
                                <Link href="/">Accueil</Link>
                                <span>/</span>
                                <span>L’université</span>
                            </div>
                            <span className="usk-eyebrow">Université Simon Kimbangu · Kinshasa</span>
                            <h1 id="about-title">
                                Un héritage
                                <br />
                                qui inspire.
                                <br />
                                <em>
                                    Une vision
                                    <br />
                                    qui rassemble.
                                </em>
                            </h1>
                            <p>Former l’esprit. Éveiller la conscience. Faire grandir une génération qui s’engage pour le monde.</p>
                            <div className="usk-actions">
                                <a href="#mot-recteur" className="usk-button usk-button-gold">
                                    Le mot du Recteur <ArrowDown size={17} />
                                </a>
                                <a href="#histoire" className="usk-about-quiet-link">
                                    Notre histoire <ArrowUpRight size={17} />
                                </a>
                            </div>
                            <div className="usk-about-motto">
                                <span>Science</span>
                                <i />
                                <span>Conscience</span>
                                <i />
                                <span>Vérité</span>
                            </div>
                        </div>
                        <figure className="usk-rector-portrait">
                            <div className="usk-rector-photo">
                                <PublicImage
                                    src="/assets/usk/recteur-kisolokele-kiangani-charles.jpg"
                                    alt="Monsieur Kisolokele Kiangani Charles, recteur de l’Université Simon Kimbangu"
                                    width={1400}
                                    height={1400}
                                    fetchPriority="high"
                                />
                                <span className="usk-rector-photo-label">
                                    <span /> Au service de notre université
                                </span>
                            </div>
                            <figcaption>
                                <div>
                                    <span className="usk-eyebrow">Le Recteur</span>
                                    <strong>
                                        Kisolokele Kiangani
                                        <br />
                                        <em>Charles</em>
                                    </strong>
                                    <p>Université Simon Kimbangu</p>
                                </div>
                                <PublicImage src="/assets/usk/logo.png" alt="Blason de l’USK" />
                            </figcaption>
                            <span className="usk-portrait-corner" aria-hidden="true" />
                        </figure>
                    </div>
                    <div className="usk-about-hero-foot usk-container">
                        <span>UNE INSTITUTION. DES CONVICTIONS. UN AVENIR COMMUN.</span>
                        <a href="#mot-recteur" aria-label="Découvrir le message du recteur">
                            <ArrowDown size={19} />
                        </a>
                    </div>
                </section>
                <nav className="usk-about-nav" aria-label="Les rubriques de l’université">
                    <div className="usk-container">
                        {sections.map(([id, label], i) => (
                            <a href={`#${id}`} key={id} aria-current={active === id ? 'location' : undefined}>
                                <span>0{i + 1}</span>
                                {label}
                                <ArrowUpRight size={14} />
                            </a>
                        ))}
                    </div>
                </nav>
                <section id="mot-recteur" data-about-section className="usk-section usk-rector-message">
                    <div className="usk-container">
                        <div className="usk-about-section-top" data-reveal>
                            <span className="usk-eyebrow">La parole du Recteur</span>
                            <span className="usk-about-section-index">01 / LEADERSHIP</span>
                        </div>
                        <div className="usk-rector-message-grid">
                            <div data-reveal>
                                <h2>
                                    Le savoir prend vie
                                    <br />
                                    <em>quand il a du sens.</em>
                                </h2>
                                <p className="usk-rector-intro">Une invitation à apprendre, à croire en son potentiel et à construire ensemble.</p>
                                <div className="usk-rector-seal">
                                    <PublicImage src="/assets/usk/logo.png" alt="" />
                                    <span>
                                        UNIVERSITÉ
                                        <br />
                                        <strong>SIMON KIMBANGU</strong>
                                        <small>Science · Conscience · Vérité</small>
                                    </span>
                                </div>
                            </div>
                            <div className="usk-rector-letter" data-reveal>
                                <span className="usk-rector-quote-mark" aria-hidden="true">
                                    “
                                </span>
                                <blockquote>L’USK est votre maison du savoir et de la foi.</blockquote>
                                <span className="usk-rector-excerpt-label">Extrait du message officiel du Recteur</span>
                                <p>
                                    Dans son message de bienvenue, le Recteur place le projet universitaire dans la continuité de la pensée de Papa
                                    Simon Kimbangu. Il y associe l’exigence des études, la dimension spirituelle et l’engagement envers la société.
                                </p>
                                <p>
                                    Son invitation s’adresse à toute la communauté : faire de l’USK un espace où les talents se développent, où les
                                    convictions s’approfondissent et où se préparent les responsables de demain.
                                </p>
                                <div className="usk-rector-signature">
                                    <span className="usk-signature-line" />
                                    <strong>Monsieur Kisolokele Kiangani Charles</strong>
                                    <span>Recteur de l’Université Simon Kimbangu</span>
                                </div>
                                <a
                                    href="https://www.universitesk.net/pages/histoire.php#mot-recteur"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="usk-link"
                                >
                                    Lire son message intégral <ArrowUpRight size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="mission" data-about-section className="usk-about-mission usk-section">
                    <div className="usk-container">
                        <div className="usk-about-section-top" data-reveal>
                            <span className="usk-eyebrow">Ce qui nous anime</span>
                            <span className="usk-about-section-index">02 / MISSION & VISION</span>
                        </div>
                        <div className="usk-mission-heading" data-reveal>
                            <h2>
                                Transmettre aujourd’hui.
                                <br />
                                <em>Transformer demain.</em>
                            </h2>
                            <p>Notre ambition : donner à chaque parcours une exigence, une direction et une utilité pour la société.</p>
                        </div>
                        <div className="usk-mission-cards">
                            <article className="usk-mission-card" data-reveal>
                                <Compass size={30} strokeWidth={1.3} />
                                <span className="usk-eyebrow">Notre mission</span>
                                <h3>
                                    Former des personnes
                                    <br />
                                    capables <em>d’agir.</em>
                                </h3>
                                <p>
                                    Accompagner l’acquisition de compétences solides et le développement d’un sens des responsabilités, pour
                                    contribuer aux progrès du continent africain.
                                </p>
                                <span className="usk-mission-card-foot">
                                    LE SAVOIR AU SERVICE DE L’ACTION <ArrowUpRight size={18} />
                                </span>
                            </article>
                            <article className="usk-mission-card usk-mission-card-dark" data-reveal>
                                <Globe2 size={30} strokeWidth={1.3} />
                                <span className="usk-eyebrow">Notre vision</span>
                                <h3>
                                    Une université ancrée.
                                    <br />
                                    <em>Un horizon ouvert.</em>
                                </h3>
                                <p>
                                    Faire rayonner une institution exigeante, ouverte aux échanges internationaux et portée par un engagement à la
                                    fois humain, social et spirituel.
                                </p>
                                <span className="usk-mission-card-foot">
                                    L’EXIGENCE COMME HORIZON <ArrowUpRight size={18} />
                                </span>
                            </article>
                        </div>
                        <div className="usk-about-purpose" data-reveal>
                            <GraduationCap size={26} strokeWidth={1.3} />
                            <p>La réussite d’un parcours se mesure aussi à ce qu’il permet d’apporter aux autres.</p>
                        </div>
                    </div>
                </section>
                <section id="histoire" data-about-section className="usk-section usk-about-history">
                    <div className="usk-container">
                        <div className="usk-about-section-top" data-reveal>
                            <span className="usk-eyebrow">Les racines de notre avenir</span>
                            <span className="usk-about-section-index">03 / NOTRE HISTOIRE</span>
                        </div>
                        <div className="usk-section-heading" data-reveal>
                            <h2>
                                Une conviction devient
                                <br />
                                <em>une institution.</em>
                            </h2>
                            <p className="usk-history-instruction">
                                Parcourez les grandes étapes
                                <br />
                                de notre histoire.
                            </p>
                        </div>
                        <div className="usk-history-tabs" role="tablist" aria-label="Les étapes de l’histoire de l’USK">
                            {history.map((item, i) => (
                                <button
                                    key={item.year}
                                    type="button"
                                    role="tab"
                                    id={`history-tab-${i}`}
                                    aria-selected={chapter === i}
                                    aria-controls="history-panel"
                                    tabIndex={chapter === i ? 0 : -1}
                                    onClick={() => setChapter(i)}
                                    onKeyDown={(e) => {
                                        if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
                                            e.preventDefault();
                                            const next =
                                                e.key === 'Home'
                                                    ? 0
                                                    : e.key === 'End'
                                                      ? history.length - 1
                                                      : (i + (e.key === 'ArrowRight' ? 1 : -1) + history.length) % history.length;
                                            setChapter(next);
                                            document.getElementById(`history-tab-${next}`)?.focus();
                                        }
                                    }}
                                >
                                    <span>0{i + 1}</span>
                                    <strong>{item.year}</strong>
                                    <i />
                                </button>
                            ))}
                        </div>
                        <div id="history-panel" role="tabpanel" aria-labelledby={`history-tab-${chapter}`} className="usk-history-panel">
                            <div className="usk-history-story" key={`story-${chapter}`}>
                                <span className="usk-eyebrow">
                                    Chapitre 0{chapter + 1} · {history[chapter].year}
                                </span>
                                <h3>{history[chapter].title}</h3>
                                <p>{history[chapter].text}</p>
                                <span className="usk-history-note">Images de la vie actuelle de l’université.</span>
                                <div className="usk-history-controls">
                                    <span>
                                        0{chapter + 1} <i>/ 0{history.length}</i>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setChapter((chapter + 1) % history.length)}
                                        aria-label="Afficher le chapitre historique suivant"
                                    >
                                        <span>Chapitre suivant</span>
                                        <MoveRight size={23} />
                                    </button>
                                </div>
                            </div>
                            <figure key={`photo-${chapter}`}>
                                <PublicImage src={`/assets/usk/${history[chapter].image}`} alt={history[chapter].caption} loading="lazy" />
                                <figcaption>{history[chapter].caption}</figcaption>
                            </figure>
                        </div>
                    </div>
                </section>
                <section id="valeurs" data-about-section className="usk-about-values usk-section">
                    <div className="usk-container">
                        <div className="usk-about-section-top" data-reveal>
                            <span className="usk-eyebrow">L’esprit de notre communauté</span>
                            <span className="usk-about-section-index">04 / NOS VALEURS</span>
                        </div>
                        <div className="usk-section-heading" data-reveal>
                            <h2>
                                Des valeurs que l’on porte.
                                <br />
                                <em>Et que l’on fait vivre.</em>
                            </h2>
                        </div>
                        <div className="usk-about-values-grid">
                            {values.map(({ icon: Icon, title, text }, i) => (
                                <article key={title} data-reveal>
                                    <div>
                                        <Icon size={27} strokeWidth={1.3} />
                                        <span>0{i + 1}</span>
                                    </div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
                <section id="communaute" data-about-section className="usk-about-community">
                    <div className="usk-about-community-picture">
                        <PublicImage
                            src="/assets/usk/ceremony.jpg"
                            alt="Diplômés de l’USK réunis lors d’une cérémonie universitaire"
                            loading="lazy"
                        />
                        <span>Une fierté partagée. Un avenir à construire.</span>
                    </div>
                    <div className="usk-about-community-copy" data-reveal>
                        <span className="usk-eyebrow">Votre place dans notre histoire</span>
                        <h2>
                            L’université se raconte.
                            <br />
                            <em>Elle se vit, surtout.</em>
                        </h2>
                        <p>
                            Étudiants, enseignants et partenaires donnent corps à notre projet. Ce sont leurs rencontres, leurs efforts et leurs idées
                            qui font avancer l’USK.
                        </p>
                        <Link href="/admission" className="usk-button usk-button-gold">
                            Rejoindre la communauté <ArrowUpRight size={18} />
                        </Link>
                        <Link href="/contact" className="usk-about-quiet-link">
                            Venir nous rencontrer <ArrowRight size={17} />
                        </Link>
                    </div>
                </section>
                <div className="usk-about-source usk-container">
                    <Landmark size={14} />
                    <span>
                        Identité institutionnelle, repères historiques et portrait :{' '}
                        <a href="https://www.universitesk.net/pages/histoire.php" target="_blank" rel="noreferrer">
                            Université Simon Kimbangu <ArrowUpRight size={12} />
                        </a>
                    </span>
                </div>
            </div>
        </App>
    );
}
