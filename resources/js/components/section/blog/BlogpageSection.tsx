import { router, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  FaClock, FaUser, FaSearch, FaArrowRight, FaArrowLeft, FaHeart,
  FaBookmark, FaShareAlt, FaTh, FaList, FaFilter, FaRss, FaQuoteLeft,
  FaBars, FaTimes
} from 'react-icons/fa';

/**
 * BlogpageSection.tsx
 * Avec pagination opérationnelle et images restaurées
 */

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
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest'|'popular'|'alphabetical'>('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { props } = usePage() as any;

  // Data from server (with safe fallbacks)
  const posts = Array.isArray(props?.posts?.data) ? props.posts.data : [];
  const featuredFromServer = Array.isArray(props?.featured) ? props.featured : [];
  const serverCategories = Array.isArray(props?.categories) ? props.categories : [];

  console.log(posts)

  // Pagination meta (robust fallbacks)
  const currentPage = props?.posts?.current_page ?? props?.posts?.currentPage ?? 1;
  const lastPage = props?.posts?.last_page ?? props?.posts?.lastPage ?? 1;
  const totalItems = props?.posts?.total ?? props?.posts?.totalItems ?? 0;

  // ---------------------------------------------------------------------------
  // Filtering: server-side via Inertia
  // ---------------------------------------------------------------------------
  const searchDebounceRef = useRef<number | null>(null);

  // Build query object from current filters
  // Note: do NOT force page = 1 here; caller decides (so pagination can pass page)
  const buildQuery = (overrides: Record<string, any> = {}) => {
    const q: any = {
      q: searchTerm || undefined,
      sort: sortBy || undefined,
      category: selectedCategory || undefined,
      ...overrides,
    };
    // remove undefined keys
    Object.keys(q).forEach(k => q[k] === undefined && delete q[k]);
    return q;
  };

  // apply filters by triggering Inertia GET (router.get)
  const applyFilters = (overrides: Record<string, any> = {}) => {
    const query = buildQuery(overrides);
    setIsLoading(true);

    const url = (typeof (window as any).route === 'function')
      ? String((window as any).route('blog'))
      : '/blog';

    router.get(url, query, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onFinish: () => {
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      }
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

  const handleSortChange = (value: 'latest'|'popular'|'alphabetical') => {
    setSortBy(value);
    applyFilters({ page: 1 });
  };

  const handleCategorySelect = (categoryNameOrNull: string | null) => {
    setSelectedCategory(prev => {
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
  const tags = tagsFromServer ?? Array.from(new Set(posts.flatMap((p: any) => (p.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)))));

  // client filter/sort fallback (we still show server data)
  const filteredPosts = posts
    .filter((p: any) => {
      if (selectedCategory) {
        const catName = p.category ? p.category.name ?? null : null;
        return catName === selectedCategory;
      }
      return true;
    })
    .filter((p: any) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (p.title && p.title.toLowerCase().includes(s)) ||
             (p.excerpt && p.excerpt.toLowerCase().includes(s)) ||
             (p.category && (p.category.name ?? '').toLowerCase().includes(s));
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
  const nextSlide = () => setActiveSlide(prev => (prev === carouselPosts.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setActiveSlide(prev => (prev === 0 ? carouselPosts.length - 1 : prev - 1));

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
      setVisiblePosts(prev => prev + 3);
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
    setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  const toggleSave = (postId: number) => {
    setSavedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
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
    return pages.map(p => (
      <button
        key={p}
        onClick={() => goToPage(p)}
        className={`px-3 py-2 rounded-lg text-sm ${p === currentPage ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        {p}
      </button>
    ));
  };

  // Render
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-yellow-50">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header Mobile */}
      <header className="lg:hidden sticky top-0 z-50 bg-white shadow-md">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-amber-600">Blog</h1>
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-600 hover:text-amber-600 transition-colors">
                <FaSearch className="text-lg" />
              </button>
              <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="p-2 text-gray-600 hover:text-amber-600 transition-colors">
                <FaFilter className="text-lg" />
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:text-amber-600 transition-colors">
                {isMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
              </button>
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'max-h-16 mt-3' : 'max-h-0'}`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <FaSearch className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-yellow-500">Articles</span> Récents
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Découvrez les dernières nouvelles, les analyses et les mises à jour de notre communauté universitaire
            </p>
          </div>

          <div className="hidden lg:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
                <button onClick={() => setViewMode('grid')} className={`px-3 py-2 rounded-l-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <FaTh className="text-sm" />
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-r-lg transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <FaList className="text-sm" />
                </button>
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as any)} className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="latest">Récent</option>
                  <option value="popular">Populaire</option>
                  <option value="alphabetical">A-Z</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-sm">
              <button onClick={clearFilters} className="text-amber-600 hover:underline">Clear filters</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* main content */}
          <div className="lg:col-span-2">
            {/* carousel */}
            <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl group">
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px]">
                {carouselPosts.map((post: any, index: number) => (
                  <div key={post?.id ?? index} className={`absolute inset-0 transition-all duration-1000 ${index === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <img src={getImageUrl(post)} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                      <div className="mb-3 sm:mb-4">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-amber-500 text-xs sm:text-sm font-medium rounded-full">
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 line-clamp-3">
                        {post.title}
                      </h2>
                      <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-3 sm:mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs sm:text-sm">
                          <div className="flex items-center"><FaClock className="mr-1 text-slate-600" /> {post.read_time || (post.published_at ? new Date(post.published_at).toLocaleDateString() : '')}</div>
                          <div className="flex items-center"><FaUser className="mr-1 text-slate-600" /> {post.author ? post.author.name : 'Author'}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => toggleLike(post.id)} className={`p-1.5 rounded-full ${likedPosts.includes(post.id) ? 'bg-red-500 text-white' : 'bg-white bg-opacity-20'}`}><FaHeart /></button>
                          <button onClick={() => toggleSave(post.id)} className={`p-1.5 rounded-full ${savedPosts.includes(post.id) ? 'bg-yellow-500 text-white' : 'bg-white bg-opacity-20'}`}><FaBookmark /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={prevSlide} className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100">
                <FaArrowLeft className="text-sm sm:text-base text-slate-600" />
              </button>
              <button onClick={nextSlide} className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100">
                <FaArrowRight className="text-sm sm:text-base text-slate-600" />
              </button>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {carouselPosts.map((_: any, index: number) => (
                  <button key={index} onClick={() => setActiveSlide(index)} className={`h-2 sm:h-3 rounded-full transition-all ${index === activeSlide ? 'bg-white w-6 sm:w-8' : 'bg-white bg-opacity-50'}`} />
                ))}
              </div>
            </div>

            {/* posts list */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
              {sortedPosts.slice(0, visiblePosts).map((post: any) => (
                <article key={post.id} className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${hoveredPost === post.id ? 'transform -translate-y-1 sm:-translate-y-2 shadow-xl' : ''} ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`} onMouseEnter={() => setHoveredPost(post.id)} onMouseLeave={() => setHoveredPost(null)}>
                  <div className={viewMode === 'list' ? 'w-full sm:w-1/3' : ''}>
                    <img src={getImageUrl(post)} alt={post.title} className="w-full h-48 sm:h-56 object-cover" />
                  </div>
                  <div className={`p-4 sm:p-6 ${viewMode === 'list' ? 'w-full sm:w-2/3' : ''}`}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="inline-block px-2 sm:px-3 py-1 bg-amber-100 text-amber-700 text-xs sm:text-sm font-medium rounded-full">
                        {getCategoryLabel(post.category)}
                      </span>
                      <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                        <FaClock className="mr-1" />
                        <span className="hidden sm:inline">{post.read_time || (post.published_at ? new Date(post.published_at).toLocaleDateString() : '')}</span>
                        <span className="sm:hidden">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800 hover:text-amber-600 transition-colors cursor-pointer line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center">
                        <img src={post.author && post.author.avatar ? (typeof post.author.avatar === 'string' && post.author.avatar.startsWith('http') ? post.author.avatar : `/storage/${post.author.avatar}`) : 'https://picsum.photos/seed/author/80/80.jpg'} alt={post.author ? post.author.name : 'Author'} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3" />
                        <div>
                          <span className="text-sm text-gray-700 font-medium">{post.author ? post.author.name : 'Author'}</span>
                          <div className="text-xs text-gray-500">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button onClick={() => toggleLike(post.id)} className={`p-1.5 sm:p-2 rounded-full transition-colors ${likedPosts.includes(post.id) ? 'bg-red-100 text-red-500' : 'text-gray-400 hover:text-red-500'}`}><FaHeart className="text-sm" /></button>
                        <button onClick={() => toggleSave(post.id)} className={`p-1.5 sm:p-2 rounded-full transition-colors ${savedPosts.includes(post.id) ? 'bg-yellow-100 text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}><FaBookmark className="text-sm" /></button>
                        <button className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-amber-500 transition-colors"><FaShareAlt className="text-sm" /></button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8 sm:mt-12 space-x-2 items-center">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className={`px-3 py-2 rounded-lg ${currentPage <= 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                <FaArrowLeft />
              </button>

              {renderPageNumbers()}

              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= lastPage} className={`px-3 py-2 rounded-lg ${currentPage >= lastPage ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                <FaArrowRight />
              </button>
            </div>

            {/* Load more (client-only fallback) */}
            {visiblePosts < sortedPosts.length && (
              <div className="text-center mt-8 sm:mt-12">
                <button onClick={loadMorePosts} disabled={isLoading} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 flex items-center mx-auto shadow-lg text-sm sm:text-base">
                  {isLoading ? 'Loading...' : <>Load More Posts <FaArrowRight className="ml-2 text-sm" /></>}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center"><FaSearch className="mr-2 text-amber-500" /> Search</h3>
              <div className="relative">
                <input type="text" placeholder="Search your keyword" className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"><FaSearch /></button>
              </div>
            </div>

            {/* Related posts */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center"><FaBookmark className="mr-2 text-amber-500" /> Related Posts</h3>
              <div className="space-y-4">
                {(posts.slice(0,3)).map((p: any) => (
                  <div key={p.id} className="flex space-x-4 pb-4 border-b border-gray-100 last:border-0">
                    <img src={getImageUrl(p, 'https://picsum.photos/seed/related/200/150.jpg')} alt={p.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 hover:text-amber-600 transition-colors cursor-pointer line-clamp-2 text-sm">{p.title}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1"><FaClock className="mr-1" /><span>{p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}</span></div>
                      <div className="text-xs text-gray-500 mt-1">{p.author ? p.author.name : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center"><FaFilter className="mr-2 text-amber-500" /> Categories</h3>
              <ul className="space-y-2">
                {serverCategories.length ? serverCategories.map((c: any) => (
                  <li key={c.id}>
                    <button onClick={() => handleCategorySelect(c.name)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${selectedCategory === c.name ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2`} {...(c.color && c.color.startsWith('bg-') ? { className: `inline-block w-3 h-3 rounded-full mr-2 ${c.color}` } : { style: { background: c.color ?? '#ddd' } })}></span>
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">{c.count ?? ''}</span>
                    </button>
                  </li>
                )) : <li>Aucune catégorie</li>}
              </ul>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center"><FaRss className="mr-2 text-amber-500" /> Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.length ? tags.map((tag: any, i: number) => (
                  <button key={i} onMouseEnter={() => setHoveredTag(tag)} onMouseLeave={() => setHoveredTag(null)} className={`px-3 py-1 rounded-full text-xs sm:text-sm transition-all ${hoveredTag === tag ? 'bg-amber-500 text-white transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{tag}</button>
                )) : <div>Aucun tag</div>}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              <h3 className="text-lg font-bold mb-4 flex items-center relative z-10"><FaRss className="mr-2" /> Subscribe to Newsletter</h3>
              <p className="mb-4 opacity-90 text-sm relative z-10">Get the latest news and updates delivered to your inbox</p>
              <form onSubmit={handleSubscribe} className="space-y-3 relative z-10">
                <input type="email" placeholder="Your email address" className="w-full px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="w-full py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm">Subscribe <FaArrowRight className="ml-2" /></button>
              </form>
              {subscribed && <div className="mt-3 p-2 bg-green-500 bg-opacity-20 rounded-lg text-sm relative z-10">Thank you for subscribing!</div>}
            </div>

            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl shadow-md p-6 mt-6">
              <div className="flex items-start">
                <FaQuoteLeft className="text-amber-600 text-xl mr-3 mt-1" />
                <div>
                  <p className="text-gray-700 italic mb-2 text-sm">"Education is the most powerful weapon which you can use to change the world."</p>
                  <p className="text-xs text-gray-600 text-right">- Nelson Mandela</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile bottom sheet filters */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileFilterOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)}></div>
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Filters & Options</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-gray-600 hover:text-gray-800"><FaTimes /></button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">View Mode</h4>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`flex-1 py-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}><FaTh className="mx-auto" /></button>
                <button onClick={() => setViewMode('list')} className={`flex-1 py-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}><FaList className="mx-auto" /></button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Sort By</h4>
              <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
              <ul className="space-y-2">
                {serverCategories.map((c: any) => (
                  <li key={c.id}>
                    <button onClick={() => handleCategorySelect(c.name)} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${selectedCategory === c.name ? 'bg-amber-100 text-amber-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2`} {...(c.color && c.color.startsWith('bg-') ? { className: `inline-block w-3 h-3 rounded-full mr-2 ${c.color}` } : { style: { background: c.color ?? '#ddd' } })}></span>
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">{c.count ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Popular Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any, i: number) => (
                  <button key={i} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-colors">{tag}</button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-4 text-white">
              <h4 className="font-bold mb-2">Subscribe to Newsletter</h4>
              <p className="text-sm opacity-90 mb-3">Get the latest news delivered to your inbox</p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input type="email" placeholder="Your email" className="w-full px-3 py-2 rounded-lg text-gray-800 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="w-full py-2 bg-white text-amber-600 font-medium rounded-lg text-sm">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* styles */}
      <style jsx>{`
        @keyframes blob { 0% { transform: translate(0px,0px) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } 100% { transform: translate(0px,0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default BlogpageSection;
