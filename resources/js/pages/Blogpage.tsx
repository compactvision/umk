import App from '@/components/layouts/Home/App';
import VideoPlayer from '@/components/news/VideoPlayer';
import { Link, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Camera, ChevronLeft, ChevronRight, Film, Newspaper, Play, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../css/newsroom.css';

type Photo = { path: string; alt?: string; caption?: string };
type Post = {
    id: number;
    video_url?: string;
    videoUrl?: string;
    title: string;
    excerpt?: string;
    images?: { main1?: string; main2?: string; gallery?: Photo[] };
    main_image_1?: string;
    main_image_2?: string;
    gallery?: Photo[];
    publishedAt?: string;
    published_at?: string;
    category?: { name: string };
};
type Story = {
    id: string;
    title: string;
    excerpt: string;
    image: string;
    date?: string;
    category: string;
    format: 'articles' | 'photos' | 'videos';
    href?: string;
    video?: string;
    photos: Photo[];
};
const asset = (path?: string) => (path ? (/^(https?:\/\/|\/)/.test(path) ? path : `/storage/${path}`) : '/assets/usk/campus.jpg');
const dateLabel = (date?: string) =>
    date && Number.isFinite(Date.parse(date))
        ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Vie du campus';
const formats = [
    { id: 'all', label: 'Tout découvrir', icon: Newspaper },
    { id: 'articles', label: 'Articles', icon: Newspaper },
    { id: 'photos', label: 'En photos', icon: Camera },
    { id: 'videos', label: 'En vidéos', icon: Film },
] as const;
const videoStories: Story[] = [
    {
        id: 'video-ebola',
        video: 'https://universitesk.net/uploadsV/videos/video_6a64dc37957947.53391178.mp4',
        title: 'La santé publique au cœur du débat',
        excerpt: 'Une conférence scientifique consacrée à l’épidémie d’Ebola Bundibugyo en RDC.',
        image: 'https://universitesk.net/uploadsV/miniat/mini_6a64dc379f5840.62150198.jpg',
        date: '2026-07-23',
        category: 'Recherche & santé',
        format: 'videos',
        href: 'https://universitesk.net/pages/actualite_video_detail.php?slug=lusk-organise-une-confrence-dbat-de-haut-niveau-sur-lpidmie-debola-bundibugyo-en-rdc',
        photos: [],
    },
    {
        id: 'video-campus',
        video: 'https://universitesk.net/uploadsV/videos/video_6a5e28b8a25731.71853987.mp4',
        title: 'Un campus qui se transforme',
        excerpt: 'L’USK poursuit la modernisation de ses infrastructures académiques.',
        image: '/assets/usk/campus.jpg',
        date: '2026-05-20',
        category: 'Vie universitaire',
        format: 'videos',
        href: 'https://universitesk.net/pages/actualite_video_detail.php?slug=luniversit-simon-kimbangu-poursuit-la-modernisation-de-ses-infrastructures-acadmiques',
        photos: [],
    },
];
const defaultCampusStory: Story = {
    id: 'campus-photos',
    title: 'L’esprit USK, en images.',
    excerpt: 'Des lieux, des visages et une même ambition : apprendre, transmettre et grandir ensemble.',
    image: '/assets/usk/students.jpg',
    category: 'Regards sur le campus',
    format: 'photos',
    photos: [
        { path: '/assets/usk/students.jpg', alt: 'La communauté universitaire' },
        { path: '/assets/usk/campus.jpg', alt: 'Le campus de l’USK' },
        { path: '/assets/usk/academic.jpg', alt: 'La vie académique' },
        { path: '/assets/usk/ceremony.jpg', alt: 'Les rencontres universitaires' },
    ],
};

export default function Blogpage() {
    const props = usePage().props;
    const data = props.posts as { data?: Post[]; current_page?: number; last_page?: number; currentPage?: number; lastPage?: number } | undefined;
    const [search, setSearch] = useState('');
    const [format, setFormat] = useState<string>('all');
    const [album, setAlbum] = useState<Story | null>(null);
    const [photoIndex, setPhotoIndex] = useState(0);
    const dialog = useRef<HTMLDialogElement>(null);
    const page = data?.current_page ?? data?.currentPage ?? 1;
    const last = data?.last_page ?? data?.lastPage ?? 1;
    const articles: Story[] = (data?.data ?? []).map((post) => {
        const gallery = post.gallery ?? post.images?.gallery ?? [];
        const photos = [
            { path: post.main_image_1 || post.images?.main1 || '' },
            { path: post.main_image_2 || post.images?.main2 || '' },
            ...gallery,
        ].filter((photo) => photo.path);
        return {
            id: `post-${post.id}`,
            title: post.title,
            excerpt: post.excerpt || '',
            image: asset(photos[0]?.path),
            date: post.published_at || post.publishedAt,
            category: post.category?.name || 'Vie universitaire',
            format: post.video_url || post.videoUrl ? 'videos' : photos.length > 1 ? 'photos' : 'articles',
            video: post.video_url || post.videoUrl,
            href: `/blog/${post.id}`,
            photos,
        };
    });
    const campusStory = articles.find((story) => story.format === 'photos') || defaultCampusStory;
    const stories = (articles.length ? articles : [...videoStories, defaultCampusStory]).sort(
        (a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0),
    );
    const featured = stories[0];
    const filtered = stories.filter(
        (story) =>
            (format === 'all' || story.format === format) &&
            `${story.title} ${story.excerpt} ${story.category}`.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')),
    );
    const openAlbum = (story: Story) => {
        setPhotoIndex(0);
        setAlbum(story);
    };
    const move = (step: number) => setPhotoIndex((index) => (album?.photos.length ? (index + step + album.photos.length) % album.photos.length : 0));
    useEffect(() => {
        if (!album) {
            dialog.current?.close();
            return;
        }
        dialog.current?.showModal();
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [album]);
    const badge = (story: Story) => (
        <span className="news-format">
            {story.format === 'videos' ? <Film size={14} /> : story.format === 'photos' ? <Camera size={14} /> : <Newspaper size={14} />}
            {story.format === 'videos' ? 'Vidéo' : story.format === 'photos' ? `${story.photos.length} photos` : 'Article'}
        </span>
    );
    const action = (story: Story, className: string, children: React.ReactNode) =>
        !story.href?.startsWith('/blog/') && story.format !== 'articles' ? (
            <button className={className} onClick={() => openAlbum(story)}>
                {children}
            </button>
        ) : (
            <Link className={className} href={story.href!}>
                {children}
            </Link>
        );
    return (
        <App>
            <div className="newsroom">
                <section className="news-intro usk-container">
                    <div className="news-breadcrumb">
                        <Link href="/">Accueil</Link>
                        <span>/</span>Actualités & médiathèque
                    </div>
                    <div className="news-intro-row">
                        <div>
                            <span className="usk-eyebrow">
                                <span className="news-dot" /> LE JOURNAL DE L’USK
                            </span>
                            <h1>
                                Une université.
                                <br />
                                <em>Mille histoires.</em>
                            </h1>
                        </div>
                        <div className="news-intro-note">
                            <p>
                                Les idées qui émergent. Les liens qui se tissent.
                                <br />
                                Les moments qui nous rassemblent.
                            </p>
                            <a href="#le-journal">
                                Explorez la vie de l’USK <ArrowDown size={16} />
                            </a>
                        </div>
                    </div>
                </section>
                <section className="usk-container news-cover-grid" aria-label="À la une">
                    {action(
                        featured,
                        'news-cover',
                        <>
                            <img src={featured.image} alt="" fetchPriority="high" />
                            <div className="news-cover-top">
                                <span className="news-kicker">À LA UNE</span>
                                {badge(featured)}
                            </div>
                            <div className="news-cover-copy">
                                <span>
                                    {featured.category} <i /> {dateLabel(featured.date)}
                                </span>
                                <h2>{featured.title}</h2>
                                <div className="news-cover-bottom">
                                    <p>{featured.excerpt}</p>
                                    <span className="news-round">
                                        {featured.format === 'videos' ? <Play size={23} fill="currentColor" /> : <ArrowUpRight size={25} />}
                                    </span>
                                </div>
                            </div>
                        </>,
                    )}
                    <aside className="news-side">
                        <div className="news-side-heading">
                            <span className="usk-eyebrow">L’UNIVERSITÉ SE RACONTE</span>
                            <span>01 — 02</span>
                        </div>
                        <h2>
                            À voir.
                            <br />
                            <em>À vivre.</em>
                        </h2>
                        <p>Une autre façon de découvrir celles et ceux qui font l’USK.</p>
                        {action(
                            campusStory,
                            'news-mini',
                            <>
                                <div>
                                    <img src={campusStory.image} alt="" />
                                    <span>
                                        <Camera size={19} />
                                    </span>
                                </div>
                                <section>
                                    <small>LE CAMPUS EN IMAGES</small>
                                    <h3>Au plus près de notre communauté</h3>
                                    <span>
                                        Ouvrir la galerie <ArrowUpRight size={15} />
                                    </span>
                                </section>
                            </>,
                        )}
                        <a className="news-side-link" href="#le-journal" onClick={() => setFormat('videos')}>
                            <Film size={18} /> Nos rendez-vous en vidéo <ArrowRight size={18} />
                        </a>
                    </aside>
                </section>
                <section className="news-journal usk-container" id="le-journal">
                    <div className="news-journal-heading">
                        <div>
                            <span className="usk-eyebrow">L’ESSENTIEL, SOUS TOUS LES ANGLES</span>
                            <h2>
                                Le fil de <em>l’actualité.</em>
                            </h2>
                        </div>
                        <span className="news-edition">PHOTOS, VIDÉOS & INSPIRATIONS</span>
                    </div>
                    <div className="news-toolbar">
                        <div className="news-filters" role="group" aria-label="Filtrer par format">
                            {formats.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    aria-pressed={format === id}
                                    className={format === id ? 'is-active' : ''}
                                    onClick={() => setFormat(id)}
                                >
                                    <Icon size={16} />
                                    {label}
                                    <span>{id === 'all' ? stories.length : stories.filter((s) => s.format === id).length}</span>
                                </button>
                            ))}
                        </div>
                        <label className="news-search">
                            <Search size={18} />
                            <input
                                type="search"
                                aria-label="Rechercher dans les actualités de cette page"
                                placeholder="Un sujet, un mot-clé…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className="news-results" aria-live="polite">
                        {filtered.length} publication{filtered.length > 1 ? 's' : ''} sur cette page
                    </div>
                    <div className="news-grid">
                        {filtered.map((story) => (
                            <article className="news-card" key={story.id}>
                                {action(
                                    story,
                                    'news-card-image',
                                    <>
                                        <img src={story.image} alt="" loading="lazy" />
                                        {badge(story)}
                                        <span className="news-card-hover">
                                            {story.format === 'videos' ? (
                                                <Play size={25} fill="currentColor" />
                                            ) : story.format === 'photos' ? (
                                                <Camera size={25} />
                                            ) : (
                                                <ArrowUpRight size={25} />
                                            )}
                                        </span>
                                    </>,
                                )}
                                <div className="news-card-meta">
                                    <span>{story.category}</span>
                                    <span>{dateLabel(story.date)}</span>
                                </div>
                                <h3>{action(story, 'news-title-link', story.title)}</h3>
                                <p>{story.excerpt}</p>
                                {action(
                                    story,
                                    'news-text-link',
                                    <>
                                        {story.format === 'videos'
                                            ? 'Découvrir la vidéo'
                                            : story.format === 'photos'
                                              ? 'Explorer le reportage'
                                              : 'Lire l’article'}
                                        <ArrowUpRight size={17} />
                                    </>,
                                )}
                                {story.format === 'photos' && story.href && (
                                    <Link className="news-article-link" href={story.href}>
                                        Lire aussi l’article <ArrowRight size={14} />
                                    </Link>
                                )}
                            </article>
                        ))}
                    </div>
                    {!filtered.length && (
                        <div className="news-empty">
                            <Search size={30} />
                            <h3>Aucune histoire pour cette recherche.</h3>
                            <p>Essayez un autre mot-clé ou explorez tous les formats.</p>
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setFormat('all');
                                }}
                            >
                                Voir toutes les publications <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                    {last > 1 && (
                        <nav className="news-pagination" aria-label="Pagination des actualités">
                            {page > 1 && (
                                <Link href={`/blog?page=${page - 1}`}>
                                    <ArrowLeft size={16} /> Précédent
                                </Link>
                            )}
                            <span>
                                Page {page} / {last}
                            </span>
                            {page < last && (
                                <Link href={`/blog?page=${page + 1}`}>
                                    Suivant <ArrowRight size={16} />
                                </Link>
                            )}
                        </nav>
                    )}
                    <div className="news-signature">
                        <span className="news-dot" />
                        <p>
                            La vie à l’USK s’écrit chaque jour. <em>Restez dans le mouvement.</em>
                        </p>
                        <span>SCIENCE · CONSCIENCE · VÉRITÉ</span>
                    </div>
                </section>
                <dialog
                    ref={dialog}
                    className="news-lightbox"
                    aria-labelledby="news-album-title"
                    onClose={() => setAlbum(null)}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setAlbum(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') move(1);
                        if (e.key === 'ArrowLeft') move(-1);
                    }}
                >
                    {album && (
                        <>
                            <header>
                                <div>
                                    <span>
                                        {album.video ? 'LE RENDEZ-VOUS VIDÉO' : `REPORTAGE PHOTO · ${photoIndex + 1} / ${album.photos.length}`}
                                    </span>
                                    <h2 id="news-album-title">{album.title}</h2>
                                </div>
                                <button aria-label="Fermer le média" onClick={() => setAlbum(null)}>
                                    <X />
                                </button>
                            </header>
                            <div className="news-lightbox-stage">
                                {album.video ? (
                                    <VideoPlayer source={album.video} poster={album.image} title={album.title} />
                                ) : (
                                    <img src={asset(album.photos[photoIndex].path)} alt={album.photos[photoIndex].alt || album.title} />
                                )}
                                {album.photos.length > 1 && (
                                    <>
                                        <button className="news-photo-prev" aria-label="Photo précédente" onClick={() => move(-1)}>
                                            <ChevronLeft />
                                        </button>
                                        <button className="news-photo-next" aria-label="Photo suivante" onClick={() => move(1)}>
                                            <ChevronRight />
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="news-caption">
                                {album.video ? album.excerpt : album.photos[photoIndex].caption || album.photos[photoIndex].alt || album.title}
                            </p>
                            {album.video && (
                                <a className="news-video-source" href={album.href} target="_blank" rel="noopener noreferrer">
                                    Voir aussi sur le site officiel <ArrowUpRight size={14} />
                                </a>
                            )}
                            <div className="news-thumbnails">
                                {album.photos.map((photo, index) => (
                                    <button
                                        key={`${photo.path}-${index}`}
                                        aria-label={`Afficher la photo ${index + 1}`}
                                        aria-pressed={index === photoIndex}
                                        onClick={() => setPhotoIndex(index)}
                                    >
                                        <img src={asset(photo.path)} alt="" />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </dialog>
            </div>
        </App>
    );
}
