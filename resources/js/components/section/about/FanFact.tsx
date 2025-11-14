export default function FanFact() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 py-24 lg:py-32">
            {/* Pattern de fond subtil */}
            <div className="absolute inset-0 opacity-30">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                ></div>
            </div>

            {/* Éléments décoratifs flottants */}
            <div className="absolute top-20 left-20 h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl"></div>
            <div className="absolute right-20 bottom-20 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-amber-400/20 to-pink-400/20 blur-3xl delay-1000"></div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-20 text-center">
                    <div className="mb-8 inline-flex h-20 w-20 rotate-3 transform items-center justify-center rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl transition-transform duration-500 hover:rotate-6">
                        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            ></path>
                        </svg>
                    </div>

                    <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">Explorez-nous</span>

                    <h2 className="mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl">
                        Edubost en Chiffres
                    </h2>

                    <p className="mx-auto max-w-3xl text-xl leading-relaxed font-light text-gray-600 md:text-2xl">
                        Découvrez les statistiques qui témoignent de notre excellence et de notre engagement envers l'éducation de qualité
                    </p>
                </div>

                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
                    {/* Carte 1 */}
                    <div className="group relative">
                        {/* Background décoratif */}
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20"></div>

                        <div className="hover:shadow-3xl relative transform rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 lg:p-10">
                            {/* Statistique principale */}
                            <div className="mb-8 text-center">
                                <div className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
                                    15+
                                </div>
                                <p className="text-lg font-medium text-gray-700">
                                    Taille moyenne <br className="hidden sm:block" /> des classes
                                </p>
                            </div>

                            {/* Image et statistique secondaire */}
                            <div className="flex items-center space-x-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-6">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-400 to-purple-600 shadow-lg">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </div>
                                <div>
                                    <div className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">91%</div>
                                    <p className="text-base text-gray-600">Des étudiants de première année reçoivent une aide financière</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carte 2 */}
                    <div className="group relative">
                        {/* Background décoratif */}
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20"></div>

                        <div className="hover:shadow-3xl relative transform rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 lg:p-10">
                            {/* Image et statistique principale */}
                            <div className="mb-8 flex items-center space-x-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-400 to-pink-600 shadow-lg">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        ></path>
                                    </svg>
                                </div>
                                <div>
                                    <div className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">91%</div>
                                    <p className="text-base text-gray-600">Des étudiants de première année reviennent pour leur deuxième année</p>
                                </div>
                            </div>

                            {/* Statistique secondaire */}
                            <div className="text-center">
                                <div className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
                                    18,000+
                                </div>
                                <p className="text-lg font-medium text-gray-700">Opportunités de stage disponibles pour les étudiants</p>
                            </div>
                        </div>
                    </div>

                    {/* Carte 3 */}
                    <div className="group relative">
                        {/* Background décoratif */}
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20"></div>

                        <div className="hover:shadow-3xl relative transform rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 lg:p-10">
                            {/* Statistique principale */}
                            <div className="mb-8 text-center">
                                <div className="mb-4 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
                                    $18k - $35k
                                </div>
                                <p className="text-lg font-medium text-gray-700">Exploration de la gamme des bourses au mérite</p>
                            </div>

                            {/* Image et statistique secondaire */}
                            <div className="flex items-center space-x-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-600 shadow-lg">
                                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </div>
                                <div>
                                    <div className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">60%</div>
                                    <p className="text-base text-gray-600">Opportunités d'études à l'étranger pour les étudiants</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section statistiques supplémentaires */}
                <div className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
                    {[
                        { number: '500+', label: 'Professeurs Experts', color: 'from-blue-500 to-blue-600' },
                        { number: '50+', label: "Programmes d'Étude", color: 'from-purple-500 to-purple-600' },
                        { number: '100+', label: 'Laboratoires Modernes', color: 'from-amber-500 to-amber-600' },
                        { number: '25+', label: 'Pays Partenaires', color: 'from-pink-500 to-pink-600' },
                    ].map((stat, index) => (
                        <div key={index} className="group text-center">
                            <div className="relative inline-block">
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl opacity-20 blur-lg transition-opacity group-hover:opacity-40`}
                                ></div>
                                <div className="relative rounded-2xl bg-white p-6 shadow-lg transition-shadow group-hover:shadow-xl">
                                    <div className={`bg-gradient-to-r text-3xl font-bold ${stat.color} mb-2 bg-clip-text text-transparent`}>
                                        {stat.number}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
