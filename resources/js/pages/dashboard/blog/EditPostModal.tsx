import AdminModal from '@/components/admin/AdminModal';
import VideoFields from '@/components/news/VideoFields';
import { useForm } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Category = { id: number; name: string; color?: string | null };
type GalleryItem = { id?: number; path: string; alt?: string | null; caption?: string | null };

type Post = {
    id: number;
    video_url?: string | null;
    title: string;
    excerpt?: string | null;
    content?: string | null;
    read_time?: string | null;
    gradient?: string | null;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    published_at?: string | null;
    main_image_1?: string | null; // URL
    main_image_2?: string | null; // URL
    gallery?: GalleryItem[];
    category?: { id: number; name: string; color?: string | null } | null;
    tags?: string | null; // si tu stockes en string "tag1, tag2"
};

type Props = {
    post: Post;
    categories: Category[];
    gradientOptions: string[];
    onClose: () => void;
    routeName?: string; // ex: "dashboard.admin.posts.update"
};

// Petit util pour afficher un File
function PreviewFile({ file, className }: { file: File; className?: string }) {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return src ? <img src={src} className={className} /> : null;
}

export default function EditPostModal({ post, categories, gradientOptions, onClose, routeName = 'dashboard.admin.posts.update' }: Props) {
    // --- état pour UI galerie existante ---
    const [removedGalleryIds, setRemovedGalleryIds] = useState<number[]>([]);
    const [existingGallery, setExistingGallery] = useState<GalleryItem[]>(post.gallery ?? []);
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    // --- Inertia form ---
    const {
        data,
        setData,
        errors,
        processing,
        progress,
        post: submit,
        transform,
    } = useForm({
        video_url: post.video_url?.startsWith('https://') ? post.video_url : '',
        video_file: null as File | null,
        remove_video: false,
        title: post.title ?? '',
        category_id: post.category?.id ?? '',
        excerpt: post.excerpt ?? '',
        read_time: post.read_time ?? '',
        tags: post.tags ?? '',
        gradient: post.gradient ?? '',
        content: post.content ?? '',
        featured: !!post.featured,
        status: post.status ?? 'draft',
        published_at: post.published_at ? post.published_at.slice(0, 16) : '', // datetime-local

        // files (nouveaux)
        main_image_1: null as File | null,
        main_image_2: null as File | null,
        gallery_new: [] as File[],

        // meta éditables pour l’existant
        gallery_existing_meta: (post.gallery ?? []).map((g) => ({
            id: g.id!,
            alt: g.alt ?? '',
            caption: g.caption ?? '',
        })),

        // suppressions
        removed_gallery_ids: [] as number[],

        // remplacement explicite main images
        clear_main_image_1: false,
        clear_main_image_2: false,
    });

    // binder quand on supprime un existant
    const removeExistingFromGallery = (id?: number) => {
        if (!id) return;
        setRemovedGalleryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setExistingGallery((prev) => prev.filter((g) => g.id !== id));
        setData('removed_gallery_ids', [...removedGalleryIds, id]);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mulitpart transform
        transform((payload) => {
            const fd = new FormData();

            // champs simples
            fd.append('video_url', payload.video_file || payload.remove_video ? '' : payload.video_url);
            fd.append('remove_video', payload.remove_video ? '1' : '0');
            if (payload.video_file) fd.append('video_file', payload.video_file);
            fd.append('title', payload.title ?? '');
            fd.append('category_id', payload.category_id ?? '');
            fd.append('excerpt', payload.excerpt ?? '');
            fd.append('read_time', payload.read_time ?? '');
            fd.append('tags', payload.tags ?? '');
            fd.append('gradient', payload.gradient ?? '');
            fd.append('content', payload.content ?? '');
            fd.append('featured', payload.featured ? '1' : '0');
            fd.append('status', payload.status ?? 'draft');
            if (payload.published_at) {
                fd.append('published_at', payload.published_at);
            }

            // flags remplacement / clear des main images
            fd.append('remove_main_image_1', payload.clear_main_image_1 ? '1' : '0');
            fd.append('remove_main_image_2', payload.clear_main_image_2 ? '1' : '0');

            // fichiers
            if (payload.main_image_1) fd.append('main_image_1', payload.main_image_1);
            if (payload.main_image_2) fd.append('main_image_2', payload.main_image_2);
            payload.gallery_new?.forEach((f: File, i: number) => {
                fd.append(`gallery[${i}]`, f);
            });

            // suppressions existantes
            payload.removed_gallery_ids?.forEach((id: number, i: number) => {
                fd.append(`removed_gallery_ids[${i}]`, String(id));
            });

            // meta existantes éditées
            payload.gallery_existing_meta?.forEach((m: { id: number; alt: string; caption: string }, i: number) => {
                fd.append(`gallery_existing_meta[${i}][id]`, String(m.id));
                fd.append(`gallery_existing_meta[${i}][alt]`, m.alt ?? '');
                fd.append(`gallery_existing_meta[${i}][caption]`, m.caption ?? '');
            });

            // Méthode HTTP override
            fd.append('_method', 'PUT');

            return fd;
        });

        submit(route(routeName, post.id), {
            forceFormData: true,
            onSuccess: () => onClose(),
        });
    };

    // helpers pour lier meta existantes
    const updateExistingMeta = (id: number, field: 'alt' | 'caption', val: string) => {
        setData(
            'gallery_existing_meta',
            data.gallery_existing_meta.map((m) => (m.id === id ? { ...m, [field]: val } : m)),
        );
    };

    return (
        <AdminModal
            wide
            title="Modifier l’actualité"
            description="Mettez à jour le contenu, les images et les paramètres de publication."
            onClose={onClose}
            formId="post-edit-form"
            submitLabel="Enregistrer les modifications"
            busy={processing}
            errors={errors}
        >
            <form id="post-edit-form" onSubmit={onSubmit} className="admin-modal-form space-y-6">
                <h3 className="admin-modal-section">Les informations essentielles</h3>
                {/* Row 1 */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="post-edit-title" className="block text-sm font-medium text-slate-700">
                            Titre *
                        </label>
                        <input
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            id="post-edit-title"
                            name="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="post-edit-category_id" className="block text-sm font-medium text-slate-700">
                            Catégorie
                        </label>
                        <select
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            id="post-edit-category_id"
                            name="category_id"
                            value={data.category_id ?? ''}
                            onChange={(e) => setData('category_id', e.target.value)}
                        >
                            <option value="">—</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                    </div>
                </div>

                {/* Row 2 */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Extrait (300)</label>
                        <textarea
                            rows={4}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                            id="post-edit-excerpt"
                            name="excerpt"
                            value={data.excerpt}
                            onChange={(e) => setData('excerpt', e.target.value)}
                            maxLength={300}
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Brève description de l'article</span>
                            <span>{(data.excerpt ?? '').length}/300</span>
                        </div>
                        {errors.excerpt && <p className="text-sm text-red-500">{errors.excerpt}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="post-edit-read_time" className="block text-sm font-medium text-slate-700">
                                Temps de lecture
                            </label>
                            <input
                                placeholder="7 min"
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                id="post-edit-read_time"
                                name="read_time"
                                value={data.read_time}
                                onChange={(e) => setData('read_time', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="post-edit-tags" className="block text-sm font-medium text-slate-700">
                                Tags
                            </label>
                            <input
                                placeholder="tag1, tag2, tag3"
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                id="post-edit-tags"
                                name="tags"
                                value={data.tags}
                                onChange={(e) => setData('tags', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Gradient UI */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Style visuel de l’article</label>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                        {gradientOptions.map((gradient) => (
                            <button
                                key={gradient}
                                type="button"
                                className={`group relative h-12 overflow-hidden rounded-xl transition-all ${
                                    data.gradient === gradient ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                }`}
                                onClick={() => setData('gradient', gradient)}
                            >
                                <div className={`h-full w-full bg-gradient-to-r ${gradient}`} />
                                {data.gradient === gradient && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6 text-white"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" value={data.gradient ?? ''} onChange={(e) => setData('gradient', e.target.value)} />
                </div>

                <h3 className="admin-modal-section">Le contenu de l’actualité</h3>
                {/* Content */}
                <div className="space-y-2">
                    <label htmlFor="post-edit-content" className="block text-sm font-medium text-slate-700">
                        Contenu
                    </label>
                    <textarea
                        rows={8}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        id="post-edit-content"
                        name="content"
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                    />
                    {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                </div>

                <VideoFields
                    url={data.video_url}
                    file={data.video_file}
                    onUrl={(value) => {
                        setData('video_url', value);
                        setData('remove_video', false);
                    }}
                    onFile={(value) => {
                        setData('video_file', value);
                        setData('remove_video', false);
                    }}
                    errors={errors}
                    existing={post.video_url}
                    remove={data.remove_video}
                    onRemove={(value) => {
                        setData('remove_video', value);
                        if (value) {
                            setData('video_url', '');
                            setData('video_file', null);
                        }
                    }}
                />
                <h3 className="admin-modal-section">Les images et la galerie</h3>
                {/* Images principales (existantes + remplacement) */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* main 1 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Image principale 1</label>
                        {post.main_image_1 && !data.clear_main_image_1 && !data.main_image_1 ? (
                            <div className="relative">
                                <img src={post.main_image_1} className="h-32 w-full rounded-xl object-cover shadow" />
                                <div className="mt-2 flex gap-3">
                                    <label
                                        htmlFor="replace_main_image_1"
                                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Remplacer
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setData('clear_main_image_1', true)}
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <input
                                    id="replace_main_image_1"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('main_image_1', e.target.files?.[0] ?? null)}
                                    className="sr-only"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('main_image_1', e.target.files?.[0] ?? null)}
                                    className="sr-only"
                                    id="main_image_1"
                                />
                                <label
                                    htmlFor="main_image_1"
                                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/50 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50"
                                >
                                    {data.main_image_1 ? (
                                        <PreviewFile file={data.main_image_1} className="h-full w-full rounded-xl object-cover" />
                                    ) : (
                                        <>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-10 w-10 text-slate-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <span className="mt-2 text-sm text-slate-500">Cliquez pour télécharger</span>
                                        </>
                                    )}
                                </label>
                                {post.main_image_1 && data.clear_main_image_1 && (
                                    <p className="mt-2 text-xs text-rose-600">Cette image sera supprimée lors de l’enregistrement.</p>
                                )}
                            </div>
                        )}
                        {errors.main_image_1 && <p className="text-sm text-red-500">{errors.main_image_1}</p>}
                    </div>

                    {/* main 2 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Image principale 2</label>
                        {post.main_image_2 && !data.clear_main_image_2 && !data.main_image_2 ? (
                            <div className="relative">
                                <img src={post.main_image_2} className="h-32 w-full rounded-xl object-cover shadow" />
                                <div className="mt-2 flex gap-3">
                                    <label
                                        htmlFor="replace_main_image_2"
                                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Remplacer
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setData('clear_main_image_2', true)}
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                                <input
                                    id="replace_main_image_2"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('main_image_2', e.target.files?.[0] ?? null)}
                                    className="sr-only"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('main_image_2', e.target.files?.[0] ?? null)}
                                    className="sr-only"
                                    id="main_image_2"
                                />
                                <label
                                    htmlFor="main_image_2"
                                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/50 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50"
                                >
                                    {data.main_image_2 ? (
                                        <PreviewFile file={data.main_image_2} className="h-full w-full rounded-xl object-cover" />
                                    ) : (
                                        <>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-10 w-10 text-slate-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <span className="mt-2 text-sm text-slate-500">Cliquez pour télécharger</span>
                                        </>
                                    )}
                                </label>
                                {post.main_image_2 && data.clear_main_image_2 && (
                                    <p className="mt-2 text-xs text-rose-600">Cette image sera supprimée lors de l’enregistrement.</p>
                                )}
                            </div>
                        )}
                        {errors.main_image_2 && <p className="text-sm text-red-500">{errors.main_image_2}</p>}
                    </div>
                </div>

                {/* Galerie existante + nouvelles */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Galerie descriptive</label>

                    {/* Galerie existante (éditable) */}
                    {existingGallery.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {existingGallery.map((g, imageIndex) => (
                                <div key={g.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                                    <button
                                        type="button"
                                        className="shrink-0 self-start"
                                        aria-label={`Agrandir l’image ${imageIndex + 1}`}
                                        onClick={() => setSelectedImage(imageIndex)}
                                    >
                                        <img src={g.path} alt={g.alt || 'Image de la galerie'} className="h-20 w-20 rounded-lg object-cover" />
                                    </button>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <input
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Alt"
                                            value={data.gallery_existing_meta.find((m) => m.id === g.id)?.alt ?? ''}
                                            onChange={(e) => updateExistingMeta(g.id!, 'alt', e.target.value)}
                                        />
                                        <input
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                            placeholder="Légende"
                                            value={data.gallery_existing_meta.find((m) => m.id === g.id)?.caption ?? ''}
                                            onChange={(e) => updateExistingMeta(g.id!, 'caption', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeExistingFromGallery(g.id)}
                                        className="h-8 w-8 self-start rounded-full bg-rose-500 text-white hover:bg-rose-600"
                                        title="Supprimer"
                                    >
                                        <X size={16} strokeWidth={1.8} aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ajout nouvelles images */}
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setData('gallery_new', Array.from(e.target.files ?? []))}
                            className="sr-only"
                            id="gallery_new"
                        />
                        <label
                            htmlFor="gallery_new"
                            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/50 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <span className="text-sm text-slate-500">Ajouter de nouvelles images</span>
                        </label>
                    </div>

                    {/* preview nouvelles */}
                    {data.gallery_new?.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                            {data.gallery_new.map((f, i) => (
                                <div key={i} className="group relative">
                                    <PreviewFile file={f} className="h-20 w-full rounded-lg object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = [...data.gallery_new];
                                            next.splice(i, 1);
                                            setData('gallery_new', next);
                                        }}
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                        <X size={16} strokeWidth={1.8} aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {errors.gallery && <p className="text-sm text-red-500">{errors.gallery}</p>}

                    {progress && (
                        <div className="w-full rounded-full bg-slate-200">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    )}
                </div>

                <h3 className="admin-modal-section">La publication</h3>
                {/* Meta */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                        <input
                            id="post-edit-featured"
                            type="checkbox"
                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={data.featured}
                            onChange={(e) => setData('featured', e.target.checked)}
                        />
                        <label htmlFor="post-edit-featured" className="text-sm font-medium text-slate-700">
                            Mettre en avant
                        </label>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="post-edit-status" className="block text-sm font-medium text-slate-700">
                            Statut
                        </label>
                        <select
                            id="post-edit-status"
                            name="status"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value as 'draft' | 'published' | 'archived')}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        >
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                            <option value="archived">Archivé</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="post-edit-published_at" className="block text-sm font-medium text-slate-700">
                            Publication (optionnel)
                        </label>
                        <input
                            type="datetime-local"
                            id="post-edit-published_at"
                            name="published_at"
                            value={data.published_at}
                            onChange={(e) => setData('published_at', e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                    </div>
                </div>
            </form>
            {selectedImage !== null && existingGallery[selectedImage] && (
                <Dialog.Root
                    open
                    onOpenChange={(open) => {
                        if (!open) setSelectedImage(null);
                    }}
                >
                    <Dialog.Portal>
                        <Dialog.Overlay className="admin-image-overlay" />
                        <Dialog.Content className="admin-image-preview" aria-describedby={undefined}>
                            <Dialog.Title className="sr-only">Aperçu de l’image de la galerie</Dialog.Title>
                            <Dialog.Close className="admin-image-close" aria-label="Fermer l’aperçu">
                                Fermer <X size={16} strokeWidth={1.8} aria-hidden="true" className="inline-block align-middle" />
                            </Dialog.Close>
                            <img src={existingGallery[selectedImage].path} alt={existingGallery[selectedImage].alt || 'Image de la galerie'} />
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </AdminModal>
    );
}
