import { useState, useRef } from 'react';
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
  FaChevronRight,
  FaTags,
  FaBookmark,
  FaShareAlt,
  FaHeart,
  FaFilter,
  FaTimes,
  FaPlay,
  FaCircle,
  FaReply,
  FaThLarge,
  FaPinterestP} from 'react-icons/fa';

const BlogDetailsSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(384); // 6:24 en secondes
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(1454);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "John Smith",
      avatar: "https://picsum.photos/seed/avatar3/100/100.jpg",
      date: "Dec 24, 2024 at 10:21am",
      content: "EduFord University transformed my academic experience with its supportive faculty and cutting-edge resources. It's been the perfect place for my education.",
      replies: [
        {
          id: 11,
          author: "Daniel Garcia",
          avatar: "https://picsum.photos/seed/avatar4/100/100.jpg",
          date: "Dec 24, 2024 at 10:21am",
          content: "My time at EduFord University has been invaluable. The diverse and excellent have equipped me for a successful career."
        }
      ]
    },
    {
      id: 2,
      author: "John Smith",
      avatar: "https://picsum.photos/seed/avatar5/100/100.jpg",
      date: "Dec 24, 2024 at 10:21am",
      content: "EduFord University blends rigorous academics with practical experience. The hands-on learning and faculty support have set me up for success.",
      replies: []
    }
  ]);
  const [newComment, setNewComment] = useState({
    name: "",
    email: "",
    content: "",
    saveInfo: false
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Gestion de la lecture audio
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const setAudioProgress = (e) => {
    const progressBar = progressBarRef.current;
    const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    audioRef.current.currentTime = clickPosition * duration;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Gestion des likes
  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  // Gestion des commentaires
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.name && newComment.email && newComment.content) {
      const comment = {
        id: comments.length + 1,
        author: newComment.name,
        avatar: `https://picsum.photos/seed/avatar${comments.length + 6}/100/100.jpg`,
        date: new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        content: newComment.content,
        replies: []
      };
      setComments([...comments, comment]);
      setNewComment({ name: "", email: "", content: "", saveInfo: false });
    }
  };

  const handleReplySubmit = (commentId) => {
    if (replyContent) {
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [
              ...comment.replies,
              {
                id: Date.now(),
                author: newComment.name || "Anonymous",
                avatar: `https://picsum.photos/seed/avatar${Date.now()}/100/100.jpg`,
                date: new Date().toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                content: replyContent
              }
            ]
          };
        }
        return comment;
      });
      setComments(updatedComments);
      setReplyContent("");
      setReplyingTo(null);
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

      {/* Section principale du blog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Image principale */}
            <div className="relative mb-8 overflow-hidden rounded-2xl shadow-2xl group">
              <img 
                src="https://picsum.photos/seed/blog_single/1200/600.jpg" 
                alt="EduFord University Expands Campus Facilities" 
                className="w-full h-64 sm:h-80 md:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40"></div>
            </div>

            {/* Métadonnées de l'article */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                  #Campus Life
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <FaClock className="mr-1" />
                  <span>11/12/2024</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleLike}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                    isLiked 
                      ? 'bg-red-100 text-red-500' 
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <FaHeart className={isLiked ? 'fas' : 'far'} />
                  <span className="text-sm">{likesCount}</span>
                </button>
                <button 
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2 rounded-full transition-colors ${
                    isBookmarked 
                      ? 'bg-yellow-100 text-yellow-500' 
                      : 'text-gray-500 hover:text-yellow-500'
                  }`}
                >
                  <FaBookmark className={isBookmarked ? 'fas' : 'far'} />
                </button>
                <button className="p-2 rounded-full text-gray-500 hover:text-amber-500 transition-colors">
                  <FaShareAlt />
                </button>
              </div>
            </div>

            {/* Titre de l'article */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
              EduFord University Expands Campus Facilities with State-of-the-Art Research and Innovation Center.
            </h1>

            {/* Extrait de l'article */}
            <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
              This new facility will serve as a hub for cutting-edge research, fostering collaboration between students, faculty, and industry leaders. Equipped with the latest technology and specialized labs, the center is designed to support groundbreaking.
            </p>

            {/* Informations sur l'auteur et interactions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-gray-200 space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <img 
                  src="https://picsum.photos/seed/avatar1/100/100.jpg" 
                  alt="James Michael" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3"
                />
                <div>
                  <span className="text-sm sm:text-base font-medium text-gray-800">James Michael</span>
                  <div className="text-xs sm:text-sm text-gray-500">Content Editor</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <FaComment className="mr-1" />
                  14 Comments
                </span>
                <span className="flex items-center">
                  <FaEye className="mr-1" />
                  {likesCount} Views
                </span>
              </div>
            </div>

            {/* Lecteur audio */}
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Listen to this article</h3>
                <span className="text-sm text-gray-600">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
                >
                  {isPlaying ? <FaTimes /> : <FaPlay />}
                </button>
                <div 
                  ref={progressBarRef}
                  className="flex-1 h-2 bg-white rounded-full overflow-hidden cursor-pointer"
                  onClick={setAudioProgress}
                >
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              </div>
              <audio 
                ref={audioRef}
                onTimeUpdate={updateProgress}
                onLoadedMetadata={() => setDuration(audioRef.current.duration)}
              >
                <source src="#" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

            {/* Contenu de l'article */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Revolutionizing Business Efficiency Navigating Growth with Optimal IT Infrastructure Enhancement
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <img 
                    src="https://picsum.photos/seed/blog_single2/600/400.jpg" 
                    alt="Research Facility" 
                    className="w-full h-48 sm:h-56 object-cover rounded-lg"
                  />
                  <img 
                    src="https://picsum.photos/seed/blog_single3/600/400.jpg" 
                    alt="Innovation Center" 
                    className="w-full h-48 sm:h-56 object-cover rounded-lg"
                  />
                </div>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4">
                  EduFord University is proud to announce the expansion of its campus facilities with the addition of a state-of-the-art Research and Innovation Center. This new facility is designed to foster cutting-edge research, creativity, and collaboration among students, faculty, and industry partners. Equipped with the latest technology and resources, the center will serve as a hub for interdisciplinary projects, enabling the university community to explore new ideas, develop innovative solutions.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  The Research and Innovation Center will host a variety of interdisciplinary programs and initiatives, bringing together experts from diverse fields such as engineering, science, technology, and the humanities. This collaborative environment will encourage the development of groundbreaking projects that address real-world challenges, from sustainable energy solutions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Sample Heading</h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                  EduFord University is broadening its academic landscape with the introduction of a cutting-edge Research and Innovation Center. This new facility is a testament to the university's dedication to fostering a culture of innovation and collaboration. Designed to support interdisciplinary research, the center will bring together students, faculty, and industry experts to explore new ideas and develop solutions to some of the world's most pressing challenges.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <img 
                    src="https://picsum.photos/seed/blog_single4/600/400.jpg" 
                    alt="Tech-Enhanced Classrooms" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Tech-Enhanced Classrooms</span>
                    </li>
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Research Funding Support</span>
                    </li>
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Global Research Network</span>
                    </li>
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Entrepreneurship Programs</span>
                    </li>
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Community Engagement</span>
                    </li>
                    <li className="flex items-start">
                      <FaCircle className="text-amber-500 text-xs mt-1.5 mr-3" />
                      <span className="text-gray-700">Collaborative Workspaces</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3 Reasons to investing at this moment</h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4">
                  Here are three key reasons emphasizing the importance of optimizing IT infrastructure for efficiency and growth:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="font-bold text-amber-600 mr-3">1.</span>
                    <span className="text-gray-700">Portfolio Diversification and Risk Management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-amber-600 mr-3">2.</span>
                    <span className="text-gray-700">Market Opportunities and Timing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-amber-600 mr-3">3.</span>
                    <span className="text-gray-700">Long-Term Growth and Compounding</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tags et partage */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 pb-8 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer">
                  School
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer">
                  College
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer">
                  University
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Share:</span>
                <a href="#" className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <FaFacebookF className="text-sm" />
                </a>
                <a href="#" className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <FaTwitter className="text-sm" />
                </a>
                <a href="#" className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                  <FaLinkedinIn className="text-sm" />
                </a>
                <a href="#" className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                  <FaPinterestP className="text-sm" />
                </a>
              </div>
            </div>

            {/* Navigation entre articles */}
            <div className="flex flex-col md:flex-row justify-between items-center py-6 border-t border-b border-gray-200 space-y-4 md:space-y-0">
              <a href="#" className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                <FaArrowLeft className="mr-2" />
                <div>
                  <div className="text-sm font-medium">Previous Article</div>
                  <div className="text-xs text-gray-500">EduFord University Opens New High-Tech Library</div>
                </div>
              </a>
              <a href="#" className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors">
                <FaThLarge />
              </a>
              <a href="#" className="flex items-center text-gray-700 hover:text-amber-600 transition-colors">
                <div className="text-right">
                  <div className="text-sm font-medium">Next Article</div>
                  <div className="text-xs text-gray-500">EduFord University Hosts Global Sustainability</div>
                </div>
                <FaArrowRight className="ml-2" />
              </a>
            </div>

            {/* Section des commentaires */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Comments ({comments.length})</h2>
              
              {/* Liste des commentaires */}
              <div className="space-y-6 mb-8">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-4">
                    <div className="flex space-x-4">
                      <img 
                        src={comment.avatar} 
                        alt={comment.author} 
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800">{comment.author}</h4>
                            <span className="text-xs text-gray-500">{comment.date}</span>
                          </div>
                          <p className="text-gray-600">{comment.content}</p>
                        </div>
                        <button 
                          onClick={() => setReplyingTo(comment.id)}
                          className="mt-2 text-sm text-amber-600 hover:text-amber-700 transition-colors flex items-center"
                        >
                          <FaReply className="mr-1" />
                          Reply
                        </button>
                      </div>
                    </div>
                    
                    {/* Réponses au commentaire */}
                    {comment.replies.length > 0 && (
                      <div className="ml-12 space-y-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-4">
                            <img 
                              src={reply.avatar} 
                              alt={reply.author} 
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-800">{reply.author}</h4>
                                  <span className="text-xs text-gray-500">{reply.date}</span>
                                </div>
                                <p className="text-gray-600">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Formulaire de réponse */}
                    {replyingTo === comment.id && (
                      <div className="ml-12 mt-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write your reply..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            rows="3"
                          ></textarea>
                          <div className="flex justify-end mt-2 space-x-2">
                            <button 
                              onClick={() => setReplyingTo(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleReplySubmit(comment.id)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Formulaire de commentaire */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Comment</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your email address will not be published. Required fields are marked <span className="text-amber-600">*</span>
                </p>
                <form onSubmit={handleCommentSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newComment.name}
                        onChange={(e) => setNewComment({...newComment, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Email <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={newComment.email}
                        onChange={(e) => setNewComment({...newComment, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Your email"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                      Comments / Questions <span className="text-amber-600">*</span>
                    </label>
                    <textarea
                      id="comment"
                      value={newComment.content}
                      onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      rows="4"
                      placeholder="Share your thoughts..."
                      required
                    ></textarea>
                  </div>
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newComment.saveInfo}
                        onChange={(e) => setNewComment({...newComment, saveInfo: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Save my name, email, and website in this browser for the next time I comment.</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all flex items-center"
                  >
                    Submit Comment
                    <FaArrowRight className="ml-2" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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
                {[
                  {
                    id: 1,
                    title: "EduFord University Opens New High-Tech Library",
                    date: "11/12/2024",
                    image: "https://picsum.photos/seed/blog_09/200/150.jpg"
                  },
                  {
                    id: 2,
                    title: "University's STEM Ranks Top 10 Nationwide",
                    date: "11/12/2024",
                    image: "https://picsum.photos/seed/blog_10/200/150.jpg"
                  },
                  {
                    id: 3,
                    title: "EduFord University Host Global Sustainability",
                    date: "11/12/2024",
                    image: "https://picsum.photos/seed/blog_11/200/150.jpg"
                  }
                ].map((post) => (
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
                        <span>{post.date}</span>
                      </div>
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
                {[
                  { name: "Child Development", count: 5 },
                  { name: "Computer Engineering", count: 2 },
                  { name: "Learning", count: 2 },
                  { name: "Science", count: 4 },
                  { name: "Technology", count: 3 },
                  { name: "Web Development", count: 7 }
                ].map((category, index) => (
                  <li key={index}>
                    <a 
                      href="#"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <FaChevronRight className="mr-2 text-xs text-amber-500" />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">{category.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags populaires */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                <FaTags className="mr-2 text-amber-500" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "School", "College", "university", "Scholarships", 
                  "GlobalEducation", "HigherEducation", "OnlineLearning", 
                  "Learning", "Faculty", "Global"
                ].map((tag, index) => (
                  <a 
                    key={index}
                    href="#"
                    className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

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
      `}</style>
    </div>
  );
};

export default BlogDetailsSection;