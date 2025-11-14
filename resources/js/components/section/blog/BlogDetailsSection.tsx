import { Link } from '@inertiajs/react';
import { User } from 'lucide-react';
import { useRef, useState } from 'react';
import {
    FaArrowLeft,
    FaArrowRight,
    FaBookmark,
    FaChevronRight,
    FaClock,
    FaComment,
    FaEye,
    FaFacebookF,
    FaFilter,
    FaHeart,
    FaLinkedinIn,
    FaPinterestP,
    FaPlay,
    FaSearch,
    FaTags,
    FaThLarge,
    FaTimes,
    FaTwitter,
} from 'react-icons/fa';

const BlogDetailsSection = ({ post, categories }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(384);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [likesCount, setLikesCount] = useState(post?.likes || 0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState({
        name: '',
        email: '',
        content: '',
        saveInfo: false,
    });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    // Parse gallery JSON
    let gallery = [];
    if (post?.gallery) {
        try {
            gallery = post.gallery;
        } catch (e) {
            console.warn('Échec du JSON.parse sur la galerie :', post.gallery, e);
            gallery = [];
        }
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
    };

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
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newComment.name)}&background=random`,
                date: new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                content: newComment.content,
                replies: [],
            };
            setComments([...comments, comment]);
            setNewComment({ name: '', email: '', content: '', saveInfo: false });
        }
    };

    const handleReplySubmit = (commentId) => {
        if (replyContent) {
            const updatedComments = comments.map((comment) => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        replies: [
                            ...comment.replies,
                            {
                                id: Date.now(),
                                author: newComment.name || 'Anonymous',
                                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newComment.name || 'Anonymous')}&background=random`,
                                date: new Date().toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }),
                                content: replyContent,
                            },
                        ],
                    };
                }
                return comment;
            });
            setComments(updatedComments);
            setReplyContent('');
            setReplyingTo(null);
        }
    };

    // Parse content sections if stored as JSON
    const parseContent = (content) => {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.warn('Échec du JSON.parse sur :', content, e);
            return [{ type: 'text', content }];
        }
    };

    if (!post) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-amber-50 via-white to-yellow-50">
                <div className="text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-800">Post not found</h2>
                    <p className="text-gray-600">The article you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-yellow-50">
            {/* Éléments décoratifs d'arrière-plan */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="animate-blob absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
                <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-yellow-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
                <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-amber-300 opacity-20 mix-blend-multiply blur-xl filter"></div>
            </div>

            {/* Section principale du blog */}
            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    {/* Contenu principal */}
                    <div className="lg:col-span-2">
                        {/* Image principale */}
                        <div className="group relative mb-8 overflow-hidden rounded-2xl shadow-2xl">
                            <img
                                src={`/storage/${post.main_image_1}` || 'https://picsum.photos/seed/blog_single/1200/600.jpg'}
                                alt={post.title}
                                className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-80 md:h-96"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-40"></div>
                        </div>

                        {/* Métadonnées de l'article */}
                        <div className="mb-6 flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                {post.category && (
                                    <span
                                        className="inline-block rounded-full px-3 py-1 text-sm font-medium"
                                        style={{
                                            backgroundColor: post.category.color ? `${post.category.color}20` : '#FEF3C7',
                                            color: post.category.color || '#D97706',
                                        }}
                                    >
                                        #{post.category.name}
                                    </span>
                                )}
                                <div className="flex items-center text-sm text-gray-500">
                                    <FaClock className="mr-1" />
                                    <span>{formatDate(post.published_at || post.created_at)}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={toggleLike}
                                    className={`flex items-center space-x-1 rounded-full px-3 py-1 transition-colors ${
                                        isLiked ? 'bg-red-100 text-red-500' : 'text-gray-500 hover:text-red-500'
                                    }`}
                                >
                                    <FaHeart className={isLiked ? 'fas' : 'far'} />
                                    <span className="text-sm">{likesCount}</span>
                                </button>
                                <button
                                    onClick={() => setIsBookmarked(!isBookmarked)}
                                    className={`rounded-full p-2 transition-colors ${
                                        isBookmarked ? 'bg-yellow-100 text-yellow-500' : 'text-gray-500 hover:text-yellow-500'
                                    }`}
                                >
                                    <FaBookmark className={isBookmarked ? 'fas' : 'far'} />
                                </button>
                            </div>
                        </div>

                        {/* Titre de l'article */}
                        <h1 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl lg:text-4xl">{post.title}</h1>

                        {/* Extrait de l'article */}
                        {post.excerpt && <p className="mb-6 text-base leading-relaxed text-gray-600 sm:text-lg">{post.excerpt}</p>}

                        {/* Informations sur l'auteur et interactions */}
                        <div className="mb-6 flex flex-col items-start justify-between space-y-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:space-y-0">
                            <div className="flex items-center">
                                <div className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-300">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-800 sm:text-base">{post.author?.last_name || 'Anonymous'}</span>
                                    <div className="text-xs text-gray-500 sm:text-sm">{post.author?.role || 'Administarteur'}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                    <FaComment className="mr-1" />
                                    {post.comments_count || comments.length} Commentaire(s)
                                </span>
                                <span className="flex items-center">
                                    <FaEye className="mr-1" />
                                    {post.views || 0} Vues
                                </span>
                                {post.read_time && (
                                    <span className="flex items-center">
                                        <FaClock className="mr-1" />
                                        {post.read_time}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Lecteur audio (optionnel) */}
                        {post.audio_url && (
                            <div className="mb-8 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800">Ecoutez cet article</h3>
                                    <span className="text-sm text-gray-600">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={togglePlay}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white transition-colors hover:bg-amber-600"
                                    >
                                        {isPlaying ? <FaTimes /> : <FaPlay />}
                                    </button>
                                    <div
                                        ref={progressBarRef}
                                        className="h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-white"
                                        onClick={setAudioProgress}
                                    >
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-300"
                                            style={{ width: `${(currentTime / duration) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <audio ref={audioRef} onTimeUpdate={updateProgress} onLoadedMetadata={() => setDuration(audioRef.current.duration)}>
                                    <source src={post.audio_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}

                        {/* Contenu de l'article */}
                        <div className="space-y-8">
                            {/* Contenu principal */}
                            <div className="prose max-w-none">
                                <div
                                    className="text-base leading-relaxed text-gray-600 sm:text-lg"
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />
                            </div>

                            {/* Images de la galerie */}
                            {post.main_image_2 && (
                                <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {post.main_image_1 && (
                                        <img
                                            src={`/storage/${post.main_image_1}`}
                                            alt="Image 1"
                                            className="h-48 w-full rounded-lg object-cover sm:h-56"
                                        />
                                    )}
                                    <img
                                        src={`/storage/${post.main_image_2}`}
                                        alt="Image 2"
                                        className="h-48 w-full rounded-lg object-cover sm:h-56"
                                    />
                                </div>
                            )}

                            {/* Galerie supplémentaire */}
                            {gallery.length > 0 && (
                                <div className="my-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                                    {gallery.map((image, index) => (
                                        <img key={index} src={image} alt={`Gallery ${index + 1}`} className="h-40 w-full rounded-lg object-cover" />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tags et partage */}
                        <div className="flex flex-col items-start justify-between space-y-4 border-t border-gray-200 pt-6 pb-8 sm:flex-row sm:items-center sm:space-y-0">
                            <div className="flex flex-wrap gap-2">
                                {post.tags && post.tags.length > 0 ? (
                                    post.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <>
                                        <span className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700">
                                            Ecole
                                        </span>
                                        <span className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700">
                                            Collège
                                        </span>
                                        <span className="cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700">
                                            Université
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-600">Partager:</span>
                                <a
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700"
                                >
                                    <FaFacebookF className="text-sm" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-white transition-colors hover:bg-blue-500"
                                >
                                    <FaTwitter className="text-sm" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white transition-colors hover:bg-blue-800"
                                >
                                    <FaLinkedinIn className="text-sm" />
                                </a>
                                <a
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                                >
                                    <FaPinterestP className="text-sm" />
                                </a>
                            </div>
                        </div>

                        {/* Navigation entre articles */}
                        {/* <div className="flex flex-col items-center justify-between space-y-4 border-t border-b border-gray-200 py-6 md:flex-row md:space-y-0">
                            <a href="#" className="flex items-center text-gray-700 transition-colors hover:text-amber-600">
                                <FaArrowLeft className="mr-2" />
                                <div>
                                    <div className="text-sm font-medium">Article précédent</div>
                                    <div className="text-xs text-gray-500">Aller à l'article précédent</div>
                                </div>
                            </a>
                            <a
                                href="/blog"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white transition-colors hover:bg-amber-600"
                            >
                                <FaThLarge />
                            </a>
                            <a href="#" className="flex items-center text-gray-700 transition-colors hover:text-amber-600">
                                <div className="text-right">
                                    <div className="text-sm font-medium">Article suivant</div>
                                    <div className="text-xs text-gray-500">Aller à l'article suivant</div>
                                </div>
                                <FaArrowRight className="ml-2" />
                            </a>
                        </div> */}

                        {/* Section des commentaires */}
                        {/* <div className="py-8">
                            <h2 className="mb-6 text-2xl font-bold text-gray-800">Comments ({post.comments_count || comments.length})</h2>

                            {comments.length > 0 && (
                                <div className="mb-8 space-y-6">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="space-y-4">
                                            <div className="flex space-x-4">
                                                <img src={comment.avatar} alt={comment.author} className="h-12 w-12 rounded-full" />
                                                <div className="flex-1">
                                                    <div className="rounded-lg bg-gray-50 p-4">
                                                        <div className="mb-2 flex items-start justify-between">
                                                            <h4 className="font-medium text-gray-800">{comment.author}</h4>
                                                            <span className="text-xs text-gray-500">{comment.date}</span>
                                                        </div>
                                                        <p className="text-gray-600">{comment.content}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setReplyingTo(comment.id)}
                                                        className="mt-2 flex items-center text-sm text-amber-600 transition-colors hover:text-amber-700"
                                                    >
                                                        <FaReply className="mr-1" />
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>

                                            {comment.replies.length > 0 && (
                                                <div className="ml-12 space-y-4">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="flex space-x-4">
                                                            <img src={reply.avatar} alt={reply.author} className="h-10 w-10 rounded-full" />
                                                            <div className="flex-1">
                                                                <div className="rounded-lg bg-gray-50 p-4">
                                                                    <div className="mb-2 flex items-start justify-between">
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

                                            {replyingTo === comment.id && (
                                                <div className="mt-4 ml-12">
                                                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                                                        <textarea
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            placeholder="Write your reply..."
                                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                            rows="3"
                                                        ></textarea>
                                                        <div className="mt-2 flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => setReplyingTo(null)}
                                                                className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleReplySubmit(comment.id)}
                                                                className="rounded-lg bg-amber-500 px-4 py-2 text-white transition-colors hover:bg-amber-600"
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
                            )}

                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                                <h3 className="mb-4 text-xl font-bold text-gray-800">Leave a Comment</h3>
                                <p className="mb-6 text-sm text-gray-600">
                                    Your email address will not be published. Required fields are marked <span className="text-amber-600">*</span>
                                </p>
                                <form onSubmit={handleCommentSubmit}>
                                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                                Full Name <span className="text-amber-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={newComment.name}
                                                onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                                Your Email <span className="text-amber-600">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={newComment.email}
                                                onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                placeholder="Your email"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-gray-700">
                                            Comments / Questions <span className="text-amber-600">*</span>
                                        </label>
                                        <textarea
                                            id="comment"
                                            value={newComment.content}
                                            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                                                onChange={(e) => setNewComment({ ...newComment, saveInfo: e.target.checked })}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-600">
                                                Save my name, email, and website in this browser for the next time I comment.
                                            </span>
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-medium text-white transition-all hover:from-amber-600 hover:to-yellow-600"
                                    >
                                        Submit Comment
                                        <FaArrowRight className="ml-2" />
                                    </button>
                                </form>
                            </div>
                        </div> */}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Recherche */}
                        {/* <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <FaSearch className="mr-2 text-amber-500" />
                                Recherche
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search your keyword"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                                <button className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500">
                                    <FaSearch />
                                </button>
                            </div>
                        </div> */}

                        {/* Catégories */}
                        {categories && categories.length > 0 && (
                            <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
                                <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                    <FaFilter className="mr-2 text-amber-500" />
                                    Categories
                                </h3>
                                <ul className="space-y-2">
                                    {categories.map((category) => (
                                        <li key={category.id}>
                                            <Link
                                                href={`/blog`}
                                                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-amber-50"
                                            >
                                                <div className="flex items-center">
                                                    <FaChevronRight className="mr-2 text-xs text-amber-500" />
                                                    <span className="text-sm text-gray-700">{category.name}</span>
                                                </div>
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600">
                                                    {category.count || 4}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tags populaires */}
                        <div className="rounded-xl bg-white p-6 shadow-md">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-800">
                                <FaTags className="mr-2 text-amber-500" />
                                Popular Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags && post.tags.length > 0 ? (
                                    post.tags.map((tag, index) => (
                                        <Link
                                            key={index}
                                            href={`/blog`}
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            {tag}
                                        </Link>
                                    ))
                                ) : (
                                    <>
                                        <a
                                            href="#"
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            Ecole
                                        </a>
                                        <a
                                            href="#"
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            Collège
                                        </a>
                                        <a
                                            href="#"
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            Université
                                        </a>
                                        <a
                                            href="#"
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                                        >
                                            Bourses
                                        </a>
                                    </>
                                )}
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

                .prose {
                    max-width: none;
                }

                .prose h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #1f2937;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }

                .prose h3 {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #1f2937;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .prose p {
                    margin-bottom: 1rem;
                    line-height: 1.75;
                }

                .prose ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }

                .prose ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }

                .prose li {
                    margin-bottom: 0.5rem;
                }

                .prose img {
                    border-radius: 0.5rem;
                    margin: 1.5rem 0;
                }

                .prose blockquote {
                    border-left: 4px solid #f59e0b;
                    padding-left: 1rem;
                    font-style: italic;
                    color: #6b7280;
                    margin: 1.5rem 0;
                }

                .prose a {
                    color: #f59e0b;
                    text-decoration: underline;
                }

                .prose a:hover {
                    color: #d97706;
                }

                .prose code {
                    background-color: #f3f4f6;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                }

                .prose pre {
                    background-color: #1f2937;
                    color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1.5rem 0;
                }

                .prose pre code {
                    background-color: transparent;
                    color: inherit;
                    padding: 0;
                }
            `}</style>
        </div>
    );
};

export default BlogDetailsSection;
