export default function Mission() {
    return (
        <section className="py-20 lg:py-32 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-lg mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Notre Mission & Notre Vision
                    </h2>
                    
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        L'UNIVERSITÉ MODERNE DE KINKOLE (UMK) s'engage à former des professionnels compétents 
                        capables de transformer la société congolaise à travers l'excellence académique et l'innovation.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Carte Mission */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Notre Mission</h3>
                        </div>
                        
                        <p className="text-gray-700 mb-8 leading-relaxed">
                            Permettre à tout apprenant, au bout du programme de formation choisi, de pouvoir voler plus haut 
                            de ses propres ailes, comme un aigle, et d'entraîner avec lui d'autres personnes dans son envol.
                        </p>
                        
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900">Nos engagements :</h4>
                            <ul className="space-y-3">
                                {[
                                    "Former pour transformer la société",
                                    "Adhérer rigoureusement au professionnalisme",
                                    "Exercer strictement l'éthique en chacun de nos membres",
                                    "Développer l'esprit de créativité et d'entrepreneuriat",
                                    "Valoriser les ressources locales"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    {/* Carte Vision */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Notre Vision</h3>
                        </div>
                        
                        <p className="text-gray-700 mb-8 leading-relaxed">
                            Faire de Kinkole une société du savoir, dans laquelle les connaissances, les compétences, 
                            la recherche, l'innovation et d'autres activités scientifiques occupent une place centrale.
                        </p>
                        
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900">Nos ambitions :</h4>
                            <ul className="space-y-3">
                                {[
                                    "Moderniser la société congolaise par l'éducation",
                                    "Créer des opportunités pour les habitants de Kinkole",
                                    "Développer des compétences en gestion et communication",
                                    "Maîtriser l'environnement juridique et fiscal",
                                    "Promouvoir l'excellence académique"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <svg className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}