import { useState } from 'react';
import { BookOpen, DollarSign, Users, Clock, Award, Headphones, ChevronRight, Sparkles, ArrowRight, MapPin, GraduationCap, Briefcase, Target, Lightbulb } from 'lucide-react';
import { router } from '@inertiajs/react';

const AboutPageSection = () => {
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'mission' | 'faculties' | 'cycles'>('mission');

    const features = [
        {
            id: 1,
            icon: Lightbulb,
            title: "Créativité & Entrepreneuriat",
            description: "Développement de l'esprit d'innovation et de création d'entreprises",
            color: "from-amber-500 to-amber-600"
        },
        {
            id: 2,
            icon: Target,
            title: "Valorisation des Ressources Locales",
            description: "Culture de valorisation des ressources et potentialités congolaises",
            color: "from-blue-500 to-blue-600"
        },
        {
            id: 3,
            icon: BookOpen,
            title: "Environnement Juridique & Fiscal",
            description: "Maîtrise du cadre légal pour la conduite des affaires",
            color: "from-purple-500 to-purple-600"
        },
        {
            id: 4,
            icon: Briefcase,
            title: "Informatique & Communication",
            description: "Compétences en gestion multimédia et technologies de l'information",
            color: "from-green-500 to-green-600"
        },
        {
            id: 5,
            icon: Users,
            title: "Formation Transformante",
            description: "Engagement social de former pour transformer la société",
            color: "from-red-500 to-red-600"
        },
        {
            id: 6,
            icon: Award,
            title: "Excellence & Éthique",
            description: "Adhésion rigoureuse au professionnalisme et à l'éthique",
            color: "from-indigo-500 to-indigo-600"
        }
    ];

    const faculties = [
        "Faculté d'Économie et Gestion des Entreprises",
        "Faculté de Droit et Administration des Affaires",
        "Faculté d'Informatique",
        "Faculté de Santé Publique",
        "Faculté de Médecine",
        "Faculté de Sciences Infirmières"
    ];

    const trainingPrograms = [
        "Gestion des projets (analyse financière, gestion des risques)",
        "Gestion des ressources humaines",
        "Encadrement des petites et moyennes entreprises",
        "Gouvernance publique (entités administratives décentralisées)"
    ];

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image Section */}
                    <div className="relative order-2 lg:order-1">
                        {/* Background décoratif */}
                        <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl opacity-20 blur-xl"></div>
                        
                        {/* Image principale */}
                        <div className="relative">
                            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                                <img 
                                    src="/assets/img/bg/hero.jpg" 
                                    alt="Campus de l'Université Moderne de Kinkole" 
                                    className="w-full h-auto object-cover transform transition-all duration-700 hover:scale-105"
                                />
                                
                                {/* Overlay décoratif */}
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent"></div>
                                
                                {/* Badge décoratif */}
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
                                    <div className="flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm font-semibold text-gray-800">Autorisée par Arrêté N°0102/MINESU/2017</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Éléments décoratifs flottants */}
                        </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="order-1 lg:order-2">
                        {/* Header */}
                        <div className="mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            
                            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full mb-4">
                                À PROPOS
                            </span>
                            
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                L'<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">UNIVERSITÉ MODERNE DE KINKOLE</span>
                            </h2>
                            
                            <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                Établissement privé d'enseignement supérieur et universitaire, autorisé à fonctionner en vertu de l'Arrêté ministériel N° 0102/MINESU/CAB.MIN/SMM/PNM/LMM//2017 du 7 août 2017.
                            </p>
                            
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Née de l'initiative du couple LAMY LAMIEL, son ambition est de permettre à tout apprenant, au bout du programme de formation choisi, de pouvoir voler plus haut de ses propres ailes, comme un aigle.
                            </p>
                        </div>
                        
                        {/* Onglets de navigation */}
                        <div className="flex space-x-1 mb-8 p-1 bg-gray-100 rounded-xl">
                            {[
                                { id: 'mission', label: 'Mission & Valeurs' },
                                { id: 'faculties', label: 'Facultés' },
                                { id: 'cycles', label: 'Cycles & Formations' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-amber-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        
                        {/* Contenu des onglets */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
                            {activeTab === 'mission' && (
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Notre Mission & Nos Valeurs</h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        Outre son engagement social de « former pour transformer », l'UMK adhère rigoureusement au professionnalisme et à l'exercice strict de l'éthique en chacun de ses membres.
                                    </p>
                                    
                                    <p className="text-gray-600 mb-8 leading-relaxed">
                                        Face aux enjeux du développement local et de la modernisation de la société congolaise, l'UMK s'attache à conférer aux apprenants les compétences nécessaires pour réussir.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {features.slice(0, 4).map((feature) => (
                                            <div 
                                                key={feature.id}
                                                className={`group relative p-6 rounded-2xl transition-all duration-500 ${
                                                    hoveredFeature === feature.id 
                                                        ? 'bg-amber-50 shadow-lg transform -translate-y-2' 
                                                        : 'bg-gray-50 shadow-md'
                                                }`}
                                                onMouseEnter={() => setHoveredFeature(feature.id)}
                                                onMouseLeave={() => setHoveredFeature(null)}
                                            >
                                                <div className="relative z-10">
                                                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                                                        <feature.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                                                    <p className="text-sm text-gray-600">{feature.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'faculties' && (
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Nos Facultés</h3>
                                    <p className="text-gray-600 mb-8 leading-relaxed">
                                        En vertu du triptyque « Créer – Entreprendre – Moderniser », sont ouvertes actuellement les filières de formation suivantes :
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {faculties.map((faculty, index) => (
                                            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors duration-300">
                                                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-4">
                                                    <BookOpen className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="text-gray-800 font-medium">{faculty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'cycles' && (
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Cycles d'Enseignement & Formations</h3>
                                    
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                                                    <span className="text-white font-bold">1</span>
                                                </div>
                                                Cycle Long (5 ans)
                                            </h4>
                                            <p className="text-gray-600 pl-11">
                                                Pour l'obtention d'un diplôme universitaire de Master dans les quatre facultés précitées.
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                                                    <span className="text-white font-bold">2</span>
                                                </div>
                                                Cycle Court (18 mois max)
                                            </h4>
                                            <p className="text-gray-600 pl-11 mb-4">
                                                Pour l'obtention d'un diplôme post-universitaire d'« Executive Master in Business Administration » au sein de son École Supérieure de Gestion (ESG).
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                                                    <Briefcase className="w-4 h-4 text-white" />
                                                </div>
                                                Formations Sur Mesure
                                            </h4>
                                            <p className="text-gray-600 pl-11 mb-4">
                                                L'UMK offre également la possibilité d'organiser, par le biais de l'ESG, en partenariat avec des milieux professionnels, des formations sur mesure de très courte durée pour le renforcement des capacités dans les domaines-clé :
                                            </p>
                                            <ul className="space-y-3 pl-11">
                                                {trainingPrograms.map((program, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                                            <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                                                        </div>
                                                        <span className="text-gray-700">{program}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Section Pourquoi Kinkole */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 mb-8">
                            <div className="flex items-start">
                                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Pourquoi à Kinkole?</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Le choix d'implanter cette alma mater à la cité de Kinkole n'est pas un hasard. Il vise à faire de ce milieu périphérique de la capitale, une société du savoir, dans laquelle les connaissances, les compétences, la recherche, l'innovation et d'autres activités scientifiques occupent une place centrale. Le besoin est aussi d'ajouter aux habitants de cette municipalité un autre aspect de la formation universitaire, outre son aspect festif et culinaire.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Call to Action */}
                        <div className="mt-12 p-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-xl">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <div className="mb-6 sm:mb-0">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        Rejoignez l'Université Moderne de Kinkole
                                    </h3>
                                    <p className="text-white/90">
                                        Développez votre potentiel et transformez votre avenir avec nous
                                    </p>
                                </div>
                                <button onClick={() => router.visit('/dashboard/enrollments')} className="px-8 py-3 bg-white text-amber-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center">
                                    Postuler maintenant
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutPageSection;