import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Linkedin, Twitter, Facebook, Plus, BookOpen, Users, GraduationCap } from 'lucide-react';

const Team = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const teamMembers = [
        {
            id: 1,
            name: "James Michael",
            role: "Mathematics Instructor",
            image: "https://picsum.photos/seed/james/400/500.jpg",
            courses: 1,
            students: "60+",
            color: "from-blue-500 to-purple-600"
        },
        {
            id: 2,
            name: "Amanda Nicole",
            role: "English Literature",
            image: "https://picsum.photos/seed/amanda/400/500.jpg",
            courses: 1,
            students: "60+",
            color: "from-purple-500 to-pink-600"
        },
        {
            id: 3,
            name: "David Martinez",
            role: "Biology Professor",
            image: "https://picsum.photos/seed/david/400/500.jpg",
            courses: 1,
            students: "60+",
            color: "from-amber-500 to-orange-600"
        },
        {
            id: 4,
            name: "Sarah Johnson",
            role: "Computer Science",
            image: "https://picsum.photos/seed/sarah/400/500.jpg",
            courses: 1,
            students: "60+",
            color: "from-green-500 to-teal-600"
        },
        {
            id: 5,
            name: "Michael Chen",
            role: "Physics Professor",
            image: "https://picsum.photos/seed/michael/400/500.jpg",
            courses: 1,
            students: "60+",
            color: "from-red-500 to-pink-600"
        }
    ];

    const nextSlide = useCallback(() => {
        if (!isAnimating) {
            setIsAnimating(true);
            setCurrentSlide((prev) => (prev + 1) % teamMembers.length);
            setTimeout(() => setIsAnimating(false), 500);
        }
    }, [isAnimating, teamMembers.length]);

    const prevSlide = () => {
        if (!isAnimating) {
            setIsAnimating(true);
            setCurrentSlide((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const goToSlide = (index: number) => {
        if (!isAnimating && index !== currentSlide) {
            setIsAnimating(true);
            setCurrentSlide(index);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
            {/* Pattern de fond subtil */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            {/* Éléments décoratifs flottants */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-2xl mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full mb-4">
                        Nos enseignants honorables
                    </span>
                    
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6 leading-tight">
                        Nos Instructeurs Experts
                    </h2>
                    
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Découvrez nos professeurs passionnés qui transforment l'éducation en une expérience inspirante
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative max-w-6xl mx-auto">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:scale-110 transition-all duration-300 -translate-x-6 lg:-translate-x-16"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:scale-110 transition-all duration-300 translate-x-6 lg:translate-x-16"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Carousel Track */}
                    <div className="overflow-hidden rounded-3xl">
                        <div 
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {teamMembers.map((member) => (
                                <div key={member.id} className="w-full flex-shrink-0 px-4">
                                    <div className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
                                        {/* Image Container */}
                                        <div className="relative h-80 lg:h-96 overflow-hidden">
                                            <img 
                                                src={member.image} 
                                                alt={member.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            
                                            {/* Overlay with Social Links */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <div className="absolute bottom-6 left-6 right-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex space-x-3">
                                                            <a 
                                                                href="#" 
                                                                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-110"
                                                            >
                                                                <Linkedin className="w-5 h-5" />
                                                            </a>
                                                            <a 
                                                                href="#" 
                                                                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-blue-400 transition-all duration-300 hover:scale-110"
                                                            >
                                                                <Twitter className="w-5 h-5" />
                                                            </a>
                                                            <a 
                                                                href="#" 
                                                                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-blue-700 transition-all duration-300 hover:scale-110"
                                                            >
                                                                <Facebook className="w-5 h-5" />
                                                            </a>
                                                        </div>
                                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-800 transition-all duration-300 hover:scale-110 hover:rotate-45">
                                                            <Plus className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="p-8 lg:p-10">
                                            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                                <a href="#" className="hover:underline">{member.name}</a>
                                            </h3>
                                            <span className={`inline-block px-4 py-2 bg-gradient-to-r ${member.color} text-white text-sm font-semibold rounded-full mb-6`}>
                                                {member.role}
                                            </span>

                                            {/* Stats */}
                                            <div className="flex items-center space-x-8">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-12 h-12 bg-gradient-to-r ${member.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                        <BookOpen className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900">{member.courses}</div>
                                                        <div className="text-sm text-gray-600">Cours</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-12 h-12 bg-gradient-to-r ${member.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                        <Users className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900">{member.students}</div>
                                                        <div className="text-sm text-gray-600">Étudiants</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {teamMembers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentSlide 
                                        ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Additional Team Grid (Mobile & Desktop) */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.slice(0, 4).map((member, index) => (
                        <div key={index} className="group text-center">
                            <div className="relative mb-6 mx-auto w-32 h-32 lg:w-40 lg:h-40">
                                <div className={`absolute inset-0 bg-gradient-to-r ${member.color} rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                                <img 
                                    src={member.image} 
                                    alt={member.name}
                                    className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-2xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                        Rejoignez notre équipe d'experts
                    </h3>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Nous recrutons continuellement des instructeurs passionnés pour rejoindre notre équipe et façonner l'avenir de l'éducation.
                    </p>
                    <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        Devenir Instructeur
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Team;