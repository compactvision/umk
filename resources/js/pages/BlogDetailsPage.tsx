import App from '@/components/layouts/Home/App';
import VideoPlayer, { mediaUrl } from '@/components/news/VideoPlayer';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check, ChevronLeft, ChevronRight, Clock3, Film, Link2, Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../css/news-detail.css';

type Photo = { path: string; alt?: string; caption?: string };
type Story = {
    id: number;
    title: string;
    excerpt?: string;
    main_image_1?: string;
    video_url?: string;
    published_at?: string;
    category?: { name: string };
};
type Post = Story & {
    main_image_2?: string;
    gallery?: Photo[];
    body_text?: string;
    read_time?: string;
    author?: { name?: string; first_name?: string; last_name?: string };
};
const dateLabel = (value?: string) =>
    value && Number.isFinite(Date.parse(value))
        ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Université Simon Kimbangu';

export default function BlogDetailsPage({ post, related = [] }: { post: Post; related?: Story[] }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);
    const [progress, setProgress] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cover = mediaUrl(post.main_image_1) || '/assets/usk/campus.jpg';
    const photos = [...(post.main_image_2 ? [{ path: post.main_image_2, alt: post.title }] : []), ...(post.gallery || [])].filter(
        (photo) => photo.path,
    );
    const author = post.author?.name || [post.author?.first_name, post.author?.last_name].filter(Boolean).join(' ') || 'La rédaction USK';
    const paragraphs = (post.body_text || '')
        .split(/\n\s*\n/)
        .map((text) => text.trim())
        .filter(Boolean);
    const reading = `${Math.max(1, Math.ceil((post.body_text || '').split(/\s+/).length / 200))} min de lecture`;
    useEffect(() => {
        const update = () => {
            const height = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => {
            window.removeEventListener('scroll', update);
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);
    useEffect(() => {
        if (selected === null) {
            dialog.current?.close();
            return;
        }
        if (!dialog.current?.open) dialog.current?.showModal();
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [selected]);
    const move = (step: number) => setSelected((index) => (index === null ? null : (index + step + photos.length) % photos.length));
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setCopyError(false);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 3000);
        } catch {
            setCopyError(true);
        }
    };
    return (
        <App>
            <article className="news-detail">
                <div className="detail-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
                <header className="detail-header usk-container">
                    <nav className="detail-breadcrumb" aria-label="Fil d’Ariane">
                        <Link href="/">Accueil</Link>
                        <span>/</span>
                        <Link href="/blog">Actualités</Link>
                        <span>/</span>
                        <span>{post.video_url ? 'Le rendez-vous vidéo' : 'Le journal'}</span>
                    </nav>
                    <div className="detail-kickers">
                        <span>{post.category?.name || 'Vie universitaire'}</span>
                        <span>
                            {post.video_url ? <Film size={13} /> : <Camera size={13} />}
                            {post.video_url ? 'En vidéo' : photos.length ? 'Article & reportage photo' : 'Le journal de l’USK'}
                        </span>
                    </div>
                    <h1>{post.title}</h1>
                    {post.excerpt && <p className="detail-deck">{post.excerpt}</p>}
                    <div className="detail-byline">
                        <div className="detail-author-mark">USK</div>
                        <div>
                            <strong>{author}</strong>
                            <span>{dateLabel(post.published_at)}</span>
                        </div>
                        <span className="detail-read">
                            <Clock3 size={14} />
                            {post.read_time || reading}
                        </span>
                        <button onClick={copy} className="detail-share">
                            {copied ? <Check size={16} /> : <Link2 size={16} />}
                            {copied ? 'Lien copié' : 'Partager l’article'}
                        </button>
                    </div>
                    <p className="detail-share-feedback" role="status">
                        {copyError ? 'La copie n’est pas disponible. Vous pouvez copier l’adresse depuis votre navigateur.' : ''}
                    </p>
                </header>
                <figure className={`detail-main-media usk-container ${post.video_url ? 'has-video' : ''}`}>
                    {post.video_url ? (
                        <VideoPlayer source={post.video_url} poster={cover} title={post.title} />
                    ) : (
                        <img src={cover} alt={post.title} fetchPriority="high" />
                    )}
                    <figcaption>
                        <span>{post.video_url ? 'LE RENDEZ-VOUS VIDÉO' : 'REGARDS SUR L’USK'}</span>
                        <span>Université Simon Kimbangu · Kinshasa</span>
                    </figcaption>
                </figure>
                <div className="detail-layout usk-container">
                    <aside className="detail-aside">
                        <Link href="/blog">
                            <ArrowLeft size={16} />
                            Toutes les actualités
                        </Link>
                        <div>
                            <span className="detail-eyebrow">DANS CETTE HISTOIRE</span>
                            <a href="#le-recit">
                                Le récit <ArrowUpRight size={14} />
                            </a>
                            {photos.length > 0 && (
                                <a href="#en-images">
                                    En images <span>{photos.length}</span>
                                </a>
                            )}
                            {related.length > 0 && (
                                <a href="#a-decouvrir">
                                    À découvrir aussi <ArrowUpRight size={14} />
                                </a>
                            )}
                        </div>
                        <p>
                            Science.
                            <br />
                            Conscience.
                            <br />
                            <em>Vérité.</em>
                        </p>
                    </aside>
                    <div className="detail-body" id="le-recit">
                        <div className="detail-section-label">
                            <span className="detail-eyebrow">{post.video_url ? 'POUR ALLER PLUS LOIN' : 'LE RÉCIT'}</span>
                            <span>UNIVERSITÉ SIMON KIMBANGU</span>
                        </div>
                        {paragraphs.length > 0 ? (
                            paragraphs.map((paragraph, index) => (
                                <p className={index === 0 ? 'detail-first-paragraph' : ''} key={index}>
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p>
                                {post.video_url
                                    ? 'Retrouvez les temps forts de cette actualité dans le reportage vidéo ci-dessus.'
                                    : post.excerpt || 'Retrouvez les temps forts de la vie universitaire en images.'}
                            </p>
                        )}
                        <div className="detail-end-mark">◆</div>
                        <div className="detail-editor">
                            <span>USK</span>
                            <div>
                                <strong>Le journal de l’Université Simon Kimbangu</strong>
                                <p>Les idées, les rencontres et les moments qui font vivre notre communauté.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {photos.length > 0 && (
                    <section className="detail-gallery-section" id="en-images">
                        <div className="usk-container">
                            <div className="detail-section-heading">
                                <div>
                                    <span className="detail-eyebrow">PROLONGER LE REGARD</span>
                                    <h2>
                                        L’histoire, <em>en images.</em>
                                    </h2>
                                </div>
                                <span>
                                    <Camera size={16} />
                                    {photos.length} photographie{photos.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="detail-photo-grid">
                                {photos.map((photo, index) => (
                                    <figure key={`${photo.path}-${index}`}>
                                        <button
                                            onClick={() => setSelected(index)}
                                            aria-label={`Agrandir la photo ${index + 1} : ${photo.alt || post.title}`}
                                        >
                                            <img src={mediaUrl(photo.path)} alt={photo.alt || post.title} loading="lazy" />
                                            <span className="detail-photo-number">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="detail-photo-expand">
                                                <Maximize2 size={18} />
                                            </span>
                                        </button>
                                        {photo.caption && <figcaption>{photo.caption}</figcaption>}
                                    </figure>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                <section className="detail-bottom usk-container" id="a-decouvrir">
                    {related.length > 0 && (
                        <>
                            <div className="detail-section-heading">
                                <div>
                                    <span className="detail-eyebrow">LE FIL CONTINUE</span>
                                    <h2>
                                        D’autres histoires <em>à découvrir.</em>
                                    </h2>
                                </div>
                                <Link href="/blog">
                                    Tout le journal <ArrowRight size={17} />
                                </Link>
                            </div>
                            <div className="detail-related-grid">
                                {related.map((story) => (
                                    <Link href={`/blog/${story.id}`} key={story.id} className="detail-related-card">
                                        <div>
                                            <img src={mediaUrl(story.main_image_1) || '/assets/usk/campus.jpg'} alt="" loading="lazy" />
                                            {story.video_url && (
                                                <span>
                                                    <Film size={14} />
                                                    Vidéo
                                                </span>
                                            )}
                                        </div>
                                        <small>
                                            {story.category?.name || 'Vie universitaire'} · {dateLabel(story.published_at)}
                                        </small>
                                        <h3>{story.title}</h3>
                                        <span>
                                            Découvrir <ArrowUpRight size={17} />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="detail-return">
                        <Link href="/blog">
                            <ArrowLeft size={16} />
                            Retour aux actualités
                        </Link>
                        <span>UNE UNIVERSITÉ. MILLE HISTOIRES.</span>
                    </div>
                </section>
            </article>
            <dialog
                ref={dialog}
                className="detail-lightbox"
                aria-labelledby="detail-photo-title"
                onClose={() => setSelected(null)}
                onClick={(e) => {
                    if (e.target === e.currentTarget) setSelected(null);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') move(-1);
                    if (e.key === 'ArrowRight') move(1);
                }}
            >
                {selected !== null && photos[selected] && (
                    <>
                        <header>
                            <h2 id="detail-photo-title">{photos[selected].alt || post.title}</h2>
                            <button aria-label="Fermer la photo" onClick={() => setSelected(null)}>
                                <X size={24} />
                            </button>
                        </header>
                        <div className="detail-lightbox-image">
                            <img src={mediaUrl(photos[selected].path)} alt={photos[selected].alt || post.title} />
                            {photos.length > 1 && (
                                <>
                                    <button className="detail-prev" aria-label="Photo précédente" onClick={() => move(-1)}>
                                        <ChevronLeft />
                                    </button>
                                    <button className="detail-next" aria-label="Photo suivante" onClick={() => move(1)}>
                                        <ChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                        <footer>
                            <p>{photos[selected].caption || 'Université Simon Kimbangu'}</p>
                            <span>
                                {selected + 1} / {photos.length}
                            </span>
                        </footer>
                    </>
                )}
            </dialog>
        </App>
    );
}
