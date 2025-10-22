import React, { useState } from 'react';
import { Clock, User, MessageCircle, ChevronRight, Filter } from 'lucide-react';

export default function Blog() {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);

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
      category: 'Études',
      title: 'Notre Université accueille un sommet international sur le climat',
      image: '/api/placeholder/400/300',
      size: 'small',
      gradient: 'from-emerald-500/20 to-teal-600/20'
    },
    {
      id: 2,
      category: 'Distinctions',
      title: 'Trente-et-un enseignants-chercheurs honorés par des chaires prestigieuses',
      image: '/api/placeholder/400/300',
      size: 'small',
      gradient: 'from-purple-500/20 to-indigo-600/20'
    },
    {
      id: 3,
      category: 'Formations',
      title: 'Notre Université obtient un financement exceptionnel pour ses programmes STEM innovants',
      image: '/api/placeholder/600/400',
      author: 'Louis Saville',
      date: '15/10/2023',
      comments: 15,
      size: 'large',
      gradient: 'from-blue-500/20 to-cyan-600/20'
    },
    {
      id: 4,
      category: 'Récompense',
      title: 'Notre Université primée pour son engagement citoyen',
      image: '/api/placeholder/400/300',
      size: 'small',
      gradient: 'from-orange-500/20 to-red-600/20'
    },
    {
      id: 5,
      category: 'Campus',
      title: 'Modernisation de nos infrastructures avec un nouveau laboratoire high-tech',
      image: '/api/placeholder/400/300',
      size: 'small',
      gradient: 'from-violet-500/20 to-pink-600/20'
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

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-16">
          <div className="mb-8 lg:mb-0">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600 font-semibold text-sm tracking-wider uppercase">
                Actualités récentes
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold bg-clip-text text-slate-700 leading-tight">
              L'actualité du
              <span className="block bg-clip-text text-slate-600">
                campus
              </span>
            </h1>
          </div>

          {/* Topic Filter */}
          <div className="relative">
            <div className="flex items-center gap-3 p-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
              <Filter className="w-5 h-5 text-slate-600 ml-3" />
              <select 
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-transparent text-slate-700 font-medium pr-8 pl-2 py-3 focus:outline-none cursor-pointer"
              >
                {topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            {blogPosts.filter(post => post.size === 'small').slice(0, 2).map((post) => (
              <div 
                key={post.id}
                className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
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
                  
                  <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                    {post.title}
                  </h3>
                </div>

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-3xl transition-colors duration-500"></div>
              </div>
            ))}
          </div>

          {/* Center Column - Featured Post */}
          <div className="lg:col-span-6">
            {blogPosts.filter(post => post.size === 'large').map((post) => (
              <div 
                key={post.id}
                className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full"
                onMouseEnter={() => setHoveredCard(post.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
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
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 leading-tight mb-6 group-hover:text-slate-900 transition-colors">
                    {post.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-6 text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Par {post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{post.comments} commentaires</span>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-3xl transition-colors duration-500"></div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-8">
            {blogPosts.filter(post => post.size === 'small').slice(2, 4).map((post) => (
              <div 
                key={post.id}
                className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
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
                  
                  <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                    {post.title}
                  </h3>
                </div>

                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-3xl transition-colors duration-500"></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105">
            <span>Voir plus d'actualités</span>
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
              <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
            
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
          </button>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </section>
  );
}