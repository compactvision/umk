import AdminModal from '@/components/admin/AdminModal';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import VideoFields from '@/components/news/VideoFields';
import { Head, Link, useForm } from '@inertiajs/react';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Category = { id: number; name: string; color?: string; description?: string };
type Post = {
    id: number;
    uuid: string;
    video_url?: string | null;
    title: string;
    slug: string;
    excerpt?: string | null;
    main_image_1?: string | null;
    main_image_2?: string | null;
    views: number;
    likes: number;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    published_at?: string | null;
    category?: { id: number; name: string; color?: string } | null;
    author?: { id: number; name: string } | null;
    created_at: string;
};

type PaginationLink = { url: string | null; label: string; active: boolean };
type Pagination<T> = {
    data: T[];
    links: PaginationLink[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    categories: Category[];
    posts: Pagination<Post>;
    filters?: { q?: string; category_id?: string; status?: string };
    flash?: {
        success?: string;
        error?: string;
    };
};

export default function Index(props: PageProps) {
    const { categories, posts, filters, flash } = props;

    // ------- UI State -------
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [q, setQ] = useState(filters?.q ?? '');
    const [categoryId, setCategoryId] = useState(filters?.category_id ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(true);

    // ------- Create Form (Inertia) -------
    const { data, setData, post, processing, errors, reset, transform, progress } = useForm<{
        video_url: string;
        video_file: File | null;
        title: string;
        category_id: string | number | null;
        excerpt: string;
        content: string;
        read_time: string;
        gradient: string;
        featured: boolean;
        status: 'draft' | 'published' | 'archived';
        published_at: string;
        main_image_1: File | null;
        main_image_2: File | null;
        gallery: File[];
        tags: string;
    }>({
        video_url: '',
        video_file: null,
        title: '',
        category_id: '',
        excerpt: '',
        content: '',
        read_time: '',
        gradient: '',
        featured: false,
        status: 'draft',
        published_at: '',
        main_image_1: null,
        main_image_2: null,
        gallery: [],
        tags: '',
    });

    // ------- Create Category Form -------
    const {
        data: categoryData,
        setData: setCategoryData,
        post: postCategory,
        processing: processingCategory,
        errors: categoryErrors,
        reset: resetCategory,
    } = useForm<{
        name: string;
        color: string;
        description: string;
    }>({
        name: '',
        color: '#6366f1',
        description: '',
    });

    // Auto-hide notifications after 5 seconds
    useEffect(() => {
        if (flash?.success || flash?.error) {
            const timer = setTimeout(() => {
                setShowNotifications(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Debounced search
    const debouncedSearch = useMemo(
        () =>
            debounce((value: string) => {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (value) params.set('q', value);
                if (categoryId) params.set('category_id', String(categoryId));
                if (status) params.set('status', status);

                window.location.href = route('dashboard.admin.posts.index') + (params.toString() ? `?${params.toString()}` : '');
            }, 500),
        [categoryId, status],
    );

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQ(e.target.value);
            debouncedSearch(e.target.value);
        },
        [debouncedSearch],
    );

    const closeModal = () => {
        setShowCreate(false);
        reset();
    };

    const closeCategoryModal = () => {
        setShowCreateCategory(false);
        resetCategory();
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => d);
        post(route('dashboard.admin.posts.store'), {
            forceFormData: true,
            onSuccess: () => closeModal(),
        });
    };

    const submitCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        postCategory(route('dashboard.admin.categories.store'), {
            onSuccess: () => {
                resetCategory();
                closeCategoryModal();
            },
        });
    };

    const submitFilters = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (categoryId) params.set('category_id', String(categoryId));
        if (status) params.set('status', status);

        window.location.href = route('dashboard.admin.posts.index') + (params.toString() ? `?${params.toString()}` : '');
    };

    // Generate gradient options for UI
    const gradientOptions = useMemo(
        () => [
            'from-indigo-500/20 to-purple-600/20',
            'from-blue-500/20 to-cyan-500/20',
            'from-green-500/20 to-emerald-600/20',
            'from-yellow-500/20 to-orange-600/20',
            'from-red-500/20 to-pink-600/20',
            'from-purple-500/20 to-indigo-600/20',
        ],
        [],
    );

    return (
        <Dashboard>
            <Head title="Blog" />

            {/* Notifications */}
            {showNotifications && (flash?.success || flash?.error) && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl p-4 shadow-xl backdrop-blur-sm transition-all duration-500 ${
                        flash?.success
                            ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white'
                            : 'bg-gradient-to-r from-red-500/90 to-pink-600/90 text-white'
                    }`}
                >
                    <div className="flex-shrink-0">
                        {flash?.success ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{flash?.success || flash?.error}</p>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="flex-shrink-0 rounded-full p-1 transition hover:bg-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
                    {/* Header */}
                    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                                Actualités
                            </h1>
                            <p className="mt-2 text-slate-600">Gérez et publiez les actualités de l'USK.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreateCategory(true)}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm transition-all hover:shadow-md"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Catégorie
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            </button>
                            <Link
                                href={route('dashboard.admin.posts.index')}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm transition-all hover:shadow-md"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Actualiser
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            </Link>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Créer un article
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-8 rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                        <form onSubmit={submitFilters} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="relative md:col-span-2">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    value={q}
                                    onChange={handleSearchChange}
                                    placeholder="Rechercher par titre, extrait…"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 pr-10 pl-12 text-slate-700 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                />
                                {isLoading && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                >
                                    <option value="">Toutes les catégories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="published">Publié</option>
                                    <option value="archived">Archivé</option>
                                </select>
                                <button
                                    type="submit"
                                    className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                                >
                                    Filtrer
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total articles</p>
                                    <p className="mt-1 text-3xl font-bold text-slate-800">{posts.total}</p>
                                </div>
                                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 opacity-70 transition-all group-hover:scale-110"></div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Publiés</p>
                                    <p className="mt-1 text-3xl font-bold text-slate-800">
                                        {posts.data.filter((p) => p.status === 'published').length}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 opacity-70 transition-all group-hover:scale-110"></div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Brouillons</p>
                                    <p className="mt-1 text-3xl font-bold text-slate-800">{posts.data.filter((p) => p.status === 'draft').length}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 opacity-70 transition-all group-hover:scale-110"></div>
                        </div>
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Catégories</p>
                                    <p className="mt-1 text-3xl font-bold text-slate-800">{categories.length}</p>
                                </div>
                                <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 opacity-70 transition-all group-hover:scale-110"></div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((p) => (
                            <ArticleCard key={p.id} post={p} />
                        ))}
                    </div>

                    {/* Empty State */}
                    {posts.data.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-12 py-16 shadow-xl backdrop-blur-sm">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-70"></div>
                                <div className="relative rounded-full bg-white p-6 shadow-lg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-16 w-16 text-slate-300"
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
                                </div>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-slate-800">Aucun article trouvé</h3>
                            <p className="mb-6 text-center text-slate-500">Commencez par créer un nouvel article.</p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Créer un article
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.data.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {posts.links.map((l, idx) => (
                                <Link
                                    key={idx}
                                    href={l.url ?? '#'}
                                    className={[
                                        'group relative overflow-hidden rounded-xl px-4 py-2 font-medium transition-all',
                                        l.active
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                            : 'bg-white/80 text-slate-700 shadow-md hover:shadow-lg',
                                        !l.url && 'pointer-events-none opacity-50',
                                    ].join(' ')}
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Post Modal */}
            {showCreate && (
                <AdminModal
                    wide
                    title="Nouvelle actualité"
                    description="Préparez le contenu, ajoutez vos images et choisissez le mode de publication."
                    onClose={closeModal}
                    formId="post-create-form"
                    submitLabel={
                        data.status === 'published'
                            ? 'Publier l’actualité'
                            : data.status === 'archived'
                              ? 'Créer dans les archives'
                              : 'Enregistrer le brouillon'
                    }
                    busy={processing}
                    errors={errors}
                >
                    <form id="post-create-form" onSubmit={submitCreate} className="admin-modal-form space-y-6">
                        <h3 className="admin-modal-section">Les informations essentielles</h3>
                        {/* Row 1 */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="post-title" className="block text-sm font-medium text-slate-700">
                                    Titre *
                                </label>
                                <input
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    id="post-title"
                                    name="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="post-category_id" className="block text-sm font-medium text-slate-700">
                                    Catégorie
                                </label>
                                <select
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
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
                                    id="post-excerpt"
                                    name="excerpt"
                                    value={data.excerpt}
                                    onChange={(e) => setData('excerpt', e.target.value)}
                                    maxLength={300}
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Brève description de l'article</span>
                                    <span>{data.excerpt.length}/300</span>
                                </div>
                                {errors.excerpt && <p className="text-sm text-red-500">{errors.excerpt}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="post-read_time" className="block text-sm font-medium text-slate-700">
                                        Temps de lecture
                                    </label>
                                    <input
                                        placeholder="7 min"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        id="post-read_time"
                                        name="read_time"
                                        value={data.read_time}
                                        onChange={(e) => setData('read_time', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="post-tags" className="block text-sm font-medium text-slate-700">
                                        Tags
                                    </label>
                                    <input
                                        placeholder="tag1, tag2, tag3"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        id="post-tags"
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
                                        <div className={`h-full w-full bg-gradient-to-r ${gradient}`}></div>
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
                            <input type="hidden" value={data.gradient} onChange={(e) => setData('gradient', e.target.value)} />
                        </div>

                        <h3 className="admin-modal-section">Le contenu de l’actualité</h3>
                        {/* Content */}
                        <div className="space-y-2">
                            <label htmlFor="post-content" className="block text-sm font-medium text-slate-700">
                                Contenu
                            </label>
                            <textarea
                                rows={8}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                id="post-content"
                                name="content"
                                value={data.content}
                                onChange={(e) => setData('content', e.target.value)}
                            />
                            {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                        </div>

                        <VideoFields
                            url={data.video_url}
                            file={data.video_file}
                            onUrl={(value) => setData('video_url', value)}
                            onFile={(value) => setData('video_file', value)}
                            errors={errors}
                        />
                        <h3 className="admin-modal-section">Les images et la galerie</h3>
                        {/* Images */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Image principale 1</label>
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
                                </div>
                                {errors.main_image_1 && <p className="text-sm text-red-500">{errors.main_image_1}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Image principale 2</label>
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
                                </div>
                                {errors.main_image_2 && <p className="text-sm text-red-500">{errors.main_image_2}</p>}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">Galerie descriptive</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setData('gallery', Array.from(e.target.files ?? []))}
                                    className="sr-only"
                                    id="gallery"
                                />
                                <label
                                    htmlFor="gallery"
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
                                    <span className="text-sm text-slate-500">Cliquez pour télécharger plusieurs images</span>
                                </label>
                            </div>
                            {data.gallery?.length > 0 && (
                                <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                    {data.gallery.map((f, i) => (
                                        <div key={i} className="group relative">
                                            <PreviewFile file={f} className="h-20 w-full rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newGallery = [...data.gallery];
                                                    newGallery.splice(i, 1);
                                                    setData('gallery', newGallery);
                                                }}
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
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
                                    id="featured"
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.featured}
                                    onChange={(e) => setData('featured', e.target.checked)}
                                />
                                <label htmlFor="featured" className="text-sm font-medium text-slate-700">
                                    Mettre en avant
                                </label>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="post-status" className="block text-sm font-medium text-slate-700">
                                    Statut
                                </label>
                                <select
                                    id="post-status"
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
                                <label htmlFor="post-published_at" className="block text-sm font-medium text-slate-700">
                                    Publication (optionnel)
                                </label>
                                <input
                                    type="datetime-local"
                                    id="post-published_at"
                                    name="published_at"
                                    value={data.published_at}
                                    onChange={(e) => setData('published_at', e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                    </form>
                </AdminModal>
            )}

            {/* Create Category Modal */}
            {showCreateCategory && (
                <AdminModal
                    title="Nouvelle catégorie"
                    description="Organisez les actualités pour faciliter leur découverte."
                    onClose={closeCategoryModal}
                    formId="category-create-form"
                    submitLabel="Créer la catégorie"
                    busy={processingCategory}
                    errors={categoryErrors}
                >
                    <form id="category-create-form" onSubmit={submitCreateCategory} className="admin-modal-form space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="category-name" className="block text-sm font-medium text-slate-700">
                                Nom de la catégorie *
                            </label>
                            <input
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                id="category-name"
                                name="name"
                                value={categoryData.name}
                                onChange={(e) => setCategoryData('name', e.target.value)}
                                required
                            />
                            {categoryErrors.name && <p className="text-sm text-red-500">{categoryErrors.name}</p>}
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="category-color" className="block text-sm font-medium text-slate-700">
                                Couleur
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="color"
                                        id="category-color"
                                        name="color"
                                        value={categoryData.color}
                                        onChange={(e) => setCategoryData('color', e.target.value)}
                                        className="h-12 w-20 rounded-xl border border-slate-200 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    />
                                    <div
                                        className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full border-2 border-white shadow-md"
                                        style={{ backgroundColor: categoryData.color }}
                                    ></div>
                                </div>
                                <input
                                    type="text"
                                    value={categoryData.color}
                                    onChange={(e) => setCategoryData('color', e.target.value)}
                                    className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="#6366f1"
                                />
                            </div>
                            {categoryErrors.color && <p className="text-sm text-red-500">{categoryErrors.color}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="category-description" className="block text-sm font-medium text-slate-700">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                id="category-description"
                                name="description"
                                value={categoryData.description}
                                onChange={(e) => setCategoryData('description', e.target.value)}
                            />
                            {categoryErrors.description && <p className="text-sm text-red-500">{categoryErrors.description}</p>}
                        </div>
                    </form>
                </AdminModal>
            )}
        </Dashboard>
    );
}

/* ================== Sub-components ================== */

function ArticleCard({ post }: { post: Post }) {
    const cover = post.main_image_1 || post.main_image_2;
    const categoryColor = post.category?.color || '#6366f1';

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                {cover ? (
                    <img src={cover} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                )}
                {post.featured && (
                    <div className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            À la une
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            </div>

            <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                    {post.category?.name && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: categoryColor }}>
                            {post.category.name}
                        </span>
                    )}
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                            post.status === 'published'
                                ? 'bg-emerald-100 text-emerald-700'
                                : post.status === 'draft'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                        {post.status === 'published' ? 'Publié' : post.status === 'draft' ? 'Brouillon' : 'Archivé'}
                    </span>
                </div>

                {post.video_url && (
                    <span className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                        Actualité vidéo
                    </span>
                )}
                <h3 className="mb-2 text-xl font-bold text-slate-800 transition-colors group-hover:text-indigo-600">{post.title}</h3>
                {post.excerpt && <p className="mb-4 line-clamp-2 text-slate-600">{post.excerpt}</p>}

                <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path
                                    fillRule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {post.likes}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>{formatDate(post.created_at)}</span>
                        <Link
                            href={route('dashboard.admin.posts.show', post.slug)}
                            className="flex items-center gap-1 font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                        >
                            Lire
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreviewFile({ file, className = '' }: { file: File; className?: string }) {
    const src = useMemo(() => URL.createObjectURL(file), [file]);
    return <img src={src} alt={file.name} className={className} />;
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}
