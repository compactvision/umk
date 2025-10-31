import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePage, router } from '@inertiajs/react';
import LevelPopup from '@/components/form/LevelPopup';
import BackButton from '@/components/UI/dashboard/BackButton';

export default function FacultyShow() {
    const { faculties, levelCodes } = usePage().props;
    const allFaculties = useMemo(() => faculties?.data || [], [faculties]);
    
    const [selectedFaculties, setSelectedFaculties] = useState(['all']);
    const [filteredFaculties, setFilteredFaculties] = useState(allFaculties);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    
    const openPopup = () => setIsOpen(true);
    const closePopup = () => setIsOpen(false);

    useEffect(() => {
        if (selectedFaculties.includes('all')) {
            setFilteredFaculties(allFaculties);
        } else {
            const filtered = allFaculties.filter(fac => selectedFaculties.includes(String(fac.id)));
            setFilteredFaculties(filtered);
        }
    }, [selectedFaculties, allFaculties]);

    const toggleFaculty = (id: string) => {
        if (id === 'all') {
            setSelectedFaculties(['all']);
        } else {
            let updated = [...selectedFaculties];
            if (updated.includes('all')) {
                updated = [];
            }

            if (updated.includes(id)) {
                updated = updated.filter(f => f !== id);
            } else {
                updated.push(id);
            }

            setSelectedFaculties(updated.length === 0 ? ['all'] : updated);
        }
    };

    const filteredBySearch = useMemo(() => {
        if (!searchTerm) return filteredFaculties;
        return filteredFaculties.filter(faculty => 
            faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (faculty.levels || []).some(level => 
                level.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [filteredFaculties, searchTerm]);

    return (
        <Dashboard>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                {/* Header - Responsive */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <BackButton label='Retour' className="bg-white/90 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 mb-2 sm:mb-0" />
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full sm:w-64 lg:w-80 pl-10 pr-4 py-2 bg-white/90 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    />
                                    <svg className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                
                                <button 
                                    onClick={openPopup}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Nouveau</span>
                                </button>

                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                    className="lg:hidden bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    <span>Filtres</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Main Content */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        {filteredBySearch.length === 0 ? (
                            <div className="text-center py-12 sm:py-20">
                                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                                    {searchTerm ? 'Aucun résultat trouvé' : 'Pas de faculté disponible'}
                                </h2>
                                <p className="text-gray-500 text-sm sm:text-base px-4">
                                    {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter une faculté'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                                {filteredBySearch.map((faculty, facultyIndex) => (
                                    <section key={faculty.id} className="animate-fadeInUp" style={{ animationDelay: `${facultyIndex * 100}ms` }}>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 overflow-hidden">
                                            {/* Faculty Header - Responsive */}
                                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full -mr-16 -mt-16 sm:-mr-32 sm:-mt-32"></div>
                                                <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -ml-12 -mb-12 sm:-ml-16 sm:-mb-16"></div>
                                                
                                                <div className="relative z-10">
                                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
                                                        <span className="w-1 h-6 sm:h-8 bg-white rounded-full mr-3 sm:mr-4"></span>
                                                        {faculty.name}
                                                    </h2>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm sm:text-base">
                                                        <span className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {faculty.duration_years} ans
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                            {faculty.levels?.length || 0} niveau{faculty.levels?.length > 1 ? 'x' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Levels Grid - Responsive */}
                                            <div className="p-4 sm:p-6">
                                                {Array.isArray(faculty.levels) && faculty.levels.length === 0 ? (
                                                    <div className="text-center py-8 sm:py-12">
                                                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-500 text-base sm:text-lg">Pas de niveau pour cette faculté</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                                        {(faculty.levels || []).map((level, levelIndex) => (
                                                            <div 
                                                                key={level.id} 
                                                                className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-105 animate-fadeInUp"
                                                                style={{ animationDelay: `${facultyIndex * 100 + levelIndex * 50}ms` }}
                                                                onClick={() => router.visit(route('dashboard.admin.levels.details.show', level))}
                                                            >
                                                                {/* Image Container - Responsive */}
                                                                <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
                                                                    <img 
                                                                        src={`/storage/${level.image}`} 
                                                                        alt={level.code} 
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                    />
                                                                    
                                                                    {/* Gradient Overlay */}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                                        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                                                                            <div className="bg-white/95 backdrop-blur-sm text-gray-900 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-center font-semibold shadow-lg transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                                                <span className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                    </svg>
                                                                                    Voir
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Floating Badge */}
                                                                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                                                                        <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
                                                                            {level.code}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Content - Responsive */}
                                                                <div className="p-3 sm:p-5">
                                                                    <h3 className="font-bold text-gray-800 text-sm sm:text-base lg:text-lg mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                                                                        {level.title}
                                                                    </h3>
                                                                    
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                            </svg>
                                                                            <span className="hidden xs:inline">{level.student_number || 0} étudiants</span>
                                                                            <span className="xs:hidden">{level.student_number || 0}</span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-1 text-blue-500 group-hover:text-blue-600 transition-all duration-300">
                                                                            <span className="hidden sm:inline text-xs font-medium">Explorer</span>
                                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Decorative Element */}
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Sidebar - Responsive */}
                    <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white/90 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-6 lg:p-6 overflow-y-auto`}>
                        <div className="space-y-6 sm:space-y-8">
                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Actions rapides
                                </h3>
                                <button 
                                    onClick={openPopup}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Créer un niveau</span>
                                </button>
                            </div>

                            {/* Filters */}
                            <div>
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Filtrer
                                    </h3>
                                    <button
                                        onClick={() => setMobileFiltersOpen(false)}
                                        className="lg:hidden text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="flex items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-200 group">
                                        <input
                                            type="checkbox"
                                            checked={selectedFaculties.includes('all')}
                                            onChange={() => toggleFaculty('all')}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2"
                                        />
                                        <span className="ml-3 font-medium text-gray-700 group-hover:text-blue-600 text-sm sm:text-base">Toutes les facultés</span>
                                    </label>

                                    {allFaculties.map((faculty) => (
                                        <label 
                                            key={faculty.id} 
                                            className="flex items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFaculties.includes(String(faculty.id))}
                                                onChange={() => toggleFaculty(String(faculty.id))}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2"
                                            />
                                            <span className="ml-3 text-gray-700 group-hover:text-blue-600 text-sm sm:text-base truncate flex-1">{faculty.name}</span>
                                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                {faculty.levels?.length || 0}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Enhanced Stats */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100">
                                <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Statistiques
                                </h4>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl">
                                        <span className="text-xs sm:text-sm text-gray-600">Facultés</span>
                                        <span className="text-lg sm:text-xl font-bold text-purple-600">{allFaculties.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl">
                                        <span className="text-xs sm:text-sm text-gray-600">Niveaux totaux</span>
                                        <span className="text-lg sm:text-xl font-bold text-purple-600">
                                            {allFaculties.reduce((acc, fac) => acc + (fac.levels?.length || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl">
                                        <span className="text-xs sm:text-sm text-gray-600">Filtrés</span>
                                        <span className="text-lg sm:text-xl font-bold text-purple-600">
                                            {filteredBySearch.reduce((acc, fac) => acc + (fac.levels?.length || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Modal - Responsive */}
                {isOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl sm:max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                            <LevelPopup onClose={closePopup} faculties={faculties} levelCodes={levelCodes?.data}/>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                @media (max-width: 640px) {
                    .xs\\:inline {
                        display: none;
                    }
                }
                @media (min-width: 640px) {
                    .xs\\:inline {
                        display: inline;
                    }
                }
            `}</style>
        </Dashboard>
    );
}