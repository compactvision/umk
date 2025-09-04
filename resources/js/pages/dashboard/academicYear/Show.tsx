import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import BackButton from '@/components/UI/dashboard/BackButton';
import Alert from '@/utils/sweetAlert';
import { router } from '@inertiajs/react';
import './academicYear.css';

type AcademicYear = {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'open' | 'closed';
    students_count?: number;
    created_at?: string;
};

export default function AcademicYearShow({ academicYear }: { academicYear: AcademicYear }) {
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
                },
            );
        } else {
            const result = await Alert.confirm('Êtes-vous sûr de vouloir clôturer cette année ?');
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
                    },
                );
            }
        }
    };

    const year = academicYear.data;

    return (
        <Dashboard>
            <div className="academic-container">
                <div className="academic-wrapper">
                    {/* Header Premium */}
                    <div className="header-section">
                        <BackButton label="Retour" />
                        <div className="header-content">
                            <div className="title-group">
                                <div className="icon-container">
                                    <span className="main-icon">📅</span>
                                </div>
                                <div className="title-content">
                                    <h1 className="main-title">Années Académiques {year.title}</h1>
                                    <p className="main-subtitle">Gérez vos périodes académiques avec élégance et précision</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToggleStatus(year)} 
                                className="create-button"
                                >
                                {year.status === 'open' 
                                    ? "Clôturer l'année" 
                                    : "Ouvrir l'année"}
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--green">✓</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Années Ouvertes</p>
                                        <p className="stat-value">{year.status === 'open' ? 1 : 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--blue">⏱</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Brouillons</p>
                                        <p className="stat-value">{year.status === 'draft' ? 1 : 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <div className="stat-icon stat-icon--purple">👥</div>
                                    <div className="stat-info">
                                        <p className="stat-label">Total Étudiants (Année en cours)</p>
                                        <p className="stat-value">{year.students_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
}
