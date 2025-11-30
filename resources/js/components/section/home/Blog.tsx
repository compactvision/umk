import React, { useState, useEffect } from 'react';
import { Clock, User, MessageCircle, ChevronRight, Filter, Calendar, Tag, Eye, Heart, Share2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Blog() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  
  const { props } = usePage();
  const { url } = usePage();
  
  // Gestion de la pagination
  const postsData = props.posts || {};
  const posts = postsData.data || [];
  const categories = props.categories || [];
  
  // Récupération du filtre actuel depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedTopic, setSelectedTopic] = useState(urlParams.get('category') || 'all');

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  // Construction dynamique des topics à partir des catégories
  const topics = [
    { value: 'all', label: 'Toutes les thématiques' },
    ...categories.map(cat => ({
      value: cat.id.toString(),
      label: cat.name
    }))
  ];

  // Fonction pour changer de catégorie avec rechargement des données
  const handleTopicChange = (categoryId) => {
    setSelectedTopic(categoryId);
    
    if (categoryId === 'all') {
      router.get(route('blog'), {}, {
        preserveState: true,
        preserveScroll: true
      });
    } else {
      router.get(route('blog'), { category: categoryId }, {
        preserveState: true,
        preserveScroll: true
      });
    }
  };

  // Organisation des posts par taille (featured vs regular)
  const featuredPost = posts.find(post => post.featured === 1 || post.featured === true);
  const regularPosts = posts.filter(post => post.featured !== 1 && post.featured !== true);
  
  // Répartition des posts pour l'affichage en grille
  const leftPosts = regularPosts.slice(0, 2);
  const rightPosts = regularPosts.slice(2, 4);

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Non catégorisé';
  };

  const getPostGradient = (post, index) => {
    // Si le post a un gradient défini, l'utiliser
    if (post.gradient) {
      return post.gradient;
    }
    
    // Sinon utiliser un gradient par défaut basé sur l'index
    const gradients = [
      'from-emerald-500/20 to-green-600/20',
      'from-blue-500/20 to-cyan-600/20',
      'from-indigo-500/20 to-purple-600/20',
      'from-orange-500/20 to-red-600/20',
      'from-violet-500/20 to-pink-600/20'
    ];
    return gradients[index % gradients.length];
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getAuthorName = (post) => {
    if (post.author) {
      return post.author.last_name || 'Anonyme';
    }
    return 'Anonyme';
  };

  const getPostImage = (post) => {
    return post.images.main1 || post.images.main2 || '/images/default-blog.jpg';
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterLoading(true);
    setNewsletterError('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
      } else {
        setNewsletterError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setNewsletterError('Erreur de connexion au serveur');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-20 md:py-32 overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-8 lg:mb-0">
            <span className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-lg mb-6">
              Actualités récentes
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent leading-tight">
              L'actualité du
              <span className="block">
                campus
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600">
              Découvrez les dernières nouvelles, événements et réalisations de notre communauté universitaire.
            </p>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></div>
          </div>

          {/* Topic Filter */}
          <div className="relative">
            <div className="flex items-center gap-3 p-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200 shadow-xl">
              <Filter className="w-5 h-5 text-amber-600 ml-3" />
              <select 
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="bg-transparent text-gray-800 font-medium pr-8 pl-2 py-3 focus:outline-none cursor-pointer appearance-none"
              >
                {topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-amber-600 mr-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Vérification si des posts existent */}
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Aucun article disponible pour le moment.</p>
          </div>
        ) : (
          <>
            {/* Blog Grid */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-8">
                {leftPosts.map((post, index) => (
                  <div 
                    key={post.id}
                    className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                      hoveredCard === post.id ? "ring-2 ring-amber-400" : ""
                    }`}
                    onMouseEnter={() => setHoveredCard(post.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getPostGradient(post, index)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10 p-6">
                      <div className="aspect-video mb-4 rounded-2xl overflow-hidden">
                        <img 
                          src={`/storage/${getPostImage(post)}`} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(post.category_id)} mb-4`}>
                        #{getCategoryName(post.category.id)}
                      </div>
                      <br />
                      <Link href={`/blog/${post.id}`} className="text-lg font-bold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors mb-3">
                        {post.title}
                      </Link>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{post.views || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className={`w-3 h-3 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{(post.likes || 0) + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.read_time || '5 min'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Center Column - Featured Post */}
              <div className="lg:col-span-6">
                {featuredPost && (
                  <div 
                    key={featuredPost.id}
                    className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full ${
                      hoveredCard === featuredPost.id ? "ring-2 ring-amber-400" : ""
                    }`}
                    onMouseEnter={() => setHoveredCard(featuredPost.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getPostGradient(featuredPost, 0)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    {/* Badge "À la une" */}
                    <div className="absolute top-6 left-6 z-20">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        À la une
                      </div>
                    </div>
                    
                    <div className="relative z-10 p-8">
                      <div className="aspect-video mb-6 rounded-2xl overflow-hidden">
                        <img 
                          src={`/storage/${getPostImage(featuredPost)}`} 
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white ${getCategoryColor(featuredPost.category_id)} mb-6`}>
                        #{getCategoryName(featuredPost.category.id)}
                      </div>
                      <br />
                      <Link href={`/blog/${featuredPost.id}`} className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-amber-700 transition-colors">
                        {featuredPost.title}
                      </Link>
                      
                      <p className="text-gray-600 mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Par {getAuthorName(featuredPost)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(featuredPost.publishedAt.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{featuredPost.read_time || '5 min'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleLike(featuredPost.id)}
                            className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Heart className={`w-5 h-5 ${likedPosts.includes(featuredPost.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="text-sm">{(featuredPost.likes || 0) + (likedPosts.includes(featuredPost.id) ? 1 : 0)}</span>
                          </button>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm">{featuredPost.views || 0}</span>
                          </div>

                        </div>
                      
                        <Link href={`/blog/${featuredPost.id}`} className="inline-flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors">
                          Lire la suite
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-3 space-y-8">
                {rightPosts.map((post, index) => (
                  <div 
                    key={post.id}
                    className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                      hoveredCard === post.id ? "ring-2 ring-amber-400" : ""
                    }`}
                    onMouseEnter={() => setHoveredCard(post.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getPostGradient(post, index + 2)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10 p-6">
                      <div className="aspect-video mb-4 rounded-2xl overflow-hidden">
                        <img 
                          src={`/storage/${getPostImage(post)}`} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(post.category_id)} mb-4`}>
                        #{getCategoryName(post.category.id)}
                      </div>
                      <br />
                      <Link href={`/blog/${post.id}`} className="text-lg font-bold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors mb-3">
                        {post.title}
                      </Link>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{post.views || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className={`w-3 h-3 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{(post.likes || 0) + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.read_time || '5 min'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {postsData.last_page > 1 && (
              <div className="flex justify-center items-center gap-2 mb-16">
                {postsData.links.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url || '#'}
                    preserveState
                    preserveScroll
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      link.active
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                        : link.url
                        ? 'bg-white text-gray-700 hover:bg-amber-50 shadow'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}

            {/* CTA Button */}
            <div className={`text-center transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Link href={route('blog')} className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105">
                <span>Voir plus d'actualités</span>
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                  <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
                
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Newsletter Section */}
      <div className={`mt-20 bg-gradient-to-r from-amber-600 to-yellow-600 py-16 px-4 transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Restez informé de notre actualité
          </h2>
          <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
            Abonnez-vous à notre newsletter pour recevoir les dernières nouvelles et événements de l'université.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              required
              disabled={newsletterLoading || newsletterSuccess}
            />
            <button 
              type="submit"
              disabled={newsletterLoading || newsletterSuccess}
              className="px-6 py-3 bg-white text-amber-600 font-semibold rounded-xl shadow-lg hover:bg-amber-50 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {newsletterLoading ? 'Envoi...' : newsletterSuccess ? 'Inscrit !' : "S'abonner"}
            </button>
          </form>
          {newsletterError && (
            <p className="text-red-200 text-sm mt-3">{newsletterError}</p>
          )}
          {newsletterSuccess && (
            <p className="text-white text-sm mt-3">✓ Merci de vous être abonné à notre newsletter !</p>
          )}
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-300/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Styles pour les animations de blob */}
      <style>{`
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
      `}</style>
    </section>
  );
}

// Icône Star pour le badge "À la une"
function Star({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}