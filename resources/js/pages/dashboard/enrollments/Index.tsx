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
    const [filterStatus, setFilterStatus] = useState('all'); // conserve le nom
    const [searchTerm, setSearchTerm] = useState(''); // string contrôlé
    const { enrollments } = usePage<{ enrollments?: { data?: EnrollmentItem[] } }>().props;
    

    const items: EnrollmentItem[] = useMemo(() => {
        return Array.isArray(enrollments?.data) ? enrollments!.data! : [];
    }, [enrollments]);

    // --- Mapping vers TES classes existantes ---

    // Ton bloc "enrollment-card__status" (dans ton design d'origine = statut du "cours")
    // Ici on l’emploie pour refléter un état visuel dérivé de notre workflow:
    // draft->upcoming, submitted|in_review->pending, pending_documents->full (complet = bloqué par docs),
    // validated->completed, rejected->cancelled, archived->completed (neutre)
    const getStatusConfig = (status: EnrollmentItem['status']) => {
        const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
            draft: {
                label: 'Brouillon',
                className: 'enrollment-card__status--upcoming',
                icon: <Calendar className="enrollment-card__status-icon" />,
            },
            submitted: { label: 'Soumise', className: 'enrollment-card__status--pending', icon: <Clock className="enrollment-card__status-icon" /> },
            in_review: {
                label: 'En vérification',
                className: 'enrollment-card__status--pending',
                icon: <AlertCircle className="enrollment-card__status-icon" />,
            },
            pending_documents: {
                label: 'Compléments requis',
                className: 'enrollment-card__status--full',
                icon: <Users className="enrollment-card__status-icon" />,
            },
            validated: {
                label: 'Validée',
                className: 'enrollment-card__status--completed',
                icon: <CheckCircle className="enrollment-card__status-icon" />,
            },
            rejected: {
                label: 'Rejetée',
                className: 'enrollment-card__status--cancelled',
                icon: <XCircle className="enrollment-card__status-icon" />,
            },
            archived: {
                label: 'Archivée',
                className: 'enrollment-card__status--completed',
                icon: <CheckCircle className="enrollment-card__status-icon" />,
            },
        };
        return map[status as string] ?? map['draft'];
    };

    // Ton bloc "enrollment-card__enrollment-status" (dans ton design = état d'acceptation)
    // Ici on l’emploie pour la visibilité "paiement" + exceptions:
    // paid->accepted, unpaid->pending_approval, partial->conditionally_accepted, rejected->rejected
    const getEnrollmentStatusConfig = (status: EnrollmentItem['status'], payment?: EnrollmentItem['payment_status']) => {
        const base = String(payment ?? 'unpaid');
        if (status === 'rejected') {
            return {
                label: 'Inscription rejetée',
                className: 'enrollment-card__enrollment-status--rejected',
                icon: <XCircle className="enrollment-card__enrollment-status-icon" />,
            };
        }
        const cfg: Record<string, { label: string; className: string; icon: JSX.Element }> = {
            paid: {
                label: 'Payée (acceptée)',
                className: 'enrollment-card__enrollment-status--accepted',
                icon: <CheckCircle className="enrollment-card__enrollment-status-icon" />,
            },
            partial: {
                label: 'Paiement partiel',
                className: 'enrollment-card__enrollment-status--conditional',
                icon: <AlertCircle className="enrollment-card__enrollment-status-icon" />,
            },
            unpaid: {
                label: "En attente d'approbation",
                className: 'enrollment-card__enrollment-status--pending',
                icon: <Clock className="enrollment-card__enrollment-status-icon" />,
            },
        };
        return cfg[base] ?? cfg['unpaid'];
    };

    // --- Filtrage robuste (garde tes noms: filterStatus/searchTerm/enrollments.data) ---
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

    // Stats (garde tes blocs)
    const countBy = (s: EnrollmentItem['status']) => items.filter((e) => e.status === s).length;

    const handleVisit = (uuid: string) => {
      router.visit(route('dashboard.enrollment.show', { uuid }));
    };

    return (
        <Dashboard>
            <div className="enrollments">
                <div className="enrollments__header">
                    <h1 className="enrollments__title">Mes Inscriptions</h1>
                    <Link href={route('dashboard.enrollments.create', { new: 1 })} preserveState={false} className="btn btn--primary">
                        Nouvelle inscription
                    </Link>

                    <div className="enrollments__stats">
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{countBy('submitted') + countBy('in_review')}</span>
                            <span className="enrollments__stat-label">En cours</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{countBy('validated')}</span>
                            <span className="enrollments__stat-label">Validées</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{items.length}</span>
                            <span className="enrollments__stat-label">Total</span>
                        </div>
                    </div>
                </div>

                <div className="enrollments__controls">
                    <div className="enrollments__search">
                        <Search className="enrollments__search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher (niveau, matricule, notes…)"
                            className="enrollments__search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value ?? '')}
                        />
                    </div>
                    <div className="enrollments__filter">
                        <Filter size={16} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="enrollments__filter-select">
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

                {filteredEnrollments.length === 0 ? (
                    <div className="enrollments__empty">Aucune inscription trouvée avec ces critères.</div>
                ) : (
                    <div className="enrollments__grid">
                        {filteredEnrollments.map((e) => {
                            const statusCfg = getStatusConfig(e.status);
                            const enrollmentStatusCfg = getEnrollmentStatusConfig(e.status, e.payment_status);

                            const levelName = e.level?.title ?? e.level?.title_ar ?? 'Niveau non renseigné';
                            const levelTitle = e.level?.faculty?.name ?? '';
                            const docs = e.documents ?? [];
                            const verified = docs.filter((d) => d.verified).length;

                            return (
                                <div key={e.id} className="enrollment-card">
                                    <div className="enrollment-card__header">
                                        <div className="enrollment-card__title-section">
                                            <h3 className="enrollment-card__title">{levelName}</h3>
                                            <p className="enrollment-card__code">{levelTitle || e.matricule || e.uuid || '—'}</p>
                                        </div>
                                        <div className={`enrollment-card__status ${statusCfg.className}`}>
                                            {statusCfg.icon}
                                            {statusCfg.label}
                                        </div>
                                    </div>

                                    <div className={`enrollment-card__enrollment-status ${enrollmentStatusCfg.className}`}>
                                        {enrollmentStatusCfg.icon}
                                        {enrollmentStatusCfg.label}
                                    </div>

                                    <div className="enrollment-card__enrollment-info">
                                        <div className="enrollment-card__enrollment-date">
                                            Créée le {fmtDate(e.created_at)} {e.status === 'validated' && <>• Inscrit le {fmtDate(e.enrolled_at)}</>}
                                        </div>
                                    </div>

                                    {e.status === 'rejected' && e.notes && (
                                        <div className="enrollment-card__rejection-reason">
                                            <div className="enrollment-card__rejection-text">Motif: {e.notes}</div>
                                        </div>
                                    )}

                                    {/* Bloc "instructor/details/capacity" gardé MAIS caché si données absentes */}
                                    {false && (
                                        <>
                                            <div className="enrollment-card__instructor">
                                                <BookOpen className="enrollment-card__instructor-icon" />—
                                            </div>
                                            <div className="enrollment-card__details">
                                                <div className="enrollment-card__detail">
                                                    <Calendar className="enrollment-card__detail-icon" /> —
                                                </div>
                                                <div className="enrollment-card__detail">
                                                    <MapPin className="enrollment-card__detail-icon" /> —
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="enrollment-card__capacity">
                                        <span className="enrollment-card__capacity-info">Documents vérifiés</span>
                                        <span className="enrollment-card__capacity-numbers">
                                            {verified} / {docs.length}
                                        </span>
                                    </div>

                                    {/* Progress/grade/waitlist gardés mais non utilisés ici */}
                                    <div className="enrollment-card__footer">
                                        <div className="enrollment-card__dates">
                                            {fmtDate(e.created_at)} — {fmtDate(e.enrolled_at)}
                                        </div>
                                        <div className="enrollment-card__credits">
                                            <FileCheck2 size={12} />
                                            {verified} docs ok
                                        </div>
                                    </div>

                                    <button onClick={() => handleVisit(e.uuid)} className="btn btn--primary" style={{ marginTop: 10}}>Voir</button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dashboard>
    );
}
