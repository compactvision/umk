import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import VideoPlayer from '@/components/news/VideoPlayer';
import { gradientOptions } from '@/components/section/dashboard/blog/utils/gradientOptions';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { categoryBadgeStyle } from './category-badge';
import EditPostModal from './EditPostModal';

// ---- Types ----
type GalleryItem = { id: number; path: string; alt?: string | null; caption?: string | null };

type Post = {
    id: number;
    uuid: string;
    video_url?: string | null;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null; // HTML ou texte brut
    read_time?: string | null;
    gradient?: string | null;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    published_at?: string | null;

    main_image_1?: string | null; // URL complète (Storage::url)
    main_image_2?: string | null; // URL complète
    gallery?: GalleryItem[]; // [{path, alt?, caption?}]

    views: number;
    likes: number;

    category?: { id: number; name: string; color?: string } | null;
    author?: { id: number; name: string } | null;

    created_at?: string | null;
};

type PageProps = {
    post: Post;
    categories: { id: number; name: string }[];
    galleryRevision: string;
    openEdit?: boolean;
    can?: {
        update?: boolean;
        delete?: boolean;
    };
};

export default function Show({ post, categories, galleryRevision, openEdit: initialEdit, can }: PageProps) {
    const cover1 = post.main_image_1 || null;
    const cover2 = post.main_image_2 || null;
    const gallery = post.gallery ?? [];
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [openEdit, setOpenEdit] = useState(initialEdit ?? false);

    const { delete: destroy, processing } = useForm({});

    const onDelete = () => {
        if (!confirm('Supprimer définitivement cet article ?')) return;
        destroy(route('dashboard.admin.posts.destroy', post.id));
    };

    const closeEditor = () => {
        setOpenEdit(false);
        const url = new URL(window.location.href);
        if (url.searchParams.has('edit')) {
            url.searchParams.delete('edit');
            router.replace({ url: url.href, props: (current) => ({ ...current, openEdit: false }), preserveState: true, preserveScroll: true });
        }
    };

    const isHtml = useMemo(() => {
        const c = post.content ?? '';
        return c.includes('<') && c.includes('>');
    }, [post.content]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <Dashboard>
            <Head title={`Blog — ${post.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
                    {/* Breadcrumb + Actions */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="admin-detail-context">GESTION DES ACTUALITÉS</span>

                        <div className="flex items-center gap-3">
                            {can?.update && (
                                <button
                                    onClick={() => setOpenEdit(true)}
                                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 shadow-sm transition-all hover:shadow-md"
                                >
                                    <span className="relative z-10 flex items-center gap-2">Éditer</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </button>
                            )}
                            {can?.delete && (
                                <button
                                    onClick={onDelete}
                                    disabled={processing}
                                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Supprimer
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-8 rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            {post.category?.name && (
                                <span
                                    className="rounded-full px-3 py-1.5 text-xs font-medium shadow-md"
                                    style={categoryBadgeStyle(post.category.color)}
                                >
                                    {post.category.name}
                                </span>
                            )}
                            <span
                                className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-md ${
                                    post.status === 'published'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : post.status === 'draft'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                                {post.status === 'published' ? 'Publié' : post.status === 'draft' ? 'Brouillon' : 'Archivé'}
                            </span>
                            {post.featured && (
                                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-md">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        À la une
                                    </span>
                                </span>
                            )}
                            {post.read_time && (
                                <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-md">
                                    <span className="flex items-center gap-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3 w-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        {post.read_time}
                                    </span>
                                </span>
                            )}
                        </div>

                        <h1 className="mb-4 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                            {post.title}
                        </h1>

                        {post.excerpt && <p className="mb-4 text-lg text-slate-600">{post.excerpt}</p>}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            {post.author?.name && (
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-medium text-white">
                                        {post.author.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>Par {post.author.name}</span>
                                </div>
                            )}
                            {post.published_at && (
                                <div className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>Publié le {formatDate(post.published_at)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                <span>{post.views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <span>{post.likes}</span>
                            </div>
                        </div>
                    </div>

                    {/* Two main images */}
                    {(cover1 || cover2) && (
                        <div className="mb-8 grid gap-6 sm:grid-cols-2">
                            {cover1 && (
                                <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl">
                                    <img
                                        src={cover1}
                                        alt={post.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </div>
                            )}
                            {cover2 && (
                                <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl">
                                    <img
                                        src={cover2}
                                        alt={post.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gallery */}
                    {gallery.length > 0 && (
                        <div className="mb-8 rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-indigo-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Galerie descriptive
                            </h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {gallery.map((g, i) => (
                                    <div
                                        key={i}
                                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl"
                                        onClick={() => setSelectedImage(i)}
                                    >
                                        <img
                                            src={g.path}
                                            alt={g.alt ?? `image-${i}`}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                        {(g.alt || g.caption) && (
                                            <div className="absolute right-0 bottom-0 left-0 translate-y-full transform p-3 text-white transition-transform group-hover:translate-y-0">
                                                <p className="truncate text-sm font-medium">{g.caption ?? g.alt}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm md:p-8">
                        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Contenu
                        </h2>

                        {post.content ? (
                            isHtml ? (
                                <div
                                    className="prose prose-slate prose-headings:mt-6 prose-headings:mb-3 prose-p:leading-7 prose-img:rounded-xl prose-img:shadow-lg max-w-none"
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />
                            ) : (
                                <div className="text-lg leading-7 whitespace-pre-line text-slate-800">{post.content}</div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mb-4 h-16 w-16 text-slate-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="text-lg text-slate-500">Aucun contenu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {post.video_url && (
                <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-xl font-semibold">La vidéo de l’actualité</h2>
                    <VideoPlayer source={post.video_url} poster={cover1 || undefined} title={post.title} />
                </section>
            )}
            {/* Image Modal */}
            {selectedImage !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-h-[90vh] max-w-4xl">
                        <button
                            className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={gallery[selectedImage].path}
                            alt={gallery[selectedImage].alt ?? `image-${selectedImage}`}
                            className="max-h-[90vh] max-w-full rounded-lg object-contain"
                        />
                        {(gallery[selectedImage].alt || gallery[selectedImage].caption) && (
                            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                <p className="text-lg font-medium">{gallery[selectedImage].caption ?? gallery[selectedImage].alt}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {openEdit && can?.update && (
                <EditPostModal
                    post={post}
                    categories={categories}
                    galleryRevision={galleryRevision}
                    gradientOptions={gradientOptions}
                    onClose={closeEditor}
                />
            )}
        </Dashboard>
    );
}
