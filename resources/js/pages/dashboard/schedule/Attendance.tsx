import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate, time } from '@/lib/scheduleDates';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import '../../../../css/dashboard/teaching.css';
import '../../../../css/student-course.css';

type Props = {
    session: { id: number; title: string; level: string; year: string; starts_at: string; ends_at: string; room: string };
    students: { id: number; name: string; matricule: string; status: string }[];
    canRecord: boolean;
    flash?: { success?: string };
};
export default function Attendance() {
    const { session, students, canRecord, flash } = usePage<Props>().props;
    const form = useForm({ records: students.map((student) => ({ id: student.id, status: student.status })) });
    return (
        <Dashboard>
            <Head title={`Présences · ${session.title}`} />
            <div className="teaching-page">
                <Link href="/dashboard/admin/schedule">← Retour aux horaires</Link>
                <PageHeading
                    title={`Présences · ${session.title}`}
                    description={`${session.level} · ${session.year} · ${dateLabel(localDate(session.starts_at))} · ${time(session.starts_at)}–${time(session.ends_at)} · ${session.room}`}
                />
                {flash?.success && (
                    <p role="status" className="teaching-feedback">
                        {flash.success}
                    </p>
                )}
                {!canRecord && <p>L’appel sera disponible au début de la séance.</p>}
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.transform((data) => ({ records: data.records.filter((record) => record.status) }));
                        form.post(route('dashboard.admin.schedule.attendance.save', session.id), { preserveScroll: true });
                    }}
                    className="teaching-profile"
                >
                    <header className="teaching-section-heading">
                        <h2>{students.length} étudiant(s)</h2>
                        <button
                            type="button"
                            className="admin-secondary"
                            disabled={!canRecord || form.processing}
                            onClick={() =>
                                form.setData(
                                    'records',
                                    form.data.records.map((record) => ({ ...record, status: 'present' })),
                                )
                            }
                        >
                            Marquer tous présents
                        </button>
                    </header>
                    {Object.values(form.errors).map((error, index) => (
                        <p role="alert" key={index} className="text-red-700">
                            {error}
                        </p>
                    ))}
                    <div className="course-attendance-list">
                        {students.map((student, index) => (
                            <article key={student.id}>
                                <div>
                                    <strong>{student.name}</strong>
                                    <p>{student.matricule}</p>
                                </div>
                                <label>
                                    <span className="sr-only">Présence de {student.name}</span>
                                    <select
                                        disabled={!canRecord || form.processing}
                                        value={form.data.records[index].status}
                                        onChange={(event) =>
                                            form.setData(
                                                'records',
                                                form.data.records.map((record, i) =>
                                                    i === index ? { ...record, status: event.target.value } : record,
                                                ),
                                            )
                                        }
                                    >
                                        <option value="">Non renseigné</option>
                                        <option value="present">Présent</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">En retard</option>
                                        <option value="excused">Excusé</option>
                                    </select>
                                </label>
                            </article>
                        ))}
                    </div>
                    {!students.length && <p>Aucun étudiant confirmé ne correspond au niveau, à l’année et au groupe de cet enseignement.</p>}
                    <button
                        type="submit"
                        className="admin-primary mt-5"
                        disabled={!canRecord || form.processing || !form.data.records.some((record) => record.status)}
                    >
                        {form.processing ? 'Enregistrement…' : 'Enregistrer les présences'}
                    </button>
                </form>
            </div>
        </Dashboard>
    );
}
