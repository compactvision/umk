import { router } from '@inertiajs/react';
import { Award, BookOpen, Briefcase, ChevronRight, GraduationCap, Lightbulb, MapPin, Target, Users } from 'lucide-react';
import { useState } from 'react';

const AboutPageSection = () => {
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'mission' | 'faculties' | 'cycles'>('mission');

    const features = [
        {
            id: 1,
            icon: Lightbulb,
            title: 'Créativité & Entrepreneuriat',
            description: "Développement de l'esprit d'innovation et de création d'entreprises",
            color: 'from-amber-500 to-amber-600',
        },
        {
            id: 2,
            icon: Target,
            title: 'Valorisation des Ressources Locales',
            description: 'Culture de valorisation des ressources et potentialités congolaises',
            color: 'from-blue-500 to-blue-600',
        },
        {
            id: 3,
            icon: BookOpen,
            title: 'Environnement Juridique & Fiscal',
            description: 'Maîtrise du cadre légal pour la conduite des affaires',
            color: 'from-purple-500 to-purple-600',
        },
        {
            id: 4,
            icon: Briefcase,
            title: 'Informatique & Communication',
            description: "Compétences en gestion multimédia et technologies de l'information",
            color: 'from-green-500 to-green-600',
        },
        {
            id: 5,
            icon: Users,
            title: 'Formation Transformante',
            description: 'Engagement social de former pour transformer la société',
            color: 'from-red-500 to-red-600',
        },
        {
            id: 6,
            icon: Award,
            title: 'Excellence & Éthique',
            description: "Adhésion rigoureuse au professionnalisme et à l'éthique",
            color: 'from-indigo-500 to-indigo-600',
        },
    ];

    const faculties = [
        "Faculté d'Économie et Gestion des Entreprises",
        'Faculté de Droit et Administration des Affaires',
        "Faculté d'Informatique",
        'Faculté de Santé Publique',
        'Faculté de Médecine',
        'Faculté de Sciences Infirmières',
    ];

    const trainingPrograms = [
        'Gestion des projets (analyse financière, gestion des risques)',
        'Gestion des ressources humaines',
        'Encadrement des petites et moyennes entreprises',
        'Gouvernance publique (entités administratives décentralisées)',
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-amber-50 py-20 lg:py-32">
            {/* Pattern de fond subtil */}
            <div className="absolute inset-0 opacity-30">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D6A643' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                ></div>
            </div>

            {/* Éléments décoratifs flottants */}
            <div className="absolute top-20 left-20 h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/20 blur-3xl"></div>
            <div className="absolute right-20 bottom-20 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl delay-1000"></div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    {/* Image Section */}
                    <div className="relative order-2 lg:order-1">
                        {/* Background décoratif */}
                        <div className="absolute -top-6 -right-6 h-full w-full rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 opacity-20 blur-xl"></div>

                        {/* Image principale */}
                        <div className="relative">
                            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                                <img
                                    src="/assets/img/bg/hero.jpg"
                                    alt="Campus de l'Université Simon Kimbangu"
                                    className="h-auto w-full transform object-cover transition-all duration-700 hover:scale-105"
                                />

                                {/* Overlay décoratif */}
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent"></div>

                                {/* Badge décoratif */}
                                <div className="absolute top-6 right-6 rounded-2xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                                    <div className="flex items-center space-x-2">
                                        <Award className="h-5 w-5 text-amber-600" />
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
                            <div className="mb-6 inline-flex h-16 w-16 -rotate-3 transform items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg transition-transform duration-500 hover:rotate-0">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>

                            <span className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                                À PROPOS
                            </span>

                            <h2 className="mb-6 text-3xl leading-tight font-bold text-gray-900 md:text-4xl lg:text-5xl">
                                L'
                                <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                    UNIVERSITÉ SIMON KIMBANGU
                                </span>
                            </h2>

                            <p className="mb-6 text-lg leading-relaxed text-gray-600">
                                Établissement privé d'enseignement supérieur et universitaire, autorisé à fonctionner en vertu de l'Arrêté ministériel
                                N° 0102/MINESU/CAB.MIN/SMM/PNM/LMM//2017 du 7 août 2017.
                            </p>

                            <p className="text-lg leading-relaxed text-gray-600">
                                Née de l'initiative du couple LAMY LAMIEL, son ambition est de permettre à tout apprenant, au bout du programme de
                                formation choisi, de pouvoir voler plus haut de ses propres ailes, comme un aigle.
                            </p>
                        </div>

                        {/* Onglets de navigation */}
                        <div className="mb-8 flex space-x-1 rounded-xl bg-gray-100 p-1">
                            {([
                                { id: 'mission', label: 'Mission & Valeurs' },
                                { id: 'faculties', label: 'Facultés' },
                                { id: 'cycles', label: 'Cycles & Formations' },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 rounded-lg px-4 py-3 font-medium transition-all duration-300 ${
                                        activeTab === tab.id ? 'bg-white text-amber-600 shadow-md' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Contenu des onglets */}
                        <div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
                            {activeTab === 'mission' && (
                                <div>
                                    <h3 className="mb-6 text-2xl font-bold text-gray-900">Notre Mission & Nos Valeurs</h3>
                                    <p className="mb-6 leading-relaxed text-gray-600">
                                        Outre son engagement social de « former pour transformer », l'USK adhère rigoureusement au professionnalisme
                                        et à l'exercice strict de l'éthique en chacun de ses membres.
                                    </p>

                                    <p className="mb-8 leading-relaxed text-gray-600">
                                        Face aux enjeux du développement local et de la modernisation de la société congolaise, l'USK s'attache à
                                        conférer aux apprenants les compétences nécessaires pour réussir.
                                    </p>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {features.slice(0, 4).map((feature) => (
                                            <div
                                                key={feature.id}
                                                className={`group relative rounded-2xl p-6 transition-all duration-500 ${
                                                    hoveredFeature === feature.id
                                                        ? '-translate-y-2 transform bg-amber-50 shadow-lg'
                                                        : 'bg-gray-50 shadow-md'
                                                }`}
                                                onMouseEnter={() => setHoveredFeature(feature.id)}
                                                onMouseLeave={() => setHoveredFeature(null)}
                                            >
                                                <div className="relative z-10">
                                                    <div
                                                        className={`h-12 w-12 bg-gradient-to-r ${feature.color} mb-4 flex items-center justify-center rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                                                    >
                                                        <feature.icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <h4 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h4>
                                                    <p className="text-sm text-gray-600">{feature.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'faculties' && (
                                <div>
                                    <h3 className="mb-6 text-2xl font-bold text-gray-900">Nos Facultés</h3>
                                    <p className="mb-8 leading-relaxed text-gray-600">
                                        En vertu du triptyque « Créer – Entreprendre – Moderniser », sont ouvertes actuellement les filières de
                                        formation suivantes :
                                    </p>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {faculties.map((faculty, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center rounded-xl bg-gray-50 p-4 transition-colors duration-300 hover:bg-amber-50"
                                            >
                                                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
                                                    <BookOpen className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="font-medium text-gray-800">{faculty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'cycles' && (
                                <div>
                                    <h3 className="mb-6 text-2xl font-bold text-gray-900">Cycles d'Enseignement & Formations</h3>

                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
                                                    <span className="font-bold text-white">1</span>
                                                </div>
                                                Cycle Long (5 ans)
                                            </h4>
                                            <p className="pl-11 text-gray-600">
                                                Pour l'obtention d'un diplôme universitaire de Master dans les quatre facultés précitées.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
                                                    <span className="font-bold text-white">2</span>
                                                </div>
                                                Cycle Court (18 mois max)
                                            </h4>
                                            <p className="mb-4 pl-11 text-gray-600">
                                                Pour l'obtention d'un diplôme post-universitaire d'« Executive Master in Business Administration » au
                                                sein de son École Supérieure de Gestion (ESG).
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
                                                    <Briefcase className="h-4 w-4 text-white" />
                                                </div>
                                                Formations Sur Mesure
                                            </h4>
                                            <p className="mb-4 pl-11 text-gray-600">
                                                L'USK offre également la possibilité d'organiser, par le biais de l'ESG, en partenariat avec des
                                                milieux professionnels, des formations sur mesure de très courte durée pour le renforcement des
                                                capacités dans les domaines-clé :
                                            </p>
                                            <ul className="space-y-3 pl-11">
                                                {trainingPrograms.map((program, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <div className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                                                            <div className="h-2 w-2 rounded-full bg-amber-600"></div>
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

                        {/* Section Pourquoi Kinshasa */}
                        <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-8">
                            <div className="flex items-start">
                                <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-600">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="mb-4 text-2xl font-bold text-gray-900">Pourquoi à Kinshasa?</h3>
                                    <p className="leading-relaxed text-gray-600">
                                        Le choix d'implanter cette alma mater à la cité de Kinshasa n'est pas un hasard. Il vise à faire de ce milieu
                                        périphérique de la capitale, une société du savoir, dans laquelle les connaissances, les compétences, la
                                        recherche, l'innovation et d'autres activités scientifiques occupent une place centrale. Le besoin est aussi
                                        d'ajouter aux habitants de cette municipalité un autre aspect de la formation universitaire, outre son aspect
                                        festif et culinaire.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 shadow-xl">
                            <div className="flex flex-col items-center justify-between sm:flex-row">
                                <div className="mb-6 sm:mb-0">
                                    <h3 className="mb-2 text-2xl font-bold text-white">Rejoignez l'Université Simon Kimbangu</h3>
                                    <p className="text-white/90">Développez votre potentiel et transformez votre avenir avec nous</p>
                                </div>
                                <button
                                    onClick={() => router.visit('/dashboard/enrollments')}
                                    className="flex transform items-center rounded-2xl bg-white px-8 py-3 font-semibold text-amber-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                >
                                    Postuler maintenant
                                    <ChevronRight className="ml-2 h-5 w-5" />
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
