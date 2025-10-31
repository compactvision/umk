import React, { useState, useEffect, useRef } from 'react';
import { 
  FaClock, 
  FaComment, 
  FaEye, 
  FaSearch, 
  FaArrowRight, 
  FaArrowLeft, 
  FaFacebookF, 
  FaTwitter, 
  FaLinkedinIn, 
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaChevronRight,
  FaCalendarAlt,
  FaUser,
  FaTags,
  FaBookmark,
  FaShareAlt,
  FaHeart,
  FaFilter,
  FaRss,
  FaQuoteLeft,
  FaBars,
  FaTimes,
  FaTh,
  FaList,
  FaStar,
  FaTrendingUp
} from 'react-icons/fa';

const BlogpageSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [hoveredTag, setHoveredTag] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const carouselRef = useRef(null);

  // Données des articles de blog
  const featuredPosts = [
    {
      id: 1,
      title: "EduFord University Receives Significant Grant to Enhance Advanced STEM Programs",
      excerpt: "This funding will be used to develop cutting-edge research facilities, expand course offerings, and provide scholarships for underrepresented students in STEM fields.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog1/1200/600.jpg",
      author: "James Michael",
      authorAvatar: "https://picsum.photos/seed/author1/100/100.jpg",
      comments: 14,
      views: 1454,
      likes: 89,
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "EduFord University Hosts International Conference on Climate Change",
      excerpt: "Leading researchers from around the world gather to discuss innovative solutions to the global climate crisis.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog2/1200/600.jpg",
      author: "Sarah Johnson",
      authorAvatar: "https://picsum.photos/seed/author2/100/100.jpg",
      comments: 23,
      views: 2103,
      likes: 156,
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "EduFord University Celebrates Groundbreaking Ceremony for New Student Center",
      excerpt: "State-of-the-art facility will provide students with modern learning spaces, collaborative areas, and recreational facilities.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog3/1200/600.jpg",
      author: "Michael Chen",
      authorAvatar: "https://picsum.photos/seed/author3/100/100.jpg",
      comments: 31,
      views: 3245,
      likes: 203,
      readTime: "4 min read"
    }
  ];

  const blogPosts = [
    {
      id: 4,
      title: "EduFord University Hosts International Conference on Climate Change",
      excerpt: "Embark on a journey into the dynamic of IT solutions. This conference brings together experts from various fields to discuss the latest innovations and challenges in climate change research.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog4/800/500.jpg",
      author: "James Michael",
      authorAvatar: "https://picsum.photos/seed/author1/100/100.jpg",
      comments: 14,
      views: 1454,
      likes: 89,
      readTime: "5 min read",
      hasImage: true
    },
    {
      id: 5,
      title: "EduFord University Celebrates Groundbreaking Ceremony for State-of-the-Art Student Center",
      excerpt: "Embark on a journey into the dynamic of IT solutions. The new student center will feature modern classrooms, collaborative spaces, and recreational areas designed to enhance student life.",
      category: "#Study programs",
      date: "11/12/2024",
      image: null,
      author: "Sarah Johnson",
      authorAvatar: "https://picsum.photos/seed/author2/100/100.jpg",
      comments: 23,
      views: 2103,
      likes: 156,
      readTime: "7 min read",
      hasImage: false
    },
    {
      id: 6,
      title: "EduFord University Expands Campus Facilities with State-of-the-Art",
      excerpt: "Embark on a journey into the dynamic of IT solutions. The expansion includes new research labs, classrooms, and student housing to accommodate growing enrollment.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog6/800/500.jpg",
      author: "Michael Chen",
      authorAvatar: "https://picsum.photos/seed/author3/100/100.jpg",
      comments: 31,
      views: 3245,
      likes: 203,
      readTime: "4 min read",
      hasImage: true
    },
    {
      id: 7,
      title: "EduFord University Launches Comprehensive Online Learning Platform to Enhance Student Success",
      excerpt: "Embark on a journey into the dynamic of IT solutions. The new platform offers interactive courses, virtual labs, and personalized learning paths.",
      category: "#Study programs",
      date: "11/12/2024",
      image: null,
      author: "Emily Rodriguez",
      authorAvatar: "https://picsum.photos/seed/author4/100/100.jpg",
      comments: 18,
      views: 1789,
      likes: 124,
      readTime: "6 min read",
      hasImage: false
    },
    {
      id: 8,
      title: "Thirty-One UChicago Faculty Members Receive Prestigious Named",
      excerpt: "Our innovators navigate the ever-evolving landscape of academic excellence. These distinguished faculty members have been recognized for their outstanding contributions.",
      category: "#Study programs",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog8/800/500.jpg",
      author: "David Kim",
      authorAvatar: "https://picsum.photos/seed/author5/100/100.jpg",
      comments: 27,
      views: 2567,
      likes: 189,
      readTime: "8 min read",
      hasImage: true
    },
    {
      id: 9,
      title: "EduFord University to Host Global Conference on Sustainability and Climate Change Solutions",
      excerpt: "The evolution of IT solutions from inception to implementation. Discover the insights, strategies, and breakthroughs that have propelled us forward, and gain valuable knowledge from industry experts.",
      category: "#Study programs",
      date: "11/12/2024",
      image: null,
      author: "Lisa Anderson",
      authorAvatar: "https://picsum.photos/seed/author6/100/100.jpg",
      comments: 42,
      views: 3892,
      likes: 267,
      readTime: "9 min read",
      hasImage: false
    }
  ];

  const relatedPosts = [
    {
      id: 10,
      title: "EduFord University Opens New High-Tech Library",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog10/200/150.jpg",
      author: "James Michael",
      readTime: "3 min read"
    },
    {
      id: 11,
      title: "University's STEM Ranks Top 10 Nationwide",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog11/200/150.jpg",
      author: "Sarah Johnson",
      readTime: "4 min read"
    },
    {
      id: 12,
      title: "EduFord University Host Global Sustainability",
      date: "11/12/2024",
      image: "https://picsum.photos/seed/blog12/200/150.jpg",
      author: "Michael Chen",
      readTime: "5 min read"
    }
  ];

  const categories = [
    { name: "Child Development", count: 5, color: "bg-amber-100 text-amber-700" },
    { name: "Computer Engineering", count: 2, color: "bg-yellow-100 text-yellow-700" },
    { name: "Learning", count: 2, color: "bg-amber-100 text-amber-700" },
    { name: "Science", count: 4, color: "bg-yellow-100 text-yellow-700" },
    { name: "Technology", count: 3, color: "bg-amber-100 text-amber-700" },
    { name: "Web Development", count: 7, color: "bg-yellow-100 text-yellow-700" }
  ];

  const tags = [
    "School", "College", "university", "Scholarships", 
    "GlobalEducation", "HigherEducation", "OnlineLearning", 
    "Learning", "Faculty", "Global"
  ];

  // Navigation du carrousel
  const nextSlide = () => {
    setActiveSlide((prev) => (prev === featuredPosts.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? featuredPosts.length - 1 : prev - 1));
  };

  // Auto-rotation du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlide]);

  // Chargement de plus d'articles
  const loadMorePosts = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisiblePosts(prev => prev + 3);
      setIsLoading(false);
    }, 1000);
  };

  // Abonnement à la newsletter
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  // Gestion des likes
  const toggleLike = (postId) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  // Gestion des sauvegardes
  const toggleSave = (postId) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(savedPosts.filter(id => id !== postId));
    } else {
      setSavedPosts([...savedPosts, postId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      {/* Éléments décoratifs d'arrière-plan */}
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
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
              >
                <FaSearch className="text-lg" />
              </button>
              <button 
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
              >
                <FaFilter className="text-lg" />
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
              >
                {isMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
              </button>
            </div>
          </div>
          
          {/* Barre de recherche mobile */}
          <div className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'max-h-16 mt-3' : 'max-h-0'}`}>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <FaSearch className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Section principale du blog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
        {/* En-tête de section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">Articles</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Discover the latest news, insights, and updates from our university community
            </p>
          </div>
          
          {/* Contrôles desktop */}
          <div className="hidden lg:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-amber-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTh className="text-sm" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-r-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-amber-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaList className="text-sm" />
                </button>
              </div>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Popular</option>
                  <option value="alphabetical">A-Z</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Carrousel d'articles en vedette */}
            <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl group">
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px]">
                {featuredPosts.map((post, index) => (
                  <div 
                    key={post.id}
                    className={`absolute inset-0 transition-all duration-1000 ${index === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                  >
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                      <div className="mb-3 sm:mb-4">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-amber-500 text-xs sm:text-sm font-medium rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 line-clamp-3">
                        {post.title}
                      </h2>
                      <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-3 sm:mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                          <div className="flex items-center">
                            <FaClock className="mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{post.date}</span>
                            <span className="sm:hidden">{post.readTime}</span>
                          </div>
                          <div className="flex items-center">
                            <FaUser className="mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{post.author}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <button 
                            onClick={() => toggleLike(post.id)}
                            className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                              likedPosts.includes(post.id) 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                          >
                            <FaHeart className="text-sm sm:text-base" />
                          </button>
                          <button 
                            onClick={() => toggleSave(post.id)}
                            className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                              savedPosts.includes(post.id) 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                          >
                            <FaBookmark className="text-sm sm:text-base" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Contrôles du carrousel */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              >
                <FaArrowLeft className="text-sm sm:text-base" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
              >
                <FaArrowRight className="text-sm sm:text-base" />
              </button>
              
              {/* Indicateurs du carrousel */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {featuredPosts.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2 sm:h-3 rounded-full transition-all ${index === activeSlide ? 'bg-white w-6 sm:w-8' : 'bg-white bg-opacity-50'}`}
                  />
                ))}
              </div>
            </div>

            {/* Liste des articles de blog */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
              {blogPosts.slice(0, visiblePosts).map((post) => (
                <article 
                  key={post.id} 
                  className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                    hoveredPost === post.id ? 'transform -translate-y-1 sm:-translate-y-2 shadow-xl' : ''
                  } ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}
                  onMouseEnter={() => setHoveredPost(post.id)}
                  onMouseLeave={() => setHoveredPost(null)}
                >
                  {post.hasImage && (
                    <div className={viewMode === 'list' ? 'w-full sm:w-1/3' : ''}>
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-4 sm:p-6 ${viewMode === 'list' ? 'w-full sm:w-2/3' : ''}`}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="inline-block px-2 sm:px-3 py-1 bg-amber-100 text-amber-700 text-xs sm:text-sm font-medium rounded-full">
                        {post.category}
                      </span>
                      <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                        <FaClock className="mr-1" />
                        <span className="hidden sm:inline">{post.readTime}</span>
                        <span className="sm:hidden">{post.date.split('/')[0]}/{post.date.split('/')[1]}</span>
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
                        <img 
                          src={post.authorAvatar} 
                          alt={post.author} 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3"
                        />
                        <div>
                          <span className="text-sm text-gray-700 font-medium">{post.author}</span>
                          <div className="text-xs text-gray-500">{post.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button 
                          onClick={() => toggleLike(post.id)}
                          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                            likedPosts.includes(post.id) 
                              ? 'bg-red-100 text-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <FaHeart className="text-sm" />
                        </button>
                        <button 
                          onClick={() => toggleSave(post.id)}
                          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                            savedPosts.includes(post.id) 
                              ? 'bg-yellow-100 text-yellow-500' 
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <FaBookmark className="text-sm" />
                        </button>
                        <button className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-amber-500 transition-colors">
                          <FaShareAlt className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Bouton Charger plus */}
            {visiblePosts < blogPosts.length && (
              <div className="text-center mt-8 sm:mt-12">
                <button 
                  onClick={loadMorePosts}
                  disabled={isLoading}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 flex items-center mx-auto shadow-lg text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Posts
                      <FaArrowRight className="ml-2 text-sm" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center mt-8 sm:mt-12">
              <nav className="flex items-center space-x-1 sm:space-x-2">
                <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <FaArrowLeft className="text-sm" />
                </button>
                <button className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm">1</button>
                <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm">2</button>
                <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm">3</button>
                <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm">...</button>
                <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-sm">10</button>
                <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <FaArrowRight className="text-sm" />
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            {/* Recherche */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaSearch className="mr-2 text-amber-500" />
                Search
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search your keyword" 
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Articles connexes */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaBookmark className="mr-2 text-amber-500" />
                Related Posts
              </h3>
              <div className="space-y-4">
                {relatedPosts.map((post) => (
                  <div key={post.id} className="flex space-x-4 pb-4 border-b border-gray-100 last:border-0">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 hover:text-amber-600 transition-colors cursor-pointer line-clamp-2 text-sm">
                        {post.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <FaClock className="mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{post.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Catégories */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaFilter className="mr-2 text-amber-500" />
                Categories
              </h3>
              <ul className="space-y-2">
                {categories.map((category, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.name 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${category.color.split(' ')[0]}`}></span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">{category.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags populaires */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaTags className="mr-2 text-amber-500" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <button 
                    key={index}
                    onMouseEnter={() => setHoveredTag(tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm transition-all ${
                      hoveredTag === tag 
                        ? 'bg-amber-500 text-white transform scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              <h3 className="text-lg font-bold mb-4 flex items-center relative z-10">
                <FaRss className="mr-2" />
                Subscribe to Newsletter
              </h3>
              <p className="mb-4 opacity-90 text-sm relative z-10">Get the latest news and updates delivered to your inbox</p>
              <form onSubmit={handleSubscribe} className="space-y-3 relative z-10">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  className="w-full py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                >
                  Subscribe
                  <FaArrowRight className="ml-2" />
                </button>
              </form>
              {subscribed && (
                <div className="mt-3 p-2 bg-green-500 bg-opacity-20 rounded-lg text-sm relative z-10">
                  Thank you for subscribing!
                </div>
              )}
            </div>

            {/* Citation inspirante */}
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl shadow-md p-6 mt-6">
              <div className="flex items-start">
                <FaQuoteLeft className="text-amber-600 text-xl mr-3 mt-1" />
                <div>
                  <p className="text-gray-700 italic mb-2 text-sm">
                    "Education is the most powerful weapon which you can use to change the world."
                  </p>
                  <p className="text-xs text-gray-600 text-right">- Nelson Mandela</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar Mobile - Bottom Sheet */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileFilterOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileFilterOpen(false)}></div>
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Filters & Options</h3>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Mode d'affichage */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">View Mode</h4>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-amber-500 text-white' 
                      : 'text-gray-600'
                  }`}
                >
                  <FaTh className="mx-auto" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-amber-500 text-white' 
                      : 'text-gray-600'
                  }`}
                >
                  <FaList className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Tri */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Sort By</h4>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>

            {/* Catégories */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
              <ul className="space-y-2">
                {categories.map((category, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.name 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${category.color.split(' ')[0]}`}></span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">{category.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Popular Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <button 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl p-4 text-white">
              <h4 className="font-bold mb-2">Subscribe to Newsletter</h4>
              <p className="text-sm opacity-90 mb-3">Get the latest news delivered to your inbox</p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="w-full px-3 py-2 rounded-lg text-gray-800 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  className="w-full py-2 bg-white text-amber-600 font-medium rounded-lg text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

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