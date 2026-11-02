import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Linkedin, Twitter, Facebook, Plus, Users, GraduationCap, Briefcase, Shield, Building } from 'lucide-react';

const OrgansUSK = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const organsUSK = [
        {
            id: 1,
            name: "Conseil de l'USK",
            role: "Organe de Gouvernance Suprême",
            image: "/assets/img/bg/hero.jpg",
            description: "Instance décisionnelle stratégique qui définit la politique générale de l'université",
            color: "from-amber-500 to-amber-600",
            icon: Shield
        },
        {
            id: 2,
            name: "Rectorat",
            role: "Direction Exécutive",
            image: "/assets/img/bg/hero.jpg",
            description: "Dirigé par le Recteur, il assure la mise en œuvre des décisions du Conseil",
            color: "from-blue-500 to-blue-600",
            icon: Building
        },
        {
            id: 3,
            name: "Conseils de Faculté",
            role: "Gestion Académique",
            image: "/assets/img/bg/hero.jpg",
            description: "Organes consultifs qui assurent la coordination des programmes académiques",
            color: "from-purple-500 to-purple-600",
            icon: GraduationCap
        },
        {
            id: 4,
            name: "Comité de Gestion",
            role: "Supervision Administrative",
            image: "/assets/img/bg/hero.jpg",
            description: "Veille au bon fonctionnement administratif et financier de l'institution",
            color: "from-green-500 to-green-600",
            icon: Briefcase
        },
        {
            id: 5,
            name: "Conseil Scientifique",
            role: "Orientation Académique",
            image: "/assets/img/bg/hero.jpg",
            description: "Oriente la politique de recherche et d'innovation de l'université",
            color: "from-red-500 to-red-600",
            icon: Users
        }
    ];

    const nextSlide = () => {
        if (!isAnimating) {
            setIsAnimating(true);
            setCurrentSlide((prev) => (prev + 1) % organsUSK.length);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const prevSlide = () => {
        if (!isAnimating) {
            setIsAnimating(true);
            setCurrentSlide((prev) => (prev - 1 + organsUSK.length) % organsUSK.length);
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
    }, [currentSlide, isAnimating]);

    return (
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-amber-50 overflow-hidden">
            {/* Pattern de fond subtil */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D6A643' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            {/* Éléments décoratifs flottants */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-2xl mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                        <Building className="w-10 h-10 text-white" />
                    </div>

                    <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">
                        Gouvernance
                    </span>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-amber-800 to-orange-800 bg-clip-text text-transparent mb-6 leading-tight">
                        Organes de l'USK
                    </h2>

                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Découvrez la structure organisationnelle qui garantit l'excellence académique et la bonne gouvernance
                        de l'Université Simon Kimbangu
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
                            {organsUSK.map((organ) => (
                                <div key={organ.id} className="w-full flex-shrink-0 px-4">
                                    <div className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
                                        {/* Image Container */}
                                        <div className="relative h-80 lg:h-96 overflow-hidden">
                                            <img
                                                src={organ.image}
                                                alt={organ.name}
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
                                            <div className="flex items-center mb-4">
                                                <div className={`w-12 h-12 bg-gradient-to-r ${organ.color} rounded-xl flex items-center justify-center mr-4`}>
                                                    <organ.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 transition-all duration-300">
                                                        {organ.name}
                                                    </h3>
                                                    <span className={`inline-block px-3 py-1 bg-gradient-to-r ${organ.color} text-white text-sm font-semibold rounded-full`}>
                                                        {organ.role}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-gray-700 mb-6 leading-relaxed">
                                                {organ.description}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center space-x-8">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-12 h-12 bg-gradient-to-r ${organ.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                        <Users className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900">5-15</div>
                                                        <div className="text-sm text-gray-600">Membres</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-12 h-12 bg-gradient-to-r ${organ.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                        <GraduationCap className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-gray-900">4/an</div>
                                                        <div className="text-sm text-gray-600">Réunions</div>
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
                        {organsUSK.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentSlide
                                        ? 'w-8 bg-gradient-to-r from-amber-500 to-orange-600'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Organes Grid (Mobile & Desktop) */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {organsUSK.slice(0, 4).map((organ, index) => (
                        <div key={index} className="group text-center">
                            <div className="relative mb-6 mx-auto w-32 h-32 lg:w-40 lg:h-40">
                                <div className={`absolute inset-0 bg-gradient-to-r ${organ.color} rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
                                <img
                                    src={organ.image}
                                    alt={organ.name}
                                    className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{organ.name}</h4>
                            <p className="text-sm text-gray-600">{organ.role}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                {/* <div className="mt-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-2xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                        Rejoignez notre structure de gouvernance
                    </h3>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        L'USK recherche continuellement des personnes qualifiées pour renforcer ses organes de gouvernance
                        et contribuer à l'excellence académique
                    </p>
                    <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        Postuler
                    </button>
                </div> */}
            </div>
        </section>
    );
};

export default OrgansUSK;
