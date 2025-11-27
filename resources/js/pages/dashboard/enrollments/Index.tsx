import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, FileCheck2, Filter, MapPin, Search, Users, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

// Helpers sûrs
const lower = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : String(v ?? '').toLowerCase());
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');

type LevelLite = { id: number; title?: string | null; title_ar?: string | null; code?: string | null };
type Doc = { id: number; type: string; verified: boolean };

type EnrollmentItem = {
    id: number;
    uuid?: string | null;
    matricule?: string | null;
    status: 'draft' | 'submitted' | 'in_review' | 'pending_documents' | 'validated' | 'rejected' | 'archived' | string;
    payment_status?: 'unpaid' | 'partial' | 'paid' | string | null;
    created_at?: string | null;
    enrolled_at?: string | null;
    notes?: string | null;
    level?: LevelLite | null;
    documents?: Doc[] | null;
};

export default function Index() {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { enrollments } = usePage<{ enrollments?: { data?: EnrollmentItem[] } }>().props;
    
    const items: EnrollmentItem[] = useMemo(() => {
        return Array.isArray(enrollments?.data) ? enrollments!.data! : [];
    }, [enrollments]);

    // Mapping vers TES classes existentes
    const getStatusConfig = (status: EnrollmentItem['status']) => {
        const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
            draft: {
                label: 'Brouillon',
                className: 'bg-blue-100 text-blue-600',
                icon: <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            submitted: { 
                label: 'Soumise', 
                className: 'bg-cyan-100 text-cyan-600', 
                icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> 
            },
            in_review: {
                label: 'En vérification',
                className: 'bg-cyan-100 text-cyan-600',
                icon: <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            pending_documents: {
                label: 'Compléments requis',
                className: 'bg-amber-100 text-amber-600',
                icon: <Users className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            validated: {
                label: 'Validée',
                className: 'bg-green-100 text-green-600',
                icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            rejected: {
                label: 'Rejetée',
                className: 'bg-red-100 text-red-600',
                icon: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            archived: {
                label: 'Archivée',
                className: 'bg-green-100 text-green-600',
                icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
        };
        return map[status as string] ?? map['draft'];
    };

    const getEnrollmentStatusConfig = (status: EnrollmentItem['status'], payment?: EnrollmentItem['payment_status']) => {
        const base = String(payment ?? 'unpaid');
        if (status === 'rejected') {
            return {
                label: 'Inscription rejetée',
                className: 'bg-red-100 text-red-600 border border-red-200',
                icon: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            };
        }
        const cfg: Record<string, { label: string; className: string; icon: JSX.Element }> = {
            paid: {
                label: 'Payée (acceptée)',
                className: 'bg-green-100 text-green-600 border border-green-200',
                icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            partial: {
                label: 'Paiement partiel',
                className: 'bg-gradient-to-r from-amber-100 to-cyan-100 text-amber-600 border border-amber-200',
                icon: <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
            unpaid: {
                label: "En attente d'approbation",
                className: 'bg-cyan-100 text-cyan-600 border border-cyan-200',
                icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
            },
        };
        return cfg[base] ?? cfg['unpaid'];
    };

    // Filtrage robuste
    const q = lower(searchTerm.trim());
    const filteredEnrollments = useMemo(() => {
        return items.filter((e) => {
            const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
            const levelName = e.level?.title ?? e.level?.title_ar ?? '';
            const hay = [levelName, e.matricule, e.uuid, e.notes, e.status, e.payment_status].map(lower).join(' | ');
            const matchesSearch = q ? hay.includes(q) : true;
            return matchesStatus && matchesSearch;
        });
    }, [items, q, filterStatus]);

    // Stats
    const countBy = (s: EnrollmentItem['status']) => items.filter((e) => e.status === s).length;

    const handleVisit = (uuid: string) => {
      router.visit(route('dashboard.enrollments.show', { uuid }));
    };

    return (
        <Dashboard>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 border-b-2 border-gray-200">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-4 sm:mb-0">
                        Mes Inscriptions
                    </h1>
                    <Link 
                        href={route('dashboard.enrollments.create', { new: 1 })} 
                        preserveState={false} 
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-sm sm:text-base"
                    >
                        Nouvelle inscription
                    </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-6 sm:mb-8 justify-center sm:justify-start">
                    <div className="text-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-md border border-gray-200 flex-1 min-w-[120px]">
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                            {countBy('submitted') + countBy('in_review')}
                        </span>
                        <span className="block text-xs sm:text-sm text-gray-600 uppercase tracking-wide mt-1">
                            En cours
                        </span>
                    </div>
                    <div className="text-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-md border border-gray-200 flex-1 min-w-[120px]">
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-green-500">
                            {countBy('validated')}
                        </span>
                        <span className="block text-xs sm:text-sm text-gray-600 uppercase tracking-wide mt-1">
                            Validées
                        </span>
                    </div>
                    <div className="text-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-md border border-gray-200 flex-1 min-w-[120px]">
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-gray-700">
                            {items.length}
                        </span>
                        <span className="block text-xs sm:text-sm text-gray-600 uppercase tracking-wide mt-1">
                            Total
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="relative flex-1 min-w-[200px] sm:min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher (niveau, matricule, notes…)"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-300 text-sm sm:text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value ?? '')}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <Filter size={14} className="text-gray-500 sm:w-4 sm:h-4" />
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)} 
                            className="border-none outline-none bg-transparent text-gray-700 cursor-pointer text-sm sm:text-base"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="draft">Brouillons</option>
                            <option value="submitted">Soumises</option>
                            <option value="in_review">En vérification</option>
                            <option value="pending_documents">Compléments requis</option>
                            <option value="validated">Validées</option>
                            <option value="rejected">Rejetées</option>
                            <option value="archived">Archivées</option>
                        </select>
                    </div>
                </div>

                {/* Empty State */}
                {filteredEnrollments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-base sm:text-lg">
                        Aucune inscription trouvée avec ces critères.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredEnrollments.map((e) => {
                            const statusCfg = getStatusConfig(e.status);
                            const enrollmentStatusCfg = getEnrollmentStatusConfig(e.status, e.payment_status);

                            const levelName = e.level?.title ?? e.level?.title_ar ?? 'Niveau non renseigné';
                            const levelTitle = e.level?.faculty?.name ?? '';
                            const docs = e.documents ?? [];
                            const verified = docs.filter((d) => d.verified).length;

                            return (
                                <div key={e.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                                    {/* Top border accent */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                                    
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 leading-tight truncate">
                                                {levelName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide truncate">
                                                {levelTitle || e.matricule || e.uuid || '—'}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${statusCfg.className} flex-shrink-0`}>
                                            {statusCfg.icon}
                                            <span className="hidden xs:inline">{statusCfg.label}</span>
                                            <span className="xs:hidden">{statusCfg.label.split(' ')[0]}</span>
                                        </div>
                                    </div>

                                    {/* Enrollment Status */}
                                    <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold uppercase tracking-wide mb-3 sm:mb-4 ${enrollmentStatusCfg.className}`}>
                                        {enrollmentStatusCfg.icon}
                                        <span className="hidden sm:inline">{enrollmentStatusCfg.label}</span>
                                        <span className="sm:hidden">{enrollmentStatusCfg.label.split(' ')[0]}</span>
                                    </div>

                                    {/* Enrollment Info */}
                                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 border-l-3 border-cyan-500">
                                        <div className="text-xs sm:text-sm text-gray-600">
                                            Créée le {fmtDate(e.created_at)} 
                                            {e.status === 'validated' && (
                                                <> • Inscrit le {fmtDate(e.enrolled_at)}</>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rejection Reason */}
                                    {e.status === 'rejected' && e.notes && (
                                        <div className="bg-red-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 border-l-3 border-red-500">
                                            <div className="text-xs sm:text-sm text-red-600 font-medium">
                                                Motif: {e.notes}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Capacity */}
                                    <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg mb-3 sm:mb-4">
                                        <span className="text-xs sm:text-sm text-gray-600">Documents vérifiés</span>
                                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                                            {verified} / {docs.length}
                                        </span>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-500 truncate">
                                            {fmtDate(e.created_at)} — {fmtDate(e.enrolled_at)}
                                        </div>
                                        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium flex-shrink-0">
                                            <FileCheck2 size={10} className="sm:w-3 sm:h-3" />
                                            <span className="hidden xs:inline">{verified} docs ok</span>
                                            <span className="xs:hidden">{verified}/{docs.length}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {e.status === 'draft' ? (
                                        <Link
                                            href={route('dashboard.enrollments.edit', { enrollment: e.uuid })}
                                            className="block w-full text-center mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-sm sm:text-base"
                                        >
                                            Continuer l'inscription
                                        </Link>
                                    ) : (
                                        <button 
                                            onClick={() => handleVisit(e.uuid!)} 
                                            className="w-full mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-sm sm:text-base"
                                        >
                                            Voir
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dashboard>
    );
}