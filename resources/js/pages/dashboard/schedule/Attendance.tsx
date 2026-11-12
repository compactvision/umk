import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate, time } from '@/lib/scheduleDates';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/teaching.css';
import '../../../../css/student-course.css';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';

type Props = {
    session: { id: number; title: string; level: string; year: string; starts_at: string; ends_at: string; room: string };
    students: { id: number; name: string; matricule: string; status: string }[];
    canRecord: boolean;
    closed: boolean;
    revision: number;
    teacher: boolean;
    pagination: unknown;
    flash?: { success?: string };
};
export default function AttendancePage() {
    const { students, revision } = usePage<Props>().props;
    return <Attendance key={revision + ':' + students.map((student) => student.id).join(':')} />;
}

function Attendance() {
    const { session, students, canRecord, closed, revision, teacher, pagination, flash } = usePage<Props>().props;
    const [modal, setModal] = useState<FormSpec | null>(null);
    const form = useForm({ reason: '', records: students.map((student) => ({ id: student.id, status: student.status })) });
    return (
        <Dashboard>
            <Head title={`Présences · ${session.title}`} />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <div className="teaching-page">
                <Link href={teacher ? route('dashboard.teaching.index') : route('dashboard.admin.schedule.index')}>← Retour aux horaires</Link>
                <PageHeading
                    title={`Présences · ${session.title}`}
                    description={`${session.level} · ${session.year} · ${dateLabel(localDate(session.starts_at))} · ${time(session.starts_at)}–${time(session.ends_at)} · ${session.room}`}
                />
                {flash?.success && (
                    <p role="status" className="teaching-feedback">
                        {flash.success}
                    </p>
                )}
                {!canRecord && <p>L’appel est en lecture seule. La saisie exige une séance publiée et commencée.</p>}
                {!teacher && !closed && canRecord && new Date(session.ends_at) <= new Date() && students.some((student) => student.status) && (
                    <button
                        className="admin-secondary"
                        onClick={() =>
                            setModal({
                                title: 'Clôturer l’appel',
                                description: 'Les corrections ultérieures seront réservées aux agents habilités.',
                                action: route('dashboard.admin.schedule.transition', session.id),
                                values: { action: 'close_attendance' },
                                fields: [{ name: 'reason', label: 'Motif', type: 'textarea', required: true }],
                            })
                        }
                    >
                        Clôturer l’appel
                    </button>
                )}
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.transform((data) => ({ revision, reason: data.reason, records: data.records.filter((record) => record.status) }));
                        form.post(route(teacher ? 'dashboard.teaching.attendance.save' : 'dashboard.admin.schedule.attendance.save', session.id), {
                            preserveScroll: true,
                        });
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
                                        <option value="excused" disabled={teacher}>
                                            Excusé
                                        </option>
                                    </select>
                                </label>
                            </article>
                        ))}
                    </div>
                    {!students.length && <p>Aucun étudiant confirmé ne correspond au niveau, à l’année et au groupe de cet enseignement.</p>}
                    {closed && canRecord && (
                        <label>
                            Motif obligatoire de la correction
                            <textarea required minLength={5} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                        </label>
                    )}
                    <button
                        type="submit"
                        className="admin-primary mt-5"
                        disabled={!canRecord || form.processing || !form.data.records.some((record) => record.status)}
                    >
                        {form.processing ? 'Enregistrement…' : 'Enregistrer les présences'}
                    </button>
                </form>
                <Pagination value={pagination} />
            </div>
        </Dashboard>
    );
}
