import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePage, Link } from '@inertiajs/react';
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Filter, MapPin, Search, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function Index() {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { enrollments } = usePage().props;

    console.log(enrollments)

    // const enrollments = [
    //     {
    //         id: 1,
    //         courseName: 'Introduction à la Programmation Web',
    //         courseCode: 'INFO-101',
    //         instructor: 'Dr. Marie Dubois',
    //         status: 'active',
    //         enrollmentStatus: 'accepted',
    //         enrollmentDate: '2024-09-01',
    //         startDate: '2024-09-15',
    //         endDate: '2024-12-20',
    //         schedule: 'Lun, Mer, Ven 14h-16h',
    //         location: 'Salle A205',
    //         capacity: 30,
    //         enrolled: 28,
    //         credits: 6,
    //         progress: 75,
    //     },
    //     {
    //         id: 2,
    //         courseName: 'Mathématiques Appliquées',
    //         courseCode: 'MATH-201',
    //         instructor: 'Prof. Jean Martin',
    //         status: 'completed',
    //         enrollmentStatus: 'accepted',
    //         enrollmentDate: '2024-01-15',
    //         startDate: '2024-02-01',
    //         endDate: '2024-05-30',
    //         schedule: 'Mar, Jeu 10h-12h',
    //         location: 'Amphi B',
    //         capacity: 50,
    //         enrolled: 50,
    //         credits: 4,
    //         grade: 'A',
    //         progress: 100,
    //     },
    //     {
    //         id: 3,
    //         courseName: "Design d'Interface Utilisateur",
    //         courseCode: 'DES-301',
    //         instructor: 'Sarah Johnson',
    //         status: 'full',
    //         enrollmentStatus: 'waitlisted',
    //         enrollmentDate: '2024-09-20',
    //         startDate: '2024-10-01',
    //         endDate: '2025-01-15',
    //         schedule: 'Lun, Mer 16h-18h',
    //         location: 'Lab Design',
    //         capacity: 20,
    //         enrolled: 20,
    //         credits: 5,
    //         waitlistPosition: 3,
    //     },
    //     {
    //         id: 4,
    //         courseName: 'Base de Données Avancées',
    //         courseCode: 'INFO-401',
    //         instructor: 'Dr. Ahmed Hassan',
    //         status: 'pending',
    //         enrollmentStatus: 'pending_approval',
    //         enrollmentDate: '2024-10-15',
    //         startDate: '2024-11-01',
    //         endDate: '2025-02-28',
    //         schedule: 'Mar, Ven 9h-11h',
    //         location: 'Lab Info 3',
    //         capacity: 25,
    //         enrolled: 18,
    //         credits: 6,
    //     },
    //     {
    //         id: 5,
    //         courseName: 'Gestion de Projet Agile',
    //         courseCode: 'MGMT-250',
    //         instructor: 'Claire Lefebvre',
    //         status: 'cancelled',
    //         enrollmentStatus: 'rejected',
    //         enrollmentDate: '2024-08-20',
    //         rejectionReason: 'Prérequis non satisfaits',
    //         startDate: '2024-09-01',
    //         endDate: '2024-12-15',
    //         schedule: 'Jeu 14h-17h',
    //         location: 'Salle C102',
    //         capacity: 35,
    //         enrolled: 12,
    //         credits: 4,
    //     },
    //     {
    //         id: 6,
    //         courseName: 'Intelligence Artificielle',
    //         courseCode: 'INFO-501',
    //         instructor: 'Dr. Sophie Chen',
    //         status: 'upcoming',
    //         enrollmentStatus: 'conditionally_accepted',
    //         enrollmentDate: '2024-10-10',
    //         condition: 'Validation du projet MATH-201',
    //         startDate: '2024-12-01',
    //         endDate: '2025-03-30',
    //         schedule: 'Lun, Mer 10h-12h',
    //         location: 'Lab IA',
    //         capacity: 15,
    //         enrolled: 12,
    //         credits: 8,
    //     },
    // ];

    const getEnrollmentStatusConfig = (enrollmentStatus) => {
        const configs = {
            accepted: {
                label: 'Inscription acceptée',
                className: 'enrollment-card__enrollment-status--accepted',
                icon: <CheckCircle className="enrollment-card__enrollment-status-icon" />,
            },
            pending_approval: {
                label: "En attente d'approbation",
                className: 'enrollment-card__enrollment-status--pending',
                icon: <Clock className="enrollment-card__enrollment-status-icon" />,
            },
            rejected: {
                label: 'Inscription rejetée',
                className: 'enrollment-card__enrollment-status--rejected',
                icon: <XCircle className="enrollment-card__enrollment-status-icon" />,
            },
            waitlisted: {
                label: "Liste d'attente",
                className: 'enrollment-card__enrollment-status--waitlisted',
                icon: <AlertCircle className="enrollment-card__enrollment-status-icon" />,
            },
            conditionally_accepted: {
                label: 'Acceptation conditionnelle',
                className: 'enrollment-card__enrollment-status--conditional',
                icon: <AlertCircle className="enrollment-card__enrollment-status-icon" />,
            },
        };
        return configs[enrollmentStatus] || configs.pending_approval;
    };

    const getStatusConfig = (status) => {
        const configs = {
            active: {
                label: 'En cours',
                className: 'enrollment-card__status--active',
                icon: <CheckCircle className="enrollment-card__status-icon" />,
            },
            completed: {
                label: 'Terminé',
                className: 'enrollment-card__status--completed',
                icon: <CheckCircle className="enrollment-card__status-icon" />,
            },
            full: {
                label: 'Complet',
                className: 'enrollment-card__status--full',
                icon: <Users className="enrollment-card__status-icon" />,
            },
            pending: {
                label: 'En attente',
                className: 'enrollment-card__status--pending',
                icon: <AlertCircle className="enrollment-card__status-icon" />,
            },
            cancelled: {
                label: 'Annulé',
                className: 'enrollment-card__status--cancelled',
                icon: <XCircle className="enrollment-card__status-icon" />,
            },
            upcoming: {
                label: 'À venir',
                className: 'enrollment-card__status--upcoming',
                icon: <Calendar className="enrollment-card__status-icon" />,
            },
        };
        return configs[status] || configs.pending;
    };

    const filteredEnrollments = enrollments.data.filter((enrollment) => {
        const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
        const matchesSearch =
            enrollment.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.instructor.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'var(--color-success)';
        if (progress >= 60) return 'var(--color-warning)';
        return 'var(--color-info)';
    };

    return (
        <Dashboard>
            <div className="enrollments">
                <div className="enrollments__header">
                    <h1 className="enrollments__title">Mes Inscriptions</h1>
                    <Link href={route('dashboard.enrollments.store')} method="post" as="button" className="btn btn--primary">Nouvelle inscription</Link>
                    <div className="enrollments__stats">
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.data.filter((e) => e.status === 'active').length}</span>
                            <span className="enrollments__stat-label">En cours</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.data.filter((e) => e.status === 'completed').length}</span>
                            <span className="enrollments__stat-label">Terminés</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.data.length}</span>
                            <span className="enrollments__stat-label">Total</span>
                        </div>
                    </div>
                </div>

                <div className="enrollments__controls">
                    <div className="enrollments__search">
                        <Search className="enrollments__search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher un cours, code ou enseignant..."
                            className="enrollments__search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="enrollments__filter">
                        <Filter size={16} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="enrollments__filter-select">
                            <option value="all">Tous les statuts</option>
                            <option value="active">En cours</option>
                            <option value="completed">Terminés</option>
                            <option value="pending">En attente</option>
                            <option value="full">Complets</option>
                            <option value="cancelled">Annulés</option>
                        </select>
                    </div>
                </div>

                {filteredEnrollments.length === 0 ? (
                    <div className="enrollments__empty">Aucune inscription trouvée avec ces critères.</div>
                ) : (
                    <div className="enrollments__grid">
                        {filteredEnrollments.map((enrollment) => {
                            const statusConfig = getStatusConfig(enrollment.status);
                            const enrollmentStatusConfig = getEnrollmentStatusConfig(enrollment.enrollmentStatus);

                            return (
                                <div key={enrollment.id} className="enrollment-card">
                                    <div className="enrollment-card__header">
                                        <div className="enrollment-card__title-section">
                                            <h3 className="enrollment-card__title">{enrollment.courseName}</h3>
                                            <p className="enrollment-card__code">{enrollment.courseCode}</p>
                                        </div>
                                        <div className={`enrollment-card__status ${statusConfig.className}`}>
                                            {statusConfig.icon}
                                            {statusConfig.label}
                                        </div>
                                    </div>

                                    <div className={`enrollment-card__enrollment-status ${enrollmentStatusConfig.className}`}>
                                        {enrollmentStatusConfig.icon}
                                        {enrollmentStatusConfig.label}
                                    </div>

                                    <div className="enrollment-card__enrollment-info">
                                        <div className="enrollment-card__enrollment-date">
                                            Inscription demandée le {new Date(enrollment.enrollmentDate).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>

                                    {enrollment.enrollmentStatus === 'rejected' && enrollment.rejectionReason && (
                                        <div className="enrollment-card__rejection-reason">
                                            <div className="enrollment-card__rejection-text">Motif du rejet: {enrollment.rejectionReason}</div>
                                        </div>
                                    )}

                                    {enrollment.enrollmentStatus === 'conditionally_accepted' && enrollment.condition && (
                                        <div className="enrollment-card__condition">
                                            <div className="enrollment-card__condition-text">Condition: {enrollment.condition}</div>
                                        </div>
                                    )}

                                    <div className="enrollment-card__instructor">
                                        <BookOpen className="enrollment-card__instructor-icon" />
                                        {enrollment.instructor}
                                    </div>

                                    <div className="enrollment-card__details">
                                        <div className="enrollment-card__detail">
                                            <Calendar className="enrollment-card__detail-icon" />
                                            {enrollment.schedule}
                                        </div>
                                        <div className="enrollment-card__detail">
                                            <MapPin className="enrollment-card__detail-icon" />
                                            {enrollment.location}
                                        </div>
                                    </div>

                                    <div className="enrollment-card__capacity">
                                        <span className="enrollment-card__capacity-info">Places occupées</span>
                                        <span className="enrollment-card__capacity-numbers">
                                            {enrollment.enrolled} / {enrollment.capacity}
                                        </span>
                                    </div>

                                    {enrollment.status === 'active' && enrollment.progress !== undefined && (
                                        <div className="enrollment-card__progress-section">
                                            <div className="enrollment-card__progress-header">
                                                <span className="enrollment-card__progress-label">Progression</span>
                                                <span className="enrollment-card__progress-value">{enrollment.progress}%</span>
                                            </div>
                                            <div className="enrollment-card__progress-bar">
                                                <div
                                                    className="enrollment-card__progress-fill"
                                                    style={{
                                                        width: `${enrollment.progress}%`,
                                                        background: `linear-gradient(90deg, ${getProgressColor(enrollment.progress)}, var(--color-info))`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {enrollment.status === 'completed' && enrollment.grade && (
                                        <div className="enrollment-card__grade">
                                            <CheckCircle size={16} />
                                            Note finale: {enrollment.grade}
                                        </div>
                                    )}

                                    {enrollment.status === 'full' && enrollment.waitlistPosition && (
                                        <div className="enrollment-card__waitlist">
                                            <AlertCircle size={16} />
                                            <span className="enrollment-card__waitlist-text">
                                                Position {enrollment.waitlistPosition} sur liste d'attente
                                            </span>
                                        </div>
                                    )}

                                    <div className="enrollment-card__footer">
                                        <div className="enrollment-card__dates">
                                            {new Date(enrollment.startDate).toLocaleDateString('fr-FR')} -{' '}
                                            {new Date(enrollment.endDate).toLocaleDateString('fr-FR')}
                                        </div>
                                        <div className="enrollment-card__credits">
                                            <BookOpen size={12} />
                                            {enrollment.credits} crédits
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Dashboard>
    );
}
