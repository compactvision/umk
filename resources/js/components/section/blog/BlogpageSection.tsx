import { Link, router, usePage } from '@inertiajs/react';
import { User, Calendar, Clock, TrendingUp, ChevronDown, Search, X, Menu, Filter, Grid, List, Heart, Bookmark, ArrowLeft, ArrowRight, Quote, Rss, Share2, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const BlogpageSection = () => {
    // UI state
    const [activeSlide, setActiveSlide] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [visiblePosts, setVisiblePosts] = useState(6);
    const [hoveredPost, setHoveredPost] = useState<number | null>(null);
    const [hoveredTag, setHoveredTag] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [likedPosts, setLikedPosts] = useState<number[]>([]);
    const [savedPosts, setSavedPosts] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'alphabetical'>('latest');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const { props } = usePage() as any;

    // Data from server (with safe fallbacks)
    const posts = Array.isArray(props?.posts?.data) ? props.posts.data : [];
    const featuredFromServer = Array.isArray(props?.featured) ? props.featured : [];
    const serverCategories = Array.isArray(props?.categories) ? props.categories : [];

    // Pagination meta (robust fallbacks)
    const currentPage = props?.posts?.current_page ?? props?.posts?.currentPage ?? 1;
    const lastPage = props?.posts?.last_page ?? props?.posts?.lastPage ?? 1;
    const totalItems = props?.posts?.total ?? props?.posts?.totalItems ?? 0;

    // ---------------------------------------------------------------------------
    // Filtering: server-side via Inertia
    // ---------------------------------------------------------------------------
    const searchDebounceRef = useRef<number | null>(null);

    // Build query object from current filters
    const buildQuery = (overrides: Record<string, any> = {}) => {
        const q: any = {
            q: searchTerm || undefined,
            sort: sortBy || undefined,
            category: selectedCategory || undefined,
            ...overrides,
        };
        // remove undefined keys
        Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
        return q;
    };

    // apply filters by triggering Inertia GET (router.get)
    const applyFilters = (overrides: Record<string, any> = {}) => {
        const query = buildQuery(overrides);
        setIsLoading(true);

        const url = typeof (window as any).route === 'function' ? String((window as any).route('blog')) : '/blog';

        router.get(url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => {
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            },
        });
    };

    // Go to specific page (used by pagination controls)
    const goToPage = (page: number) => {
        if (page < 1 || page > lastPage) return;
        applyFilters({ page });
        // scroll to top of list (optional)
        window.scrollTo({ top: 200, behavior: 'smooth' });
    };

    // Handlers for controls
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchDebounceRef.current) {
            window.clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = window.setTimeout(() => {
            applyFilters({ page: 1 });
        }, 300);
    };

    const handleSortChange = (value: 'latest' | 'popular' | 'alphabetical') => {
        setSortBy(value);
        applyFilters({ page: 1 });
    };

    const handleCategorySelect = (categoryNameOrNull: string | null) => {
        setSelectedCategory((prev) => {
            const newVal = prev === categoryNameOrNull ? null : categoryNameOrNull;
            applyFilters({ category: newVal ?? undefined, page: 1 });
            return newVal;
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSortBy('latest');
        setSelectedCategory(null);
        applyFilters({ q: undefined, sort: 'latest', category: undefined, page: 1 });
    };

    // ---------------------------------------------------------------------------
    // UI helpers
    // ---------------------------------------------------------------------------
    const getImageUrl = (post: any, fallback = 'https://picsum.photos/seed/default/800/500.jpg') => {
        if (!post) return fallback;

        const tryVal = (v: any) => {
            if (!v) return null;
            if (typeof v === 'string') {
                if (v.startsWith('http')) return v;
                return v; // probably stored path -> '/storage/...' will be prefixed below
            }
            return v;
        };

        let v = post.images.main1 ?? post.images ?? null;
        if (!v && post.images) {
            if (typeof post.images === 'string') {
                try {
                    const parsed = JSON.parse(post.images);
                    v = parsed?.main1 ?? parsed?.main1 ?? parsed?.[0] ?? null;
                } catch (e) {
                    // ignore parse error
                }
            } else if (typeof post.images === 'object') {
                v = post.images.main1 ?? post.images.main1 ?? (Array.isArray(post.images) ? post.images[0] : null);
            }
        }

        v = tryVal(v);
        if (!v) return fallback;
        if (typeof v === 'string' && v.startsWith('http')) return v;
        // assume it's a storage path or filename
        return v.startsWith('/storage/') ? v : `/storage/${v}`;
    };

    const getCategoryLabel = (cat: any) => {
        if (!cat) return 'Uncategorized';
        if (typeof cat === 'string' || typeof cat === 'number') return String(cat);
        return String(cat.name ?? cat.title ?? cat.slug ?? 'Category');
    };

    // Featured / carousel and tags
    const carouselPosts = featuredFromServer.length ? featuredFromServer.slice(0, 3) : posts.slice(0, 3);
    const tagsFromServer = Array.isArray(props?.tags) ? props.tags : null;
    const tags =
        tagsFromServer ?? Array.from(new Set(posts.flatMap((p: any) => (p.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)))));

    // client filter/sort fallback (we still show server data)
    const filteredPosts = posts
        .filter((p: any) => {
            if (selectedCategory) {
                const catName = p.category ? (p.category.name ?? null) : null;
                return catName === selectedCategory;
            }
            return true;
        })
        .filter((p: any) => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return (
                (p.title && p.title.toLowerCase().includes(s)) ||
                (p.excerpt && p.excerpt.toLowerCase().includes(s)) ||
                (p.category && (p.category.name ?? '').toLowerCase().includes(s))
            );
        });

    const sortedPosts = [...filteredPosts].sort((a: any, b: any) => {
        if (sortBy === 'latest') {
            return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
        } else if (sortBy === 'popular') {
            return (b.views || 0) - (a.views || 0);
        } else if (sortBy === 'alphabetical') {
            return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
    });

    // Carousel navigation
    const nextSlide = () => setActiveSlide((prev) => (prev === carouselPosts.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? carouselPosts.length - 1 : prev - 1));

    // Touch handlers for carousel
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        
        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    useEffect(() => {
        if (!carouselPosts.length) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [carouselPosts.length]);

    // Load more (UI-only)
    const loadMorePosts = () => {
        setIsLoading(true);
        setTimeout(() => {
            setVisiblePosts((prev) => prev + 3);
            setIsLoading(false);
        }, 700);
    };

    const handleSubscribe = (e: any) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setTimeout(() => setSubscribed(false), 3000);
            setEmail('');
        }
    };

    const toggleLike = (postId: number) => {
        setLikedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
    };

    const toggleSave = (postId: number) => {
        setSavedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
    };

    // Scroll to top functionality
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Render pagination numbers (windowed)
    const renderPageNumbers = () => {
        const pages: number[] = [];
        const maxWindow = 5;
        let start = Math.max(1, currentPage - Math.floor(maxWindow / 2));
        let end = Math.min(lastPage, start + maxWindow - 1);
        if (end - start < maxWindow - 1) {
            start = Math.max(1, end - maxWindow + 1);
        }
        for (let p = start; p <= end; p++) pages.push(p);
        return pages.map((p) => (
            <button
                key={p}
                onClick={() => goToPage(p)}
                className={`rounded-lg px-3 py-2 text-sm transition-all ${p === currentPage ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {p}
            </button>
        ));
    };

    // Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
            {/* Decorative background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-300 opacity-20 blur-xl filter animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-yellow-300 opacity-20 blur-xl filter animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-amber-300 opacity-20 blur-xl filter animate-pulse animation-delay-4000"></div>
            </div>

            {/* Mobile Header - Ultra Perfectionnist */}
            <header className="sticky top-0 z-50 bg-white shadow-md lg:hidden">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-amber-600">Blog</h1>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`p-2 rounded-full transition-all duration-300 ${isSearchOpen ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Search className="text-lg" />
                            </button>
                            <button
                                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                                className={`p-2 rounded-full transition-all duration-300 ${isMobileFilterOpen ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Filter className="text-lg" />
                            </button>
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                className={`p-2 rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {isMenuOpen ? <X className="text-lg" /> : <Menu className="text-lg" />}
                            </button>
                        </div>
                    </div>

                    {/* Search bar with animation */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSearchOpen ? 'mt-3 max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher articles..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all duration-300"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <button className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500 transition-colors hover:text-amber-500">
                                <Search className="text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu with slide animation */}
                    <div className={`absolute left-0 right-0 bg-white shadow-lg transition-all duration-300 ease-in-out ${isMenuOpen ? 'top-full opacity-100' : 'top-0 opacity-0 pointer-events-none'}`}>
                        <div className="px-4 py-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">Mode d'affichage</span>
                                <div className="flex rounded-lg bg-gray-100 p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`rounded-md px-3 py-1.5 transition-all duration-200 ${viewMode === 'grid' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
                                    >
                                        <Grid className="text-sm" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`rounded-md px-3 py-1.5 transition-all duration-200 ${viewMode === 'list' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
                                    >
                                        <List className="text-sm" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Trier par</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as any)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                >
                                    <option value="latest">Récent</option>
                                    <option value="popular">Populaire</option>
                                    <option value="alphabetical">A-Z</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                <div className="mb-8 sm:mb-12">
                    <div className="mb-8 text-center">
                        <h1 className="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl lg:text-5xl">
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">Articles</span> Récents
                        </h1>
                        <p className="mx-auto max-w-2xl px-4 text-base text-gray-600 sm:text-lg">
                            Découvrez les dernières nouvelles, les analyses et les mises à jour de notre communauté universitaire
                        </p>
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden items-center justify-between lg:flex">
                        <div className="flex items-center space-x-4">
                            <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`rounded-l-lg px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <Grid className="text-sm" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`rounded-r-lg px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <List className="text-sm" />
                                </button>
                            </div>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value as any)}
                                    className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                >
                                    <option value="latest">Récent</option>
                                    <option value="popular">Populaire</option>
                                    <option value="alphabetical">A-Z</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        <div className="text-sm">
                            <button onClick={clearFilters} className="text-amber-600 hover:underline">
                                Effacer les filtres
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Carousel - Ultra Mobile Optimized */}
                        <div className="group relative mb-8 overflow-hidden rounded-xl shadow-lg sm:mb-12 sm:rounded-2xl sm:shadow-2xl">
                            <div 
                                className="relative h-64 sm:h-80 md:h-96 lg:h-[500px]"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                {carouselPosts.map((post: any, index: number) => (
                                    <div
                                        key={post?.id ?? index}
                                        className={`absolute inset-0 transition-all duration-1000 ${index === activeSlide ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                                    >
                                        <img src={getImageUrl(post)} alt={post.title} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                        <div className="absolute right-0 bottom-0 left-0 p-4 text-white sm:p-6 lg:p-8">
                                            <div className="mb-3 sm:mb-4">
                                                <span className="inline-block rounded-full bg-amber-500 px-2 py-1 text-xs font-medium sm:px-3 sm:text-sm">
                                                    {getCategoryLabel(post.category)}
                                                </span>
                                            </div>
                                            <h2 className="mb-2 line-clamp-3 text-lg font-bold sm:mb-4 sm:text-xl md:text-2xl lg:text-3xl">
                                                {post.title}
                                            </h2>
                                            <p className="mb-3 line-clamp-2 text-sm opacity-90 sm:mb-4 sm:text-base lg:text-lg">{post.excerpt}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 text-xs sm:text-sm">
                                                    <div className="flex items-center text-white">
                                                        <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />{' '}
                                                        {post.read_time ||
                                                            (post.publishedAt ? new Date(post.publishedAt.date).toLocaleDateString() : '')}
                                                    </div>
                                                    <div className="flex items-center text-white">
                                                        <User className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> {post.author ? post.author.last_name : 'Author'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => toggleLike(post.id)}
                                                        className={`rounded-full p-1.5 transition-all duration-300 ${likedPosts.includes(post.id) ? 'bg-red-500 text-white' : 'bg-opacity-20 bg-white text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                    >
                                                        <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSave(post.id)}
                                                        className={`rounded-full p-1.5 transition-all duration-300 ${savedPosts.includes(post.id) ? 'bg-yellow-500 text-white' : 'bg-opacity-20 bg-white text-yellow-500 hover:bg-yellow-500 hover:text-white'}`}
                                                    >
                                                        <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Navigation buttons with better mobile touch targets */}
                            <button
                                onClick={prevSlide}
                                className="absolute top-1/2 left-2 -translate-y-1/2 transform rounded-full bg-white bg-opacity-20 p-2 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 sm:left-4 sm:p-3 lg:bg-opacity-30"
                            >
                                <ArrowLeft className="h-4 w-4 text-slate-600 sm:h-5 sm:w-5" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded-full bg-white bg-opacity-20 p-2 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 sm:right-4 sm:p-3 lg:bg-opacity-30"
                            >
                                <ArrowRight className="h-4 w-4 text-slate-600 sm:h-5 sm:w-5" />
                            </button>

                            {/* Indicators with better mobile spacing */}
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2">
                                {carouselPosts.map((_: any, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveSlide(index)}
                                        className={`h-2 rounded-full transition-all duration-300 sm:h-3 ${index === activeSlide ? 'w-6 bg-white sm:w-8' : 'bg-opacity-50 bg-white'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Posts Grid/List - Ultra Mobile Optimized */}
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2' : 'space-y-6'}>
                            {sortedPosts.slice(0, visiblePosts).map((post: any) => (
                                <article
                                    key={post.id}
                                    className={`overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 ${hoveredPost === post.id ? '-translate-y-1 transform shadow-xl sm:-translate-y-2' : ''} ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}
                                    onMouseEnter={() => setHoveredPost(post.id)}
                                    onMouseLeave={() => setHoveredPost(null)}
                                >
                                    <div className={viewMode === 'list' ? 'w-full sm:w-1/3' : ''}>
                                        <img src={getImageUrl(post)} alt={post.title} className="h-48 w-full object-cover sm:h-56" />
                                    </div>
                                    <div className={`p-4 sm:p-6 ${viewMode === 'list' ? 'w-full sm:w-2/3' : ''}`}>
                                        <div className="mb-3 flex items-center justify-between sm:mb-4">
                                            <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 sm:px-3 sm:text-sm">
                                                {getCategoryLabel(post.category)}
                                            </span>
                                            <div className="flex items-center text-xs text-gray-500 sm:text-sm">
                                                <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="hidden sm:inline">
                                                    {post.read_time || (post.publishedAt ? new Date(post.publishedAt.date).toLocaleDateString() : '')}
                                                </span>
                                                <span className="sm:hidden">
                                                    {post.publishedAt ? new Date(post.publishedAt.date).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <Link href={`/blog/${post.id}`} className="mb-2 line-clamp-2 cursor-pointer text-lg font-bold text-gray-800 transition-colors hover:text-amber-600 sm:mb-3 sm:text-xl">
                                            {post.title}
                                        </Link>
                                        <p className="mb-3 line-clamp-2 text-sm text-gray-600 sm:mb-4 sm:line-clamp-3 sm:text-base">{post.excerpt}</p>

                                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                            <div className="flex items-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>

                                                <div className="ml-3">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {post.author ? post.author.last_name : 'Author'}
                                                    </span>
                                                    <div className="text-xs text-gray-500">
                                                        {post.publishedAt ? new Date(post.publishedAt.date).toLocaleDateString() : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <button
                                                    onClick={() => toggleLike(post.id)}
                                                    className={`rounded-full p-1.5 transition-all duration-300 sm:p-2 ${likedPosts.includes(post.id) ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                >
                                                    <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </button>
                                                <button
                                                    onClick={() => toggleSave(post.id)}
                                                    className={`rounded-full p-1.5 transition-all duration-300 sm:p-2 ${savedPosts.includes(post.id) ? 'bg-yellow-100 text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                                >
                                                    <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Pagination - Mobile Optimized */}
                        <div className="mt-8 flex flex-col items-center space-y-4 sm:mt-12 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 sm:w-auto ${currentPage <= 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-600 shadow hover:bg-gray-100'}`}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Précédent
                            </button>

                            <div className="flex items-center space-x-1 overflow-x-auto py-1 sm:space-x-2">
                                {renderPageNumbers()}
                            </div>

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= lastPage}
                                className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 sm:w-auto ${currentPage >= lastPage ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-600 shadow hover:bg-gray-100'}`}
                            >
                                Suivant
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </button>
                        </div>

                        {/* Load More Button - Mobile Optimized */}
                        {visiblePosts < sortedPosts.length && (
                            <div className="mt-8 text-center sm:mt-12">
                                <button
                                    onClick={loadMorePosts}
                                    disabled={isLoading}
                                    className="mx-auto flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 sm:px-8 sm:py-3.5 sm:text-base"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            Charger plus <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Desktop Only */}
                    <div className="hidden lg:col-span-1 lg:block">
                        {/* Search */}
                        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <Search className="mr-2 h-5 w-5 text-amber-500" /> Rechercher
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher votre mot-clé"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                                <button className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500">
                                    <Search className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Related posts */}
                        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <Bookmark className="mr-2 h-5 w-5 text-amber-500" /> Articles liés
                            </h3>
                            <div className="space-y-4">
                                {posts.slice(0, 3).map((p: any) => (
                                    <div key={p.id} className="flex space-x-4 border-b border-gray-100 pb-4 last:border-0">
                                        <img
                                            src={getImageUrl(p, 'https://picsum.photos/seed/related/200/150.jpg')}
                                            alt={p.title}
                                            className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                                        />
                                        <div className="flex-1">
                                            <h4 className="line-clamp-2 cursor-pointer text-sm font-medium text-gray-800 transition-colors hover:text-amber-600">
                                                {p.title}
                                            </h4>
                                            <div className="mt-1 flex items-center text-xs text-gray-500">
                                                <Clock className="mr-1 h-3 w-3" />
                                                <span>{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">{p.author ? p.author.name : ''}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <Filter className="mr-2 h-5 w-5 text-amber-500" /> Catégories
                            </h3>
                            <ul className="space-y-2">
                                {serverCategories.length ? (
                                    serverCategories.map((c: any) => (
                                        <li key={c.id}>
                                            <button
                                                onClick={() => handleCategorySelect(c.name)}
                                                className={`flex w-full items-center justify-between rounded-lg p-3 transition-colors ${selectedCategory === c.name ? 'bg-amber-100 text-amber-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                <div className="flex items-center">
                                                    <span
                                                        className={`mr-2 inline-block h-3 w-3 rounded-full`}
                                                        {...(c.color && c.color.startsWith('bg-')
                                                            ? { className: `inline-block w-3 h-3 rounded-full mr-2 ${c.color}` }
                                                            : { style: { background: c.color ?? '#ddd' } })}
                                                    ></span>
                                                    <span className="text-sm">{c.name}</span>
                                                </div>
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-sm">{c.count ?? ''}</span>
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li>Aucune catégorie</li>
                                )}
                            </ul>
                        </div>

                        {/* Tags */}
                        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <Rss className="mr-2 h-5 w-5 text-amber-500" /> Tags Populaires
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.length ? (
                                    tags.map((tag: any, i: number) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => setHoveredTag(tag)}
                                            onMouseLeave={() => setHoveredTag(null)}
                                            className={`rounded-full px-3 py-1 text-xs transition-all duration-300 sm:text-sm ${hoveredTag === tag ? 'scale-105 transform bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))
                                ) : (
                                    <div>Aucun tag</div>
                                )}
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 p-6 text-white shadow-md">
                            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white opacity-10"></div>
                            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-white opacity-10"></div>
                            <h3 className="relative z-10 mb-4 flex items-center text-lg font-bold">
                                <Rss className="mr-2 h-5 w-5" /> S'abonner à la newsletter
                            </h3>
                            <p className="relative z-10 mb-4 text-sm opacity-90">Recevez les dernières nouvelles et mises à jour dans votre boîte de réception</p>
                            <form onSubmit={handleSubscribe} className="relative z-10 space-y-3">
                                <input
                                    type="email"
                                    placeholder="Votre adresse email"
                                    className="w-full rounded-lg px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-white focus:outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-sm font-medium text-amber-600 transition-colors hover:bg-gray-100"
                                >
                                    S'abonner <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </form>
                            {subscribed && (
                                <div className="bg-opacity-20 relative z-10 mt-3 rounded-lg bg-green-500 p-2 text-sm">Merci de vous être abonné!</div>
                            )}
                        </div>

                        <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 p-6 shadow-md">
                            <div className="flex items-start">
                                <Quote className="mt-1 mr-3 h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="mb-2 text-sm text-gray-700 italic">
                                        "L'éducation est l'arme la plus puissante que vous puissiez utiliser pour changer le monde."
                                    </p>
                                    <p className="text-right text-xs text-gray-600">- Nelson Mandela</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Bottom Sheet Filters - Ultra Perfectionnist */}
            <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${isMobileFilterOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
                    onClick={() => setIsMobileFilterOpen(false)}
                ></div>
                <div className={`absolute right-0 bottom-0 left-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl transition-all duration-300 transform ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="sticky top-0 z-10 border-b bg-white p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Filtres & Options</h3>
                            <button 
                                onClick={() => setIsMobileFilterOpen(false)} 
                                className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-2 h-1 w-12 rounded-full bg-gray-300 mx-auto"></div>
                    </div>

                    <div className="space-y-6 p-4">
                        {/* View Mode */}
                        <div>
                            <h4 className="mb-3 font-medium text-gray-700">Mode de vue</h4>
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex-1 rounded-md py-2.5 transition-all duration-200 ${viewMode === 'grid' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <Grid className="mx-auto h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex-1 rounded-md py-2.5 transition-all duration-200 ${viewMode === 'list' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    <List className="mx-auto h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <h4 className="mb-3 font-medium text-gray-700">Tri par</h4>
                            <div className="space-y-2">
                                {[
                                    { value: 'latest', label: 'Plus récent', icon: Clock },
                                    { value: 'popular', label: 'Plus populaire', icon: TrendingUp },
                                    { value: 'alphabetical', label: 'A-Z', icon: Calendar }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSortChange(option.value as any)}
                                        className={`flex w-full items-center justify-between rounded-lg p-3 transition-all duration-200 ${sortBy === option.value ? 'bg-amber-100 text-amber-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        <div className="flex items-center">
                                            <option.icon className="mr-3 h-4 w-4" />
                                            <span className="text-sm">{option.label}</span>
                                        </div>
                                        {sortBy === option.value && (
                                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h4 className="mb-3 font-medium text-gray-700">Catégories</h4>
                            <ul className="space-y-2">
                                {serverCategories.map((c: any) => (
                                    <li key={c.id}>
                                        <button
                                            onClick={() => handleCategorySelect(c.name)}
                                            className={`flex w-full items-center justify-between rounded-lg p-3 transition-all duration-200 ${selectedCategory === c.name ? 'bg-amber-100 text-amber-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            <div className="flex items-center">
                                                <span
                                                    className={`mr-3 inline-block h-3 w-3 rounded-full`}
                                                    {...(c.color && c.color.startsWith('bg-')
                                                        ? { className: `inline-block w-3 h-3 rounded-full mr-3 ${c.color}` }
                                                        : { style: { background: c.color ?? '#ddd' } })}
                                                ></span>
                                                <span className="text-sm">{c.name}</span>
                                            </div>
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{c.count ?? ''}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tags */}
                        <div>
                            <h4 className="mb-3 font-medium text-gray-700">Tags Populaires</h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag: any, i: number) => (
                                    <button
                                        key={i}
                                        className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition-all duration-200 hover:bg-amber-100 hover:text-amber-700"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 p-4 text-white">
                            <h4 className="mb-2 font-bold">S'abonner à la newsletter</h4>
                            <p className="mb-3 text-sm opacity-90">Recevez les dernières nouvelles et mises à jour</p>
                            <form onSubmit={handleSubscribe} className="space-y-2">
                                <input
                                    type="email"
                                    placeholder="Votre email"
                                    className="w-full rounded-lg px-3 py-2.5 text-sm text-gray-800"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-gray-100">
                                    S'abonner
                                </button>
                            </form>
                        </div>

                        {/* Apply Filters Button */}
                        <button
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="w-full rounded-lg bg-amber-500 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                        >
                            Appliquer les filtres
                        </button>
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button - Mobile Optimized */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-all duration-300 lg:bottom-8 lg:right-8 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            >
                <ChevronUp className="h-5 w-5" />
            </button>

            {/* Mobile Stats Bar - Ultra Perfectionnist */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2 shadow-lg lg:hidden">
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center">
                        <span className="font-medium text-gray-800">{totalItems}</span>
                        <span className="ml-1">articles</span>
                    </div>
                    <div className="flex items-center">
                        <span>Page</span>
                        <span className="mx-1 font-medium text-gray-800">{currentPage}</span>
                        <span>sur</span>
                        <span className="ml-1 font-medium text-gray-800">{lastPage}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className={`rounded-full p-1.5 ${currentPage <= 1 ? 'text-gray-300' : 'text-amber-500'}`}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= lastPage}
                            className={`rounded-full p-1.5 ${currentPage >= lastPage ? 'text-gray-300' : 'text-amber-500'}`}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default BlogpageSection;