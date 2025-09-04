import CreateAcademicYearPopup from '@/components/form/CreateAcademicYearPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { useState } from 'react';
import './academicYear.css';
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
        if (!dateString) return "—"; // tiret si vide
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
                    {}, // pas de data
                    {
                        onSuccess: () => {
                            Alert.success('Année académique ouverte avec succès.');
                        },
                        onError: (errors) => {
                            Alert.error('Impossible d’ouvrir l’année académique. Une année est déjà ouverte.');
                        },
                    }
                );
            } else {
                const result = await Alert.confirm("Êtes-vous sûr de vouloir clôturer cette année ?");
                if (result.isConfirmed) {
                    router.patch(
                        route('dashboard.admin.academic-years.close', academicYear.id),
                        {}, // pas de data
                        {
                            onSuccess: () => {
                                Alert.success('Année académique clôturée avec succès.');
                            },
                            onError: (errors) => {
                                Alert.error('Impossible de clôturer l’année académique.');
                            },
                        }
                    );
                }
            }
        };

    return (
        <Dashboard>
            <div className="academic-container">
                <div className="academic-wrapper">
                    {/* Header Premium */}
                    <div className="header-section">
                        <div className="header-content">
                            <div className="title-group">
                                <div className="icon-container">
                                    <span className="main-icon">📅</span>
                                </div>
                                <div className="title-content">
                                    <h1 className="main-title">Années Académiques</h1>
                                    <p className="main-subtitle">Gérez vos périodes académiques avec élégance et précision</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(true)} className="create-button">
                                <span className="create-icon">+</span>
                                Nouvelle Année
                            </button>
                        </div>

                        {/* Stats Cards */}
                        {/* <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--green">✓</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Années Ouvertes</p>
                                        <p className="stat-value">{academicYears.filter((y) => y.status === 'open').length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--blue">⏱</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Brouillons</p>
                                        <p className="stat-value">{academicYears.filter((y) => y.status === 'draft').length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--purple">👥</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Total Étudiants (Année en cours)</p>
                                        <p className="stat-value">{academicYears.reduce((sum, year) => sum + (year.students_count || 0), 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        {/* Filtres et Recherche */}
                        <div className="filters-section">
                            <div className="search-container">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher une année..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            <div className="filter-container">
                                <span className="filter-icon">🔽</span>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                                    <option value="all">Tous les statuts</option>
                                    <option value="open">Ouvertes</option>
                                    <option value="draft">Brouillons</option>
                                    <option value="closed">Clôturées</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tableau Premium */}
                    <div className="table-container">
                        <table className="academic-table">
                            <thead>
                                <tr className="table-header">
                                    <th className="table-th">Année Académique</th>
                                    <th className="table-th">Période</th>
                                    <th className="table-th">Statut</th>
                                    <th className="table-th">Étudiants</th>
                                    <th className="table-th">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredYears.map((year, index) => (
                                    <tr key={year.id} className="table-row" style={{ animationDelay: `${index * 100}ms` }}>
                                        <td className="table-td">
                                            <div className="year-info">
                                                <div className="year-title">{year.title}</div>
                                                <div className="year-created">Créée le {formatDate(year.created_at || '')}</div>
                                            </div>
                                        </td>
                                        <td className="table-td">
                                            <div className="period-info">
                                                <div className="period-date">Du {formatDate(year.start_date)}</div>
                                                <div className="period-date">Au {formatDate(year.end_date)}</div>
                                            </div>
                                        </td>
                                        <td className="table-td">
                                            <span className={`status-badge status-badge--${year.status}`}>
                                                <span className="status-icon">{getStatusIcon(year.status)}</span>
                                                {getStatusText(year.status)}
                                            </span>
                                        </td>
                                        <td className="table-td">
                                            <div className="students-count">{year.students_count || 0}</div>
                                        </td>
                                        <td className="table-td">
                                            <div className="actions-group">
                                                {year.status === 'draft' && (
                                                    <button onClick={() => handleToggleStatus(year)} className="action-btn action-btn--success" title="Ouvrir">
                                                        <span>✓</span>
                                                    </button>
                                                )}
                                                {year.status === 'open' && (
                                                    <button onClick={() => handleToggleStatus(year)} className="action-btn action-btn--danger" title="Clôturer">
                                                        <span>✕</span>
                                                    </button>
                                                )}
                                                {year.status !== 'closed' && (
                                                    <button onClick={() => openEditModal(year) } className="action-btn action-btn--primary" title="Modifier">
                                                        <span>✏️</span>
                                                    </button>
                                                )}
                                                <button onClick={() => handleRedirect(year) } className="action-btn action-btn--secondary" title="Voir">
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

                {/* Modal Premium */}
                {showModal && <CreateAcademicYearPopup closeModal={closeModal} academicYear={academicYear} />}
            </div>
        </Dashboard>
    );
}
