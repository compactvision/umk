import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate } from '@/lib/scheduleDates';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';

const states = { submitted: 'Soumise', in_review: 'En examen', correction: 'Correction demandée', accepted: 'Acceptée', refused: 'Refusée' };
type Case = {
    id: number;
    status: keyof typeof states;
    revision: number;
    reason: string;
    decision_reason: string | null;
    download_url: string | null;
};
type Record = { id: number; course: string; date: string; student: string | null; case: Case | null };

export default function Absences({ staff, records, status }: { staff: boolean; records: { data: Record[] }; status: string | null }) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const { flash } = usePage<{ flash?: { success?: string } }>().props;
    const submit = (record: Record) =>
        setModal({
            title: record.case ? 'Compléter le justificatif' : 'Justifier cette absence',
            description: 'Le motif et la pièce sont réservés à votre dossier et au service habilité.',
            action: route('dashboard.student.absences.submit', record.id),
            values: { revision: record.case?.revision ?? null },
            fields: [
                { name: 'reason', label: 'Motif', type: 'textarea', required: true, value: record.case?.reason },
                { name: 'file', label: 'Justificatif facultatif', type: 'file', help: 'PDF, JPEG ou PNG, 5 Mio maximum.' },
            ],
        });
    const decide = (item: Case) =>
        setModal({
            title: 'Examiner la justification',
            description: 'La décision qualifie administrativement l’absence constatée.',
            action: route('dashboard.admin.schedule.absences.decide', item.id),
            values: { revision: item.revision },
            fields: [
                {
                    name: 'status',
                    label: 'Décision',
                    type: 'select',
                    required: true,
                    options: Object.entries(states)
                        .filter(([key]) => key !== 'submitted' && key !== item.status)
                        .map(([value, label]) => ({ value, label })),
                },
                { name: 'reason', label: 'Motif communiqué à l’étudiant', type: 'textarea', required: true },
            ],
        });
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Justifications d’absence" />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <main className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>Justifications d’absence</h1>
                        <p>{staff ? 'Examiner les demandes de votre périmètre.' : 'Consultez vos absences constatées et les décisions reçues.'}</p>
                    </div>
                    <Link href={staff ? route('dashboard.admin.schedule.index') : route('dashboard.student.index', { section: 'schedule' })}>
                        Emploi du temps
                    </Link>
                </header>
                {flash?.success && (
                    <p role="status" className="portal-alert">
                        {flash.success}
                    </p>
                )}
                {staff && (
                    <label>
                        État de la demande
                        <select
                            value={status ?? ''}
                            onChange={(e) => router.get(route('dashboard.admin.schedule.absences'), { status: e.target.value || undefined })}
                        >
                            <option value="">Tous</option>
                            {Object.entries(states).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {!records.data.length && (
                    <section className="portal-panel">
                        <p>{staff ? 'Aucune demande dans cette sélection.' : 'Aucune absence constatée.'}</p>
                    </section>
                )}
                {records.data.map((record) => (
                    <section className="portal-panel" key={record.id}>
                        <h2>{record.course}</h2>
                        <p>
                            {dateLabel(localDate(record.date))}
                            {record.student && ` · ${record.student}`} · {record.case ? states[record.case.status] : 'Absence constatée'}
                        </p>
                        {record.case && (
                            <>
                                <p>{record.case.reason}</p>
                                {record.case.decision_reason && <p>Décision · {record.case.decision_reason}</p>}
                                {record.case.download_url && <a href={record.case.download_url}>Télécharger la pièce privée</a>}
                            </>
                        )}
                        <div className="student-dossier-links">
                            {!staff && (!record.case || record.case.status === 'correction') && (
                                <button className="admin-primary" onClick={() => submit(record)}>
                                    {record.case ? 'Compléter la demande' : 'Déposer une justification'}
                                </button>
                            )}
                            {staff && record.case && ['submitted', 'in_review'].includes(record.case.status) && (
                                <button className="admin-primary" onClick={() => decide(record.case!)}>
                                    Examiner
                                </button>
                            )}
                        </div>
                    </section>
                ))}
                <Pagination value={records} />
            </main>
        </Dashboard>
    );
}
