import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Filter, MapPin, Search, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function Index() {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const enrollments = [
        {
            id: 1,
            courseName: 'Introduction à la Programmation Web',
            courseCode: 'INFO-101',
            instructor: 'Dr. Marie Dubois',
            status: 'active',
            enrollmentStatus: 'accepted',
            enrollmentDate: '2024-09-01',
            startDate: '2024-09-15',
            endDate: '2024-12-20',
            schedule: 'Lun, Mer, Ven 14h-16h',
            location: 'Salle A205',
            capacity: 30,
            enrolled: 28,
            credits: 6,
            progress: 75,
        },
        {
            id: 2,
            courseName: 'Mathématiques Appliquées',
            courseCode: 'MATH-201',
            instructor: 'Prof. Jean Martin',
            status: 'completed',
            enrollmentStatus: 'accepted',
            enrollmentDate: '2024-01-15',
            startDate: '2024-02-01',
            endDate: '2024-05-30',
            schedule: 'Mar, Jeu 10h-12h',
            location: 'Amphi B',
            capacity: 50,
            enrolled: 50,
            credits: 4,
            grade: 'A',
            progress: 100,
        },
        {
            id: 3,
            courseName: "Design d'Interface Utilisateur",
            courseCode: 'DES-301',
            instructor: 'Sarah Johnson',
            status: 'full',
            enrollmentStatus: 'waitlisted',
            enrollmentDate: '2024-09-20',
            startDate: '2024-10-01',
            endDate: '2025-01-15',
            schedule: 'Lun, Mer 16h-18h',
            location: 'Lab Design',
            capacity: 20,
            enrolled: 20,
            credits: 5,
            waitlistPosition: 3,
        },
        {
            id: 4,
            courseName: 'Base de Données Avancées',
            courseCode: 'INFO-401',
            instructor: 'Dr. Ahmed Hassan',
            status: 'pending',
            enrollmentStatus: 'pending_approval',
            enrollmentDate: '2024-10-15',
            startDate: '2024-11-01',
            endDate: '2025-02-28',
            schedule: 'Mar, Ven 9h-11h',
            location: 'Lab Info 3',
            capacity: 25,
            enrolled: 18,
            credits: 6,
        },
        {
            id: 5,
            courseName: 'Gestion de Projet Agile',
            courseCode: 'MGMT-250',
            instructor: 'Claire Lefebvre',
            status: 'cancelled',
            enrollmentStatus: 'rejected',
            enrollmentDate: '2024-08-20',
            rejectionReason: 'Prérequis non satisfaits',
            startDate: '2024-09-01',
            endDate: '2024-12-15',
            schedule: 'Jeu 14h-17h',
            location: 'Salle C102',
            capacity: 35,
            enrolled: 12,
            credits: 4,
        },
        {
            id: 6,
            courseName: 'Intelligence Artificielle',
            courseCode: 'INFO-501',
            instructor: 'Dr. Sophie Chen',
            status: 'upcoming',
            enrollmentStatus: 'conditionally_accepted',
            enrollmentDate: '2024-10-10',
            condition: 'Validation du projet MATH-201',
            startDate: '2024-12-01',
            endDate: '2025-03-30',
            schedule: 'Lun, Mer 10h-12h',
            location: 'Lab IA',
            capacity: 15,
            enrolled: 12,
            credits: 8,
        },
    ];

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

    const filteredEnrollments = enrollments.filter((enrollment) => {
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
                <style>{`
        :root {
          --color-primary: #3b82f6;
          --color-primary-light: #dbeafe;
          --color-success: #10b981;
          --color-success-light: #d1fae5;
          --color-warning: #f59e0b;
          --color-warning-light: #fef3c7;
          --color-error: #ef4444;
          --color-error-light: #fee2e2;
          --color-info: #06b6d4;
          --color-info-light: #cffafe;
          --color-gray-50: #f9fafb;
          --color-gray-100: #f3f4f6;
          --color-gray-200: #e5e7eb;
          --color-gray-300: #d1d5db;
          --color-gray-400: #9ca3af;
          --color-gray-500: #6b7280;
          --color-gray-600: #4b5563;
          --color-gray-700: #374151;
          --color-gray-800: #1f2937;
          --color-gray-900: #111827;
          --color-white: #ffffff;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .enrollments {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, var(--color-gray-50) 0%, #f8fafc 100%);
          min-height: 100vh;
        }

        .enrollments__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--color-gray-200);
        }

        .enrollments__title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-gray-900);
          background: linear-gradient(135deg, var(--color-primary), var(--color-info));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .enrollments__stats {
          display: flex;
          gap: 2rem;
        }

        .enrollments__stat {
          text-align: center;
          padding: 0.75rem 1.5rem;
          background: var(--color-white);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--color-gray-200);
        }

        .enrollments__stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary);
          display: block;
        }

        .enrollments__stat-label {
          font-size: 0.875rem;
          color: var(--color-gray-600);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.25rem;
        }

        .enrollments__controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .enrollments__search {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .enrollments__search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 2px solid var(--color-gray-200);
          border-radius: 12px;
          font-size: 1rem;
          background: var(--color-white);
          transition: all 0.3s ease;
        }

        .enrollments__search-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .enrollments__search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-gray-400);
          width: 1.25rem;
          height: 1.25rem;
        }

        .enrollments__filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-white);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 2px solid var(--color-gray-200);
          box-shadow: var(--shadow-sm);
        }

        .enrollments__filter-select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 1rem;
          color: var(--color-gray-700);
          cursor: pointer;
        }

        .enrollments__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .enrollment-card {
          background: var(--color-white);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-gray-100);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .enrollment-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-info));
        }

        .enrollment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }

        .enrollment-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .enrollment-card__title-section {
          flex: 1;
        }

        .enrollment-card__title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-gray-900);
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        .enrollment-card__code {
          font-size: 0.875rem;
          color: var(--color-gray-500);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .enrollment-card__status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.25px;
          white-space: nowrap;
        }

        .enrollment-card__status--active {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .enrollment-card__status--completed {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .enrollment-card__status--full {
          background: var(--color-warning-light);
          color: var(--color-warning);
        }

        .enrollment-card__status--pending {
          background: var(--color-info-light);
          color: var(--color-info);
        }

        .enrollment-card__status--upcoming {
          background: var(--color-info-light);
          color: var(--color-info);
        }

        .enrollment-card__enrollment-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.25px;
          margin-bottom: 1rem;
          border: 1px solid transparent;
        }

        .enrollment-card__enrollment-status--accepted {
          background: var(--color-success-light);
          color: var(--color-success);
          border-color: var(--color-success);
        }

        .enrollment-card__enrollment-status--pending {
          background: var(--color-info-light);
          color: var(--color-info);
          border-color: var(--color-info);
        }

        .enrollment-card__enrollment-status--rejected {
          background: var(--color-error-light);
          color: var(--color-error);
          border-color: var(--color-error);
        }

        .enrollment-card__enrollment-status--waitlisted {
          background: var(--color-warning-light);
          color: var(--color-warning);
          border-color: var(--color-warning);
        }

        .enrollment-card__enrollment-status--conditional {
          background: linear-gradient(135deg, var(--color-warning-light), var(--color-info-light));
          color: var(--color-warning);
          border-color: var(--color-warning);
        }

        .enrollment-card__enrollment-status-icon {
          width: 0.875rem;
          height: 0.875rem;
        }

        .enrollment-card__enrollment-info {
          background: var(--color-gray-50);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 3px solid var(--color-info);
        }

        .enrollment-card__enrollment-date {
          font-size: 0.8rem;
          color: var(--color-gray-600);
          margin-bottom: 0.25rem;
        }

        .enrollment-card__rejection-reason {
          background: var(--color-error-light);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 3px solid var(--color-error);
        }

        .enrollment-card__rejection-text {
          font-size: 0.875rem;
          color: var(--color-error);
          font-weight: 500;
        }

        .enrollment-card__condition {
          background: linear-gradient(135deg, var(--color-warning-light), var(--color-info-light));
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border-left: 3px solid var(--color-warning);
        }

        .enrollment-card__condition-text {
          font-size: 0.875rem;
          color: var(--color-warning);
          font-weight: 500;
        }

        .enrollment-card__status-icon {
          width: 1rem;
          height: 1rem;
        }

        .enrollment-card__instructor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: var(--color-gray-600);
          font-weight: 500;
        }

        .enrollment-card__instructor-icon {
          width: 1rem;
          height: 1rem;
        }

        .enrollment-card__details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .enrollment-card__detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-gray-600);
        }

        .enrollment-card__detail-icon {
          width: 1rem;
          height: 1rem;
          color: var(--color-gray-400);
        }

        .enrollment-card__capacity {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: var(--color-gray-50);
          border-radius: 8px;
        }

        .enrollment-card__capacity-info {
          font-size: 0.875rem;
          color: var(--color-gray-600);
        }

        .enrollment-card__capacity-numbers {
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .enrollment-card__progress-section {
          margin-top: 1rem;
        }

        .enrollment-card__progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .enrollment-card__progress-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-gray-700);
        }

        .enrollment-card__progress-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-gray-900);
        }

        .enrollment-card__progress-bar {
          width: 100%;
          height: 8px;
          background: var(--color-gray-200);
          border-radius: 4px;
          overflow: hidden;
        }

        .enrollment-card__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-success), var(--color-info));
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .enrollment-card__grade {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-success-light);
          color: var(--color-success);
          border-radius: 20px;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        .enrollment-card__waitlist {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--color-warning-light);
          border-radius: 8px;
          margin-top: 1rem;
        }

        .enrollment-card__waitlist-text {
          font-size: 0.875rem;
          color: var(--color-warning);
          font-weight: 600;
        }

        .enrollment-card__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-gray-200);
        }

        .enrollment-card__dates {
          font-size: 0.8rem;
          color: var(--color-gray-500);
        }

        .enrollment-card__credits {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .enrollments__empty {
          text-align: center;
          padding: 3rem;
          color: var(--color-gray-500);
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .enrollments {
            padding: 1rem;
          }

          .enrollments__header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .enrollments__stats {
            justify-content: center;
          }

          .enrollments__controls {
            flex-direction: column;
          }

          .enrollments__search {
            min-width: unset;
          }

          .enrollments__grid {
            grid-template-columns: 1fr;
          }

          .enrollment-card__details {
            grid-template-columns: 1fr;
          }
        }
                `}</style>

                <div className="enrollments__header">
                    <h1 className="enrollments__title">Mes Inscriptions</h1>
                    <div className="enrollments__stats">
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.filter((e) => e.status === 'active').length}</span>
                            <span className="enrollments__stat-label">En cours</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.filter((e) => e.status === 'completed').length}</span>
                            <span className="enrollments__stat-label">Terminés</span>
                        </div>
                        <div className="enrollments__stat">
                            <span className="enrollments__stat-number">{enrollments.length}</span>
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
