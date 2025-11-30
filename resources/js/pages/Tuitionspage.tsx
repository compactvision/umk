import React, { useState } from 'react';
import { ArrowRight, Monitor, Briefcase, Cog, Palette, Vote, Trees, ChevronDown, GraduationCap, Sparkles } from 'lucide-react';
import App from '@/components/layouts/Home/App';
import Breadcrumb from '@/components/UI/home/Breadcumb';
import { Link } from '@inertiajs/react';

// --- Données des programmes (inchangées) ---
const programData = [
    {
        id: 1,
        title: 'Informatique',
        icon: Monitor,
        fees: {
            domestic: [
                { expense: 'Frais de scolarité', semester: '3 586 $', annual: '12 286 $' },
                { expense: 'Frais connexes', semester: '5 586 $', annual: '18 286 $' },
            ],
            international: [
                { expense: 'Frais de scolarité', semester: '7 258 $', annual: '18 286 $' },
                { expense: 'Frais connexes', semester: '1 523 $', annual: '14 065 $' },
                { expense: 'Assurance', semester: '2 652 $', annual: '14 525 $' },
                { expense: 'Frais d\'inscription', semester: '3 586 $', annual: '12 286 $' },
            ],
        },
    },
    {
        id: 2,
        title: 'Administration des Affaires',
        icon: Briefcase,
        fees: {
            domestic: [
                { expense: 'Frais de scolarité', semester: '3 586 $', annual: '12 286 $' },
                { expense: 'Frais connexes', semester: '5 586 $', annual: '18 286 $' },
            ],
            international: [
                { expense: 'Frais de scolarité', semester: '7 258 $', annual: '18 286 $' },
                { expense: 'Frais connexes', semester: '1 523 $', annual: '14 065 $' },
                { expense: 'Assurance', semester: '2 652 $', annual: '14 525 $' },
                { expense: 'Frais d\'inscription', semester: '3 586 $', annual: '12 286 $' },
            ],
        },
    },
    {
        id: 5,
        title: 'Sciences Politiques',
        icon: Vote,
        fees: {
            domestic: [
                { expense: 'Frais de scolarité', semester: '3 586 $', annual: '12 286 $' },
                { expense: 'Frais connexes', semester: '5 586 $', annual: '18 286 $' },
            ],
            international: [
                { expense: 'Frais de scolarité', semester: '7 258 $', annual: '18 286 $' },
                { expense: 'Frais connexes', semester: '1 523 $', annual: '14 065 $' },
                { expense: 'Assurance', semester: '2 652 $', annual: '14 525 $' },
                { expense: 'Frais d\'inscription', semester: '3 586 $', annual: '12 286 $' },
            ],
        },
    },
];

// --- Composant React ---

const Tuitionspage = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    const handleToggle = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <App>
            <Breadcrumb title="Frais de académiques" desc='Tout savoir sur les frais de scolarité'/>
            
            {/* Section 1: Introduction - Refaite avec la charte graphique */}
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
                        {/* Colonne de gauche: Contenu textuel */}
                        <div className="lg:pr-8">
                            <div className="space-y-6">
                                <span className="inline-block px-4 py-1 text-sm font-semibold text-amber-700 bg-amber-100 rounded-full uppercase tracking-wider">
                                    Frais de scolarité
                                </span>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                                    Tout savoir sur les frais de scolarité.
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                                        Une vue d'ensemble complète.
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                                    Explorez en détail les aspects financiers de votre formation. Nous sommes transparents sur les coûts pour vous aider à planifier votre avenir académique en toute sérénité.
                                </p>
                            </div>
                            <div className="mt-10">
                                <a href="#fees-section" className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-full shadow-2xl transition-all duration-300 ease-in-out hover:shadow-3xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-amber-300">
                                    Voir les détails
                                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                </a>
                            </div>
                        </div>

                        {/* Colonne de droite: Image */}
                        <div className="relative mt-12 lg:mt-0">
                            <div className="relative z-10">
                                <img className="w-full h-auto rounded-3xl shadow-2xl object-cover transform transition-all duration-500 hover:scale-105" src="/assets/img/hero/hero3.png" alt="Étudiant diplômé célébrant son succès" />
                                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl opacity-20 blur-xl -z-10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Accordéon des frais - Refait avec la charte graphique */}
            <section id="fees-section" className="py-20 lg:py-32 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 text-sm font-semibold text-amber-700 bg-amber-100 rounded-full uppercase tracking-wider">
                            Nos offres académiques
                        </span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-4">
                            Frais de Scolarité
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {programData.map((program, index) => {
                            const Icon = program.icon;
                            const isActive = activeIndex === index;

                            return (
                                <div key={program.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                    {/* Bouton de l'accordéon */}
                                    <button
                                        type="button"
                                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 transition-colors duration-200"
                                        onClick={() => handleToggle(index)}
                                        aria-expanded={isActive}
                                        aria-controls={`accordion-content-${program.id}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white shadow-md">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900">{program.title}</span>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Contenu de l'accordéon */}
                                    <div
                                        id={`accordion-content-${program.id}`}
                                        className={`transition-all duration-500 ease-in-out ${isActive ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
                                    >
                                        <div className="p-6 space-y-8 border-t border-gray-100">
                                            {/* Tableau des frais nationaux */}
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-4">Frais Nationaux</h3>
                                                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                    <table className="min-w-full">
                                                        <thead className="bg-amber-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dépense</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semestre</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Annuel</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {program.fees.domestic.map((fee, i) => (
                                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.expense}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fee.semester}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fee.annual}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Tableau des frais internationaux */}
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-4">Frais Internationaux</h3>
                                                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                    <table className="min-w-full">
                                                        <thead className="bg-amber-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dépense</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semestre</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Annuel</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {program.fees.international.map((fee, i) => (
                                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.expense}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fee.semester}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fee.annual}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Section 3: Call to Action finale - Ajoutée pour la cohérence */}
            <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-amber-50">
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-2xl p-8 lg:p-12 text-center">
                        <GraduationCap className="w-16 h-16 text-white/80 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Prêt à commencer votre voyage ?
                        </h2>
                        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                            Rejoignez-nous et façonnez votre avenir. Nos équipes sont là pour vous accompagner à chaque étape de votre inscription.
                        </p>
                        <Link href="/dashboard/enrollments" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-600 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                            Postuler maintenant
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </App>
    );
};

export default Tuitionspage;