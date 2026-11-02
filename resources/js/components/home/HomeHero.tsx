import PublicImage from '@/components/seo/PublicImage';
import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, GraduationCap, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import '../../../css/home-hero.css';
import { HERO_DURATION, heroSlides } from './heroSlides';

function HeroVideo({ source, paused }: { source: string; paused: boolean }) {
    const video = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (paused) video.current?.pause();
        else void video.current?.play().catch(() => {});
    }, [paused]);
    return (
        <video ref={video} className="usk-hero-video" muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1}>
            <source src={source} />
        </video>
    );
}
export default function HomeHero() {
    const [current, setCurrent] = useState(0);
    const [cycle, setCycle] = useState(0);
    const [loaded, setLoaded] = useState([0]);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [saveData, setSaveData] = useState(false);
    const [visible, setVisible] = useState(true);
    const [inView, setInView] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);
    const playing = !paused && !reducedMotion && !saveData && visible && inView;
    useEffect(() => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncMotion = () => setReducedMotion(motion.matches);
        const syncVisibility = () => setVisible(!document.hidden);
        syncMotion();
        syncVisibility();
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        setSaveData(Boolean(connection?.saveData));
        motion.addEventListener('change', syncMotion);
        document.addEventListener('visibilitychange', syncVisibility);
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => {
            motion.removeEventListener('change', syncMotion);
            document.removeEventListener('visibilitychange', syncVisibility);
            observer.disconnect();
        };
    }, []);
    // Stage the next photo after the first paint, instead of competing with the hero's first image.
    useEffect(() => {
        if (saveData || reducedMotion) return;
        const next = (current + 1) % heroSlides.length;
        const timeout = window.setTimeout(() => setLoaded((items) => (items.includes(next) ? items : [...items, next])), 1500);
        return () => window.clearTimeout(timeout);
    }, [current, saveData, reducedMotion]);
    useEffect(() => {
        if (!playing) return;
        const timeout = window.setTimeout(() => {
            const next = (current + 1) % heroSlides.length;
            setLoaded((items) => (items.includes(next) ? items : [...items, next]));
            setCurrent(next);
            setCycle((value) => value + 1);
        }, HERO_DURATION);
        return () => window.clearTimeout(timeout);
    }, [current, playing, cycle]);
    const select = (index: number) => {
        setLoaded((items) => (items.includes(index) ? items : [...items, index]));
        setCurrent(index);
        setCycle((value) => value + 1);
        setPaused(true);
    };
    const pauseForInteraction = () => setPaused(true);
    const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            select((current + 1) % heroSlides.length);
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            select((current - 1 + heroSlides.length) % heroSlides.length);
        }
    };
    return (
        <section
            ref={sectionRef}
            className="usk-hero usk-hero-cinema"
            aria-roledescription="diaporama"
            aria-label="Découvrir l’Université Simon Kimbangu"
            onFocusCapture={pauseForInteraction}
            onKeyDown={handleKeys}
        >
            <div className="usk-hero-stage" aria-hidden="true">
                {heroSlides.map((slide, index) => {
                    if (!loaded.includes(index)) return null;
                    const active = index === current;
                    return (
                        <div key={slide.id} className={`usk-hero-frame ${active ? 'is-active' : ''}`}>
                            <PublicImage
                                className="usk-hero-image"
                                src={slide.image}
                                alt=""
                                fetchPriority={index === 0 ? 'high' : 'low'}
                                loading="eager"
                                sizes="100vw"
                                style={{ objectPosition: slide.position }}
                            />
                            {slide.video && active && !reducedMotion && !saveData && (
                                <HeroVideo key={slide.video} source={slide.video} paused={!playing} />
                            )}
                        </div>
                    );
                })}
                <div className="usk-hero-grain" />
            </div>
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
            <div className="usk-hero-editorial" aria-hidden="true">
                <span className="usk-hero-editorial-line" />
                <div key={current} className="usk-hero-editorial-copy">
                    <span>{heroSlides[current].eyebrow}</span>
                    <p>{heroSlides[current].title}</p>
                </div>
            </div>
            <div className="usk-cinema-controls" role="group" aria-label="Commandes du diaporama">
                <div className="usk-cinema-meta">
                    <span>Regards sur l’USK</span>
                    <span className="usk-cinema-count">
                        {String(current + 1).padStart(2, '0')}
                        <i>/</i>
                        {String(heroSlides.length).padStart(2, '0')}
                    </span>
                </div>
                <div className="usk-cinema-navigation">
                    <div className="usk-cinema-progress" role="group" aria-label="Choisir une image">
                        {heroSlides.map((slide, index) => (
                            <button
                                type="button"
                                key={slide.id}
                                onClick={() => select(index)}
                                aria-label={`Image ${index + 1} : ${slide.eyebrow}`}
                                aria-pressed={index === current}
                                className={index === current ? 'is-current' : ''}
                            >
                                <span>
                                    <i
                                        key={index === current ? `${cycle}-${playing}` : 'idle'}
                                        style={{ animationDuration: `${HERO_DURATION}ms`, animationPlayState: playing ? 'running' : 'paused' }}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        className="usk-cinema-button"
                        onClick={() => select((current - 1 + heroSlides.length) % heroSlides.length)}
                        aria-label="Image précédente"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        className="usk-cinema-button"
                        onClick={() => select((current + 1) % heroSlides.length)}
                        aria-label="Image suivante"
                    >
                        <ChevronRight size={18} />
                    </button>
                    {!reducedMotion && !saveData && (
                        <button
                            type="button"
                            className="usk-cinema-button usk-cinema-toggle"
                            onClick={() => setPaused((value) => !value)}
                            aria-label={paused || reducedMotion ? 'Démarrer le défilement automatique' : 'Mettre le diaporama en pause'}
                            aria-pressed={!paused && !reducedMotion}
                        >
                            {!paused && !reducedMotion ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                    )}
                </div>
            </div>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
                {paused ? `Image ${current + 1} sur ${heroSlides.length} : ${heroSlides[current].alt}` : ''}
            </span>
        </section>
    );
}
