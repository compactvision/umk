import App from '@/components/layouts/Home/App';
import Breadcumb from '@/components/UI/home/Breadcumb';
import { Link, usePage } from '@inertiajs/react';
import { Check, Play, Star, Clock, Users, BookOpen, Award, Globe, DollarSign, ChevronDown, Share2, ExternalLink, Sparkles, Calendar, Target } from 'lucide-react';
import { useState } from 'react';

export default function CoursShow() {
    const { course, mayLike } = usePage().props;
    const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

    return (
        <App>
            <Breadcumb title={course?.faculty?.name || 'N/A'} desc={course?.name || 'N/A'} />

            {/* Hero Section avec design ultra moderne */}
            <section className="relative pt-16 pb-8 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-yellow-300/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/15 to-purple-300/15 rounded-full blur-2xl"></div>
                </div>

                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Hero Image */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/50 mb-12">
                            <div className="aspect-[21/9] relative">
                                <img 
                                    src={course?.detail?.illustration_image ? `/storage/${course.detail.illustration_image}` : '/assets/img/default-course.png'} 
                                    alt={course?.title || 'Course'} 
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Sophisticated overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30"></div>
                                
                                {/* Content overlay */}
                                <div className="absolute bottom-8 left-8 right-8 text-white">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-lg border border-white/20">
                                            <span className="text-sm font-bold">{course?.faculty?.code || 'N/A'}</span>
                                        </div>
                                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400/90 to-yellow-500/90 backdrop-blur-lg">
                                            <span className="text-sm font-bold text-white">{course?.code || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black mb-4 leading-tight">
                                        {course?.title || 'N/A'}
                                    </h1>
                                    <p className="text-lg sm:text-xl text-white/90 max-w-3xl leading-relaxed">
                                        {course?.faculty?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="relative py-16 bg-gradient-to-b from-white to-slate-50/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            
                            {/* Sidebar Premium */}
                            <div className="lg:order-2">
                                <div className="sticky top-8 space-y-8">
                                    
                                    {/* Video Card */}
                                    <div className="group relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 overflow-hidden">
                                            <div className="aspect-video relative">
                                                <img 
                                                    src={course?.image ? `/storage/${course.image}` : '/assets/img/default-course.png'} 
                                                    alt={course?.title || 'Course'} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                    <a href="https://www.youtube.com/watch?v=cRXm1p-CNyk" className="group/play relative">
                                                        <div className="w-20 h-20 rounded-full bg-white/95 backdrop-blur-xl flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-all duration-300">
                                                            <Play size={24} className="text-amber-500 ml-1" fill="currentColor" />
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                                                    </a>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                <h3 className="text-xl font-black text-slate-900 mb-6">Détails du programme</h3>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                                            <DollarSign size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Prix</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.price || 'N/A'} $</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                                            <Calendar size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Durée</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.duration_years ? course.detail.duration_years * 2 : 'N/A'} Semestres</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                                                            <BookOpen size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Cours</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.courses_number || 0}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                                            <Users size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Places</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.student_number || 0}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                                                            <Globe size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Langue</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.language || 'N/A'}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100/50">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                                                            <Award size={20} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Certificat</div>
                                                            <div className="text-lg font-black text-slate-900">{course?.detail?.has_certificate ? 'Inclus' : 'Non inclus'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CTA Button Premium */}
                                                <div className="mt-8">
                                                    <Link
                                                        href={route('dashboard.enrollments.index')}
                                                        className="group/cta relative w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-white font-black text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/50 hover:scale-105 overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"></div>
                                                        <Sparkles size={20} className="relative z-10" />
                                                        <span className="relative z-10">S'inscrire maintenant</span>
                                                        <ExternalLink size={20} className="relative z-10 transition-transform duration-300 group-hover/cta:translate-x-1" />
                                                    </Link>
                                                </div>

                                                {/* Social Share */}
                                                <div className="mt-6 pt-6 border-t border-slate-200/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-700">Partager :</span>
                                                        <div className="flex items-center gap-2">
                                                            <button className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-all duration-200 hover:scale-110">
                                                                <i className="fab fa-facebook-f text-sm"></i>
                                                            </button>
                                                            <button className="w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-all duration-200 hover:scale-110">
                                                                <i className="fab fa-linkedin-in text-sm"></i>
                                                            </button>
                                                            <button className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-white transition-all duration-200 hover:scale-110">
                                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M9.4893 6.77491L15.3176 0H13.9365L8.87577 5.88256L4.8338 0H0.171875L6.28412 8.89547L0.171875 16H1.55307L6.8973 9.78782L11.1659 16H15.8278L9.48896 6.77491H9.4893ZM7.59756 8.97384L6.97826 8.08805L2.05073 1.03974H4.17217L8.14874 6.72795L8.76804 7.61374L13.9371 15.0075H11.8157L7.59756 8.97418V8.97384Z"/>
                                                                </svg>
                                                            </button>
                                                            <button className="w-10 h-10 rounded-xl bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-all duration-200 hover:scale-110">
                                                                <Share2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="lg:col-span-2">
                                <div className="space-y-12">
                                    
                                    {/* Meta Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50">
                                            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Code faculté</div>
                                            <div className="text-2xl font-black text-slate-900">{course?.faculty?.code || 'N/A'}</div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50">
                                            <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">Code niveau</div>
                                            <div className="text-2xl font-black text-slate-900">{course?.code || 'N/A'}</div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100/50">
                                            <div className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-2">Évaluation</div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={16} className="text-yellow-500" fill="currentColor" />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">5.0</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Section */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                                                <BookOpen size={24} className="text-white" />
                                            </div>
                                            <h2 className="text-2xl lg:text-3xl font-black text-slate-900">
                                                {course?.title || 'N/A'}, {course?.faculty?.name || 'N/A'}
                                            </h2>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full"></div>
                                                    Description du programme
                                                </h3>
                                                <div className="prose prose-slate max-w-none">
                                                    <p className="text-slate-700 leading-relaxed text-lg">
                                                        {course?.faculty?.description || 'Aucune description disponible.'}
                                                    </p>
                                                    <p className="text-slate-700 leading-relaxed text-lg mt-4">
                                                        {course?.description || 'Aucune description détaillée disponible.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objectifs Section */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                                <Target size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">Objectifs d'apprentissage</h3>
                                        </div>
                                        <p className="text-slate-700 leading-relaxed text-lg">
                                            {course?.detail?.course_objective || 'Aucun objectif spécifié.'}
                                        </p>
                                    </div>

                                    {/* Admission Conditions */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                                <Check size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">Conditions d'admission</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {Array.isArray(course?.admission_conditions) && course.admission_conditions.length > 0 ? (
                                                course.admission_conditions.map((cond, index) => (
                                                    <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-100">
                                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                        <p className="text-slate-700 leading-relaxed">
                                                            {cond?.description || 'Condition non spécifiée'}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed">
                                                        Aucune condition d'admission spécifiée
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Opportunities Table */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                                                <Award size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">Opportunités de carrière</h3>
                                        </div>
                                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                                                        <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                            Qualifications possibles
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {Array.isArray(course?.detail?.options) && course.detail.options.length > 0 ? (
                                                        course.detail.options.map((op, index) => (
                                                            <tr key={index} className="hover:bg-amber-50/50 transition-colors duration-200">
                                                                <td className="px-6 py-4 text-slate-700 font-medium">
                                                                    {op || 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td className="px-6 py-4 text-slate-500 italic">
                                                                Pas d'opportunités spécifiées
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Courses List */}
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                                                <BookOpen size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">Programme des cours</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {Array.isArray(course?.courses) && course.courses.length > 0 ? (
                                                course.courses.map((c, index) => (
                                                    <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedCourse(expandedCourse === index ? null : index)}
                                                            className="w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-amber-50 hover:to-yellow-50 flex items-center justify-between text-left transition-all duration-200"
                                                        >
                                                            <div className="flex-1">
                                                                <h4 className="text-lg font-bold text-slate-900 mb-1">
                                                                    {c?.name || `Cours ${index + 1}`}
                                                                </h4>
                                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                                    <span className="flex items-center gap-1">
                                                                        <BookOpen size={14} />
                                                                        {c?.lessons || 'N/A'} Leçons
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        {c?.duration || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ChevronDown 
                                                                size={20} 
                                                                className={`text-slate-400 transition-transform duration-200 ${
                                                                    expandedCourse === index ? 'rotate-180' : ''
                                                                }`} 
                                                            />
                                                        </button>
                                                        {expandedCourse === index && (
                                                            <div className="px-6 py-4 border-t border-slate-200 bg-white/50">
                                                                <p className="text-slate-700 leading-relaxed">
                                                                    {c?.description || 'Aucune description disponible pour ce cours.'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                    <BookOpen size={48} className="mx-auto text-slate-400 mb-4" />
                                                    <h4 className="text-lg font-bold text-slate-600 mb-2">Aucun cours disponible</h4>
                                                    <p className="text-slate-500">Le programme des cours sera bientôt disponible.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Similar Courses */}
            <section className="py-20 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                                Programmes similaires
                            </h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                                Découvrez d'autres options qui pourraient vous intéresser
                            </p>
                        </div>

                        {Array.isArray(mayLike) && mayLike.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {mayLike.slice(0, 3).map((l) => (
                                    <div key={l?.id || Math.random()} className="group relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-600"></div>
                                        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-slate-200/50 overflow-hidden group-hover:shadow-2xl group-hover:shadow-slate-300/60 transition-all duration-500 group-hover:-translate-y-2">
                                            
                                            {/* Image */}
                                            <div className="relative overflow-hidden">
                                                <div className="aspect-[4/3] relative">
                                                    <img 
                                                        src={l?.image ? `/storage/${l.image}` : '/assets/img/default-course.png'} 
                                                        alt={l?.name || 'Course'} 
                                                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                                    
                                                    {/* Faculty badge */}
                                                    <div className="absolute left-4 top-4">
                                                        <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-lg">
                                                            <span className="text-sm font-bold text-slate-800">#{l?.faculty?.name || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Rating */}
                                                    <div className="absolute right-4 top-4">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-xl border border-white/20 text-white">
                                                            <Star size={14} className="text-yellow-400" fill="currentColor" />
                                                            <span className="text-sm font-bold">4.5</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-amber-600 transition-colors duration-300 line-clamp-2">
                                                    <Link href={route('courseShow', l?.id)}>
                                                        {l?.name || 'N/A'}
                                                    </Link>
                                                </h3>

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                                                        <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                                                            <Users size={12} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-blue-600">Places</div>
                                                            <div className="text-sm font-black text-slate-900">{l?.detail?.student_number || 0}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                                            <Clock size={12} className="text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-emerald-600">Durée</div>
                                                            <div className="text-sm font-black text-slate-900">{l?.detail?.duration_years ? l.detail.duration_years * 2 : 'N/A'} Sem.</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CTA */}
                                                <Link
                                                    href={route('courseShow', l?.id)}
                                                    className="group/cta w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/40 hover:scale-105"
                                                >
                                                    <span>Découvrir</span>
                                                    <ExternalLink size={16} className="transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <BookOpen size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-700 mb-4">Aucun programme similaire</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Aucune option similaire n'est disponible pour le moment. Consultez notre catalogue complet pour découvrir d'autres programmes.
                                </p>
                                <Link 
                                    href={route('courses')}
                                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/40"
                                >
                                    <BookOpen size={18} />
                                    Voir tous les programmes
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <style>{`
                /* Line clamp utility */
                .line-clamp-2 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }

                /* Smooth transitions */
                * {
                    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Premium hover utilities */
                .hover\\:scale-105:hover { transform: scale(1.05); }
                .hover\\:scale-110:hover { transform: scale(1.1); }

                /* Backdrop blur fallback */
                @supports not (backdrop-filter: blur(12px)) {
                    .backdrop-blur-xl { background-color: rgba(255, 255, 255, 0.95); }
                    .backdrop-blur-lg { background-color: rgba(255, 255, 255, 0.9); }
                }

                /* Custom scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #f59e0b, #eab308);
                    border-radius: 10px;
                }

                /* Animate in elements */
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-in-up {
                    animation: slideInUp 0.6s ease-out;
                }

                /* Enhanced shadows for depth */
                .shadow-premium {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
                }

                /* Gradient text */
                .text-gradient {
                    background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-size: 200% 200%;
                    animation: gradient-shift 3s ease-in-out infinite;
                }

                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                /* Pulse animation for video play button */
                @keyframes pulse-ring {
                    0% {
                        transform: scale(0.33);
                        opacity: 1;
                    }
                    80%, 100% {
                        opacity: 0;
                    }
                }

                .animate-pulse-ring {
                    animation: pulse-ring 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
                }

                /* Custom focus styles */
                .focus-ring:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.5);
                    border-color: #f59e0b;
                }
            `}</style>
        </App>
    );
}