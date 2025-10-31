import CreateAcademicYearPopup from '@/components/form/CreateAcademicYearPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Alert from '@/utils/sweetAlert';

type AcademicYear = {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'open' | 'closed';
    students_count?: number;
    created_at?: string;
};

export default function AcademicYearManager({ academicYears }: { academicYears: AcademicYear[] }) {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return '✓';
            case 'closed':
                return '✕';
            case 'draft':
                return '⏱';
            default:
                return '';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'open':
                return 'Ouverte';
            case 'closed':
                return 'Clôturée';
            case 'draft':
                return 'Brouillon';
            default:
                return status;
        }
    };

    const years = Array.isArray(academicYears.data) ? academicYears.data : [];

    const filteredYears = years.filter(year => {
        const matchesSearch = year.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || year.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const openEditModal = (year: AcademicYear) => {
        setShowModal(true);
        setAcademicYear(year);
    };

    const handleRedirect = (year: AcademicYear) => {
        router.visit(route('dashboard.admin.academic-years.show', year.id));
    };

    const handleToggleStatus = async (academicYear: AcademicYear) => {
        if (academicYear.status === 'draft' || academicYear.status === 'closed') {
            router.patch(
                route('dashboard.admin.academic-years.open', academicYear.id),
                {},
                {
                    onSuccess: () => {
                        Alert.success('Année académique ouverte avec succès.');
                    },
                    onError: (errors) => {
                        Alert.error('Impossible d\'ouvrir l\'année académique. Une année est déjà ouverte.');
                    },
                }
            );
        } else {
            const result = await Alert.confirm("Êtes-vous sûr de vouloir clôturer cette année ?");
            if (result.isConfirmed) {
                router.patch(
                    route('dashboard.admin.academic-years.close', academicYear.id),
                    {},
                    {
                        onSuccess: () => {
                            Alert.success('Année académique clôturée avec succès.');
                        },
                        onError: (errors) => {
                            Alert.error('Impossible de clôturer l\'année académique.');
                        },
                    }
                );
            }
        }
    };

    return (
        <Dashboard>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans p-0 m-0">
                <div className="max-w-7xl mx-auto p-8">
                    {/* Header Premium */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                    <span className="text-2xl drop-shadow-md">📅</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-800 mb-2 drop-shadow-md">Années Académiques</h1>
                                    <p className="text-gray-600 text-lg drop-shadow-sm">Gérez vos périodes académiques avec élégance et précision</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowModal(true)} 
                                className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg cursor-pointer flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/40 border border-white/20"
                            >
                                <span className="text-xl transition-transform duration-300 group-hover:rotate-90">+</span>
                                <span className="hidden sm:inline">Nouvelle Année</span>
                                <span className="sm:hidden">Ajouter</span>
                            </button>
                        </div>

                        {/* Filtres et Recherche */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="relative flex-1 min-w-[250px]">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher une année..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-4 pl-12 bg-white/80 backdrop-blur-lg border border-white/30 rounded-2xl text-gray-800 text-base transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:bg-blue-50 focus:shadow-lg"
                                />
                            </div>
                            <div className="relative min-w-[200px]">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">🔽</span>
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)} 
                                    className="w-full px-4 py-4 pr-12 bg-white/80 backdrop-blur-lg border border-white/30 rounded-2xl text-gray-800 text-base cursor-pointer appearance-none transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:bg-blue-50 focus:shadow-lg"
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="open">Ouvertes</option>
                                    <option value="draft">Brouillons</option>
                                    <option value="closed">Clôturées</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tableau Premium */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100/50">
                                        <th className="px-6 py-6 text-left font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-white/20">Année Académique</th>
                                        <th className="px-6 py-6 text-left font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-white/20">Période</th>
                                        <th className="px-6 py-6 text-left font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-white/20">Statut</th>
                                        <th className="px-6 py-6 text-left font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-white/20">Étudiants</th>
                                        <th className="px-6 py-6 text-left font-semibold text-gray-800 text-sm uppercase tracking-wider border-b border-white/20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredYears.map((year, index) => (
                                        <tr key={year.id} className="hover:bg-blue-50/50 transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                                            <td className="px-6 py-6 border-b border-gray-100/50">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-lg font-semibold text-gray-800">{year.title}</div>
                                                    <div className="text-sm text-gray-500">Créée le {formatDate(year.created_at || '')}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 border-b border-gray-100/50">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-medium text-gray-700">Du {formatDate(year.start_date)}</div>
                                                    <div className="text-sm font-medium text-gray-700">Au {formatDate(year.end_date)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 border-b border-gray-100/50">
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold capitalize
                                                    ${year.status === 'open' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                                                    ${year.status === 'draft' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                                                    ${year.status === 'closed' ? 'bg-gray-100 text-gray-700 border border-gray-300' : ''}
                                                `}>
                                                    <span>{getStatusIcon(year.status)}</span>
                                                    {getStatusText(year.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 border-b border-gray-100/50">
                                                <div className="text-lg font-semibold text-gray-800">{year.students_count || 0}</div>
                                            </td>
                                            <td className="px-6 py-6 border-b border-gray-100/50">
                                                <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                                    {year.status === 'draft' && (
                                                        <button 
                                                            onClick={() => handleToggleStatus(year)} 
                                                            className="w-10 h-10 bg-green-100 text-green-700 border border-green-300 rounded-lg flex items-center justify-center hover:bg-green-200 hover:-translate-y-1 transition-all duration-300" 
                                                            title="Ouvrir"
                                                        >
                                                            <span>✓</span>
                                                        </button>
                                                    )}
                                                    {year.status === 'open' && (
                                                        <button 
                                                            onClick={() => handleToggleStatus(year)} 
                                                            className="w-10 h-10 bg-red-100 text-red-700 border border-red-300 rounded-lg flex items-center justify-center hover:bg-red-200 hover:-translate-y-1 transition-all duration-300" 
                                                            title="Clôturer"
                                                        >
                                                            <span>✕</span>
                                                        </button>
                                                    )}
                                                    {year.status !== 'closed' && (
                                                        <button 
                                                            onClick={() => openEditModal(year)} 
                                                            className="w-10 h-10 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg flex items-center justify-center hover:bg-blue-200 hover:-translate-y-1 transition-all duration-300" 
                                                            title="Modifier"
                                                        >
                                                            <span>✏️</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleRedirect(year)} 
                                                        className="w-10 h-10 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300" 
                                                        title="Voir"
                                                    >
                                                        <span>👁</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Premium */}
                {showModal && <CreateAcademicYearPopup closeModal={closeModal} academicYear={academicYear} />}
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
                
                .table-row {
                    animation: fadeInUp 0.6s ease forwards;
                    opacity: 0;
                }
                
                @keyframes backgroundMove {
                    0%, 100% {
                        transform: translateX(0) translateY(0) scale(1);
                    }
                    33% {
                        transform: translateX(-20px) translateY(-10px) scale(1.1);
                    }
                    66% {
                        transform: translateX(20px) translateY(10px) scale(0.9);
                    }
                }
            `}</style>
        </Dashboard>
    );
}