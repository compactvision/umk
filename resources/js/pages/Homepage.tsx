import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import { fields } from '@/lib/usk';
import { Link, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Globe2, GraduationCap, MoveUpRight } from 'lucide-react';

type Faculty = { id: number; name: string; levels?: { id: number }[] };
type News = {
    id: number;
    title: string;
    excerpt?: string;
    main_image_1?: string;
    images?: { main1?: string };
    published_at?: string;
    publishedAt?: string;
};
export default function Homepage() {
    const props = usePage().props;
    const faculties = (props.faculties as { data?: Faculty[] } | undefined)?.data ?? [];
    const posts = (props.posts as { data?: News[] } | undefined)?.data ?? [];
    return (
        <App>
            <section className="usk-hero">
                <PublicImage
                    className="usk-hero-image"
                    src="/assets/usk/academic.jpg"
                    alt="Étudiants de l’Université Simon Kimbangu réunis lors d’une activité académique"
                    fetchPriority="high"
                    loading="eager"
                    sizes="100vw"
                />
                <div className="usk-container usk-hero-content">
                    <div className="usk-hero-topline">
                        <span className="usk-eyebrow">Un héritage. Une ambition. Votre avenir.</span>
                        <span className="usk-hero-location">KINSHASA · RDC</span>
                    </div>
                    <div className="usk-hero-copy">
                        <h1>
                            Le savoir pour
                            <br />
                            grandir.
                            <br />
                            <em>
                                La conscience
                                <br />
                                pour agir.
                            </em>
                        </h1>
                        <p>À l’Université Simon Kimbangu, faites de votre ambition une force pour vous-même et pour la société.</p>
                        <div className="usk-actions">
                            <Link href="/courses" className="usk-button usk-button-gold">
                                Trouver ma formation <ArrowUpRight size={19} />
                            </Link>
                            <Link href="/about" className="usk-text-link">
                                Découvrir l’université <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                    <div className="usk-hero-bottom">
                        <a href="#explorer">
                            Explorer l’USK <ArrowDown size={16} />
                        </a>
                        <span>
                            SCIENCE <i /> CONSCIENCE <i /> VÉRITÉ
                        </span>
                        <span className="usk-photo-credit">Au cœur de notre communauté</span>
                    </div>
                </div>
                <Link href="/admission" className="usk-hero-note">
                    <span className="usk-note-icon">
                        <GraduationCap size={24} />
                    </span>
                    <div>
                        <small>VOTRE PROCHAINE ÉTAPE</small>
                        <strong>Un avenir à votre hauteur.</strong>
                        <span>
                            Découvrez les admissions <ArrowUpRight size={16} />
                        </span>
                    </div>
                </Link>
            </section>
            <div className="usk-quicklinks" id="explorer">
                <div className="usk-container">
                    {[
                        ['01', 'Choisir sa formation', '/courses'],
                        ['02', 'Préparer son admission', '/admission'],
                        ['03', 'Rencontrer l’université', '/contact'],
                    ].map(([n, label, href]) => (
                        <Link href={href} key={n}>
                            <span>{n}</span>
                            <strong>{label}</strong>
                            <ArrowUpRight size={23} />
                        </Link>
                    ))}
                </div>
            </div>
            <section className="usk-section usk-intro">
                <div className="usk-container usk-intro-grid">
                    <div>
                        <span className="usk-eyebrow">L’esprit USK</span>
                        <h2>
                            Des convictions fortes.
                            <br />
                            <em>Des horizons ouverts.</em>
                        </h2>
                    </div>
                    <div>
                        <p className="usk-lead">La science éclaire. La conscience guide. La vérité nous fait avancer.</p>
                        <p>
                            À Kinshasa, l’Université Simon Kimbangu fait dialoguer formation, recherche et engagement citoyen. Un lieu pour apprendre
                            à penser librement, développer ses talents et contribuer au monde de demain.
                        </p>
                        <Link href="/about" className="usk-link">
                            Notre histoire et nos valeurs <ArrowUpRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
            <section className="usk-rector-home" aria-labelledby="rector-home-title">
                <div className="usk-container usk-rector-home-grid">
                    <Link href="/about#mot-recteur" className="usk-rector-home-photo" aria-label="Découvrir le recteur de l’USK">
                        <PublicImage
                            src="/assets/usk/recteur-kisolokele-kiangani-charles.jpg"
                            alt="Monsieur Kisolokele Kiangani Charles, recteur de l’USK"
                            loading="lazy"
                        />
                    </Link>
                    <div>
                        <span className="usk-eyebrow">Une vision, un engagement</span>
                        <h2 id="rector-home-title">
                            L’ambition de transmettre.
                            <br />
                            <em>La volonté de rassembler.</em>
                        </h2>
                        <p>Découvrez la parole du Recteur et les convictions qui portent notre projet universitaire.</p>
                        <Link href="/about#mot-recteur" className="usk-link">
                            Rencontrer le Recteur <ArrowUpRight size={18} />
                        </Link>
                    </div>
                    <div className="usk-rector-home-name">
                        <span>LE RECTEUR</span>
                        <strong>
                            Kisolokele
                            <br />
                            Kiangani Charles
                        </strong>
                        <PublicImage src="/assets/usk/logo.png" alt="" />
                    </div>
                </div>
            </section>
            <section className="usk-section usk-faculties">
                <div className="usk-container">
                    <div className="usk-section-heading">
                        <div>
                            <span className="usk-eyebrow">Les chemins du savoir</span>
                            <h2>
                                Trouvez votre voie.
                                <br />
                                <em>Affirmez votre vocation.</em>
                            </h2>
                        </div>
                        <Link href="/courses" className="usk-link">
                            Toutes les formations <ArrowUpRight size={19} />
                        </Link>
                    </div>
                    <div className="usk-faculty-grid">
                        {fields.map((field, i) => {
                            const faculty = faculties.find((f) =>
                                f.name.toLocaleLowerCase('fr').includes(field.name.split(' ')[0].toLocaleLowerCase('fr')),
                            );
                            const href = faculty ? `/faculties/${faculty.id}` : '/courses';
                            return (
                                <Link href={href} key={field.name} className={`usk-faculty-card ${i === 0 ? 'usk-faculty-featured' : ''}`}>
                                    <PublicImage src={`/assets/usk/${field.image}`} alt="" loading="lazy" />
                                    <span className="usk-faculty-number">0{i + 1} / FACULTÉ</span>
                                    <div>
                                        <h3>{field.name}</h3>
                                        <p>{field.text}</p>
                                    </div>
                                    <span className="usk-card-arrow">
                                        <ArrowUpRight size={23} />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
            <section className="usk-campus">
                <div className="usk-campus-photo">
                    <PublicImage src="/assets/usk/students.jpg" alt="La communauté étudiante de l’USK" loading="lazy" />
                    <span>Apprendre ensemble. Aller plus loin.</span>
                </div>
                <div className="usk-campus-copy">
                    <span className="usk-eyebrow">Bien plus qu’un cursus</span>
                    <h2>
                        Une université.
                        <br />
                        <em>
                            Une communauté.
                            <br />
                            Votre place.
                        </em>
                    </h2>
                    <p>
                        Les rencontres, les échanges et l’expérience du terrain donnent tout son sens au savoir. Rejoignez une communauté qui fait
                        grandir les idées autant que les personnes.
                    </p>
                    <div className="usk-value-list">
                        <span>
                            <BookOpen size={20} /> Un enseignement tourné vers la pratique
                        </span>
                        <span>
                            <Globe2 size={20} /> Un engagement au service de la société
                        </span>
                        <span>
                            <GraduationCap size={20} /> Un parcours qui donne du sens à l’avenir
                        </span>
                    </div>
                    <Link href="/about" className="usk-button usk-button-outline">
                        Vivre l’expérience USK <ArrowUpRight size={18} />
                    </Link>
                </div>
            </section>
            <section className="usk-section usk-news">
                <div className="usk-container">
                    <div className="usk-section-heading">
                        <div>
                            <span className="usk-eyebrow">L’université en mouvement</span>
                            <h2>
                                Au fil de <em>l’USK.</em>
                            </h2>
                        </div>
                        <Link href="/blog" className="usk-link">
                            Toutes les actualités <ArrowUpRight size={19} />
                        </Link>
                    </div>
                    <div className="usk-news-grid">
                        {posts.length ? (
                            posts.slice(0, 3).map((post, i) => {
                                const image = post.main_image_1 || post.images?.main1;
                                const date = post.published_at || post.publishedAt;
                                return (
                                    <Link href={`/blog/${post.id}`} className="usk-news-card" key={post.id}>
                                        <div className="usk-news-image">
                                            <PublicImage
                                                src={
                                                    image
                                                        ? image.startsWith('http') || image.startsWith('/')
                                                            ? image
                                                            : `/storage/${image}`
                                                        : `/assets/usk/${['ceremony.jpg', 'medicine.jpg', 'campus.jpg'][i]}`
                                                }
                                                alt=""
                                                loading="lazy"
                                            />
                                            <span>
                                                <ArrowUpRight size={23} />
                                            </span>
                                        </div>
                                        <small>
                                            {date && Number.isFinite(Date.parse(date))
                                                ? new Date(date).toLocaleDateString('fr-CD', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : 'Vie universitaire'}
                                        </small>
                                        <h3>{post.title}</h3>
                                        {post.excerpt && <p>{post.excerpt}</p>}
                                    </Link>
                                );
                            })
                        ) : (
                            <>
                                <Link href="/about" className="usk-editorial">
                                    <span className="usk-eyebrow">Notre institution</span>
                                    <h3>
                                        Une histoire de foi,
                                        <br />
                                        de savoir et d’engagement.
                                    </h3>
                                    <span>
                                        Découvrir notre histoire <ArrowUpRight size={19} />
                                    </span>
                                </Link>
                                <Link href="/admission" className="usk-editorial">
                                    <span className="usk-eyebrow">Futurs étudiants</span>
                                    <h3>
                                        Votre projet mérite
                                        <br />
                                        un nouvel horizon.
                                    </h3>
                                    <span>
                                        Préparer mon parcours <ArrowUpRight size={19} />
                                    </span>
                                </Link>
                                <Link href="/contact" className="usk-editorial">
                                    <span className="usk-eyebrow">À votre écoute</span>
                                    <h3>
                                        Une question ?<br />
                                        Faisons connaissance.
                                    </h3>
                                    <span>
                                        Contacter l’université <ArrowUpRight size={19} />
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>
            <section className="usk-admission-banner">
                <div className="usk-container">
                    <span className="usk-eyebrow">Votre avenir commence par une rencontre</span>
                    <h2>
                        Et si la suite
                        <br />
                        s’écrivait <em>avec vous ?</em>
                    </h2>
                    <Link href="/admission" className="usk-button usk-button-gold">
                        Faire le premier pas <MoveUpRight size={19} />
                    </Link>
                    <span className="usk-watermark" aria-hidden="true" role="img" aria-label="">
                        USK
                    </span>
                </div>
            </section>
        </App>
    );
}
