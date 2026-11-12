import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import SemesterManager, { type Semester } from '@/components/teaching/SemesterManager';
import type { Year } from '@/components/teaching/types';
import { Head, Link, router } from '@inertiajs/react';
import '../../../../css/dashboard/academic-years.css';
import '../../../../css/dashboard/schedule.css';

export default function Semesters({ years, yearId, semesters }: { years: Year[]; yearId: number | null; semesters: Semester[] }) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Semestres et périodes" />
            <div className="academic-years-page">
                <PageHeading
                    title="Semestres et périodes"
                    description="Définissez les dates du premier et du deuxième semestre de chaque année académique."
                />
                {years.length > 0 ? (
                    <label className="admin-field">
                        Année académique
                        <select
                            value={yearId ?? ''}
                            onChange={(event) =>
                                router.get(route('dashboard.admin.academic-years.semesters.index'), { academic_year_id: event.target.value })
                            }
                        >
                            {years.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.title}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <Link href={route('dashboard.admin.academic-years.index')}>Gérer les années académiques</Link>
                )}
                <SemesterManager year={years.find((year) => year.id === yearId)} semesters={semesters} />
            </div>
        </Dashboard>
    );
}
