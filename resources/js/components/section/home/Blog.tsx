import React, { useState, useEffect } from 'react';
import { Clock, User, MessageCircle, ChevronRight, Filter, Calendar, Tag, Eye, Heart, Share2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Blog() {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const { props } = usePage();

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const topics = [
    { value: 'all', label: 'Toutes les thématiques' },
    { value: 'arts', label: 'Arts, Lettres & Sciences Humaines' },
    { value: 'student-life', label: 'Vie étudiante & Communauté' },
    { value: 'law-economics', label: 'Droit, Économie & Gestion' },
    { value: 'health', label: 'Sciences de la Santé' },
    { value: 'science-tech', label: 'Sciences & Technologies' }
  ];

  const blogPosts = [
  {
    id: 1,
    category: 'Recherche & Innovation',
    title: "L’UMK lance un centre d’excellence en énergie renouvelable",
    excerpt: "Ce centre, premier du genre en RDC, formera les étudiants aux technologies solaires et à la gestion durable de l’énergie.",
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Solar_panels_set_up_to_convert_sunlight_into_electrical_energy._At_the_University_of_Zambia.jpg?width=1200',
    author: 'Pr. Grâce Mbuyi',
    date: '20/10/2025',
    readTime: '6 min',
    views: 1780,
    likes: 142,
    comments: 21,
    size: 'small',
    gradient: 'from-emerald-500/20 to-green-600/20',
    featured: false
  },
  {
    id: 2,
    category: 'Distinction',
    title: "Des étudiants de l’UMK remportent le prix national de l’innovation technologique",
    excerpt: "Leur projet de plateforme numérique pour la gestion des déchets urbains a séduit le jury du concours GénieTech RDC 2025.",
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Participants_from_WMA_Hackathon_Accra_Satellite_Event_41.jpg?width=1200',
    author: 'Jean-Paul Kanku',
    date: '18/10/2025',
    readTime: '4 min',
    views: 1325,
    likes: 98,
    comments: 16,
    size: 'small',
    gradient: 'from-blue-500/20 to-cyan-600/20',
    featured: false
  },
  {
    id: 3,
    category: 'Partenariat',
    title: "L’UMK signe un accord stratégique avec l’Université de Kinshasa pour la recherche scientifique",
    excerpt: "Cet accord permettra le partage de laboratoires, de chercheurs et la création de programmes conjoints de master et doctorat.",
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Secretary%20Blinken%20at%20MOU%20Signing%20Ceremony%20with%20Democratic%20Republic%20of%20the%20Congo%20Foreign%20Minister%20Lutundula%20and%20Zambian%20Foreign%20Minister%20Kakubo%20(52562579804).jpg?width=1200',
    author: 'Pr. Mado Nsenda',
    date: '15/10/2025',
    readTime: '7 min',
    views: 2540,
    likes: 189,
    comments: 30,
    size: 'large',
    gradient: 'from-indigo-500/20 to-purple-600/20',
    featured: true
  },
  {
    id: 4,
    category: 'Vie Étudiante',
    title: "Semaine culturelle UMK : traditions, art et innovation au cœur du campus",
    excerpt: "Les étudiants ont célébré la diversité culturelle congolaise à travers des expositions, des danses et des ateliers créatifs.",
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Culture_festival_at_School_children_Dance.jpg?width=1200',
    author: 'Clarisse Mfwamba',
    date: '10/10/2025',
    readTime: '5 min',
    views: 1103,
    likes: 85,
    comments: 19,
    size: 'small',
    gradient: 'from-orange-500/20 to-red-600/20',
    featured: false
  },
  {
    id: 5,
    category: 'Infrastructures',
    title: "Un nouveau bâtiment intelligent pour la Faculté de Génie Informatique",
    excerpt: "Doté de laboratoires connectés et d’espaces collaboratifs, ce bâtiment positionne l’UMK comme un campus du futur.",
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Computer_lab_1.jpg?width=1200',
    author: 'Patrick Nzau',
    date: '05/10/2025',
    readTime: '6 min',
    views: 1658,
    likes: 123,
    comments: 22,
    size: 'small',
    gradient: 'from-violet-500/20 to-pink-600/20',
    featured: false
  }
];



  const getCategoryColor = (category) => {
    const colors = {
      'Études': 'bg-emerald-500',
      'Distinctions': 'bg-purple-500',
      'Formations': 'bg-blue-500',
      'Récompense': 'bg-orange-500',
      'Campus': 'bg-violet-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
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
                onChange={(e) => setSelectedTopic(e.target.value)}
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

        {/* Blog Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            {blogPosts.filter(post => post.size === 'small').slice(0, 2).map((post) => (
              <div 
                key={post.id}
                className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  hoveredCard === post.id ? "ring-2 ring-amber-400" : ""
                }`}
                onMouseEnter={() => setHoveredCard(post.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10 p-6">
                  <div className="aspect-video mb-4 rounded-2xl overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(post.category)} mb-4`}>
                    #{post.category}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors mb-3">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className={`w-3 h-3 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.likes + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Center Column - Featured Post */}
          <div className="lg:col-span-6">
            {blogPosts.filter(post => post.size === 'large').map((post) => (
              <div 
                key={post.id}
                className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full ${
                  hoveredCard === post.id ? "ring-2 ring-amber-400" : ""
                }`}
                onMouseEnter={() => setHoveredCard(post.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Badge "À la une" */}
                {post.featured && (
                  <div className="absolute top-6 left-6 z-20">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      À la une
                    </div>
                  </div>
                )}
                
                <div className="relative z-10 p-8">
                  <div className="aspect-video mb-6 rounded-2xl overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white ${getCategoryColor(post.category)} mb-6`}>
                    #{post.category}
                  </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-amber-700 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Par {post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{post.readTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm">{post.likes + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                      </button>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                      <button className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  
                    <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors">
                      Lire la suite
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-8">
            {blogPosts.filter(post => post.size === 'small').slice(2, 4).map((post) => (
              <div 
                key={post.id}
                className={`group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  hoveredCard === post.id ? "ring-2 ring-amber-400" : ""
                }`}
                onMouseEnter={() => setHoveredCard(post.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10 p-6">
                  <div className="aspect-video mb-4 rounded-2xl overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(post.category)} mb-4`}>
                    #{post.category}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-amber-700 transition-colors mb-3">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className={`w-3 h-3 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.likes + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-amber-600 font-semibold rounded-xl shadow-lg hover:bg-amber-50 transition-colors duration-300">
              S'abonner
            </button>
          </div>
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

      {/* Styles pour les animations de blob et l'icône Star */}
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