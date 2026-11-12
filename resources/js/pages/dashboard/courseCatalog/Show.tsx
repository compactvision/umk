import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from '../studentAcademic/AcademicForm';
import { type Page } from '../teaching/types';

type Course = {
    id: number;
    title: string;
    code: string | null;
    description: string | null;
    discipline: string | null;
    semester: number | null;
    credits: number;
    cmi_hours: number | null;
    td_hours: number | null;
    tp_hours: number | null;
    pedagogical_content: string | null;
    catalog_status: 'active' | 'inactive' | 'archived';
};
const statuses = { active: 'Active', inactive: 'Inactive', archived: 'Archivée' };
const reason: Field = { name: 'reason', label: 'Justification', type: 'textarea', required: true };

export default function CatalogCourse({
    course,
    level,
    canEdit,
    uses,
    offerings,
}: {
    course: Course;
    level: string;
    canEdit: boolean;
    uses: Page<{ id: number; unit: string; title: string; version: string; status: string }>;
    offerings: Page<{ id: number; year: string; sessions: number; resources: number }>;
}) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const { flash } = usePage<{ flash?: { success?: string } }>().props;
    return (
        <Dashboard hideAppsNavigation>
            <Head title={course.title} />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <main className="student-portal academic-administration">
                <header className="directory-heading">
                    <div>
                        <h1>{course.title}</h1>
                        <p>
                            {course.code ?? 'Sans code'} · {level} · {statuses[course.catalog_status]}
                        </p>
                    </div>
                    <Link href={route('dashboard.admin.course-catalog.index')}>Retour au catalogue</Link>
                </header>
                {flash?.success && (
                    <p role="status" className="portal-alert">
                        {flash.success}
                    </p>
                )}
                <section className="portal-panel">
                    <h2>Définition du catalogue</h2>
                    <p>
                        {course.discipline ?? 'Domaine non renseigné'} · {course.credits} crédits indicatifs · CMI {course.cmi_hours ?? '—'} h · TD{' '}
                        {course.td_hours ?? '—'} h · TP {course.tp_hours ?? '—'} h
                    </p>
                    <p>{course.description ?? 'Aucune description.'}</p>
                    {course.pedagogical_content && <p className="whitespace-pre-line">{course.pedagogical_content}</p>}
                    {canEdit && course.catalog_status !== 'archived' && (
                        <div className="student-dossier-links">
                            <button
                                className="admin-primary"
                                onClick={() =>
                                    setModal({
                                        title: 'Modifier la définition',
                                        description: 'Les EC des maquettes publiées conservent leur intitulé et leurs crédits.',
                                        method: 'put',
                                        action: route('dashboard.admin.course-catalog.update', course.id),
                                        fields: [
                                            { name: 'title', label: 'Intitulé', required: true, value: course.title },
                                            { name: 'code', label: 'Code', value: course.code },
                                            { name: 'discipline', label: 'Domaine', value: course.discipline },
                                            { name: 'credits', label: 'Crédits indicatifs', type: 'number', required: true, value: course.credits },
                                            {
                                                name: 'semester',
                                                label: 'Semestre indicatif historique',
                                                type: 'select',
                                                required: true,
                                                value: course.semester,
                                                options: [
                                                    { value: 1, label: '1er semestre' },
                                                    { value: 2, label: '2e semestre' },
                                                ],
                                            },
                                            ...(['cmi_hours', 'td_hours', 'tp_hours'] as const).map((name) => ({
                                                name,
                                                label: name.replace('_hours', '').toUpperCase(),
                                                type: 'number',
                                                value: course[name],
                                            })),
                                            { name: 'description', label: 'Description', type: 'textarea', value: course.description },
                                            {
                                                name: 'pedagogical_content',
                                                label: 'Objectifs et contenu pédagogique',
                                                type: 'textarea',
                                                value: course.pedagogical_content,
                                            },
                                            reason,
                                        ],
                                    })
                                }
                            >
                                Modifier la définition
                            </button>
                            <button
                                className="admin-secondary"
                                onClick={() =>
                                    setModal({
                                        title: 'Changer le statut de la matière',
                                        description:
                                            'Les offres, maquettes et résultats existants restent consultables dans leur contexte. L’archivage est définitif.',
                                        action: route('dashboard.admin.course-catalog.status', course.id),
                                        fields: [
                                            {
                                                name: 'status',
                                                label: 'Nouveau statut',
                                                type: 'select',
                                                required: true,
                                                options: Object.entries(statuses)
                                                    .filter(([key]) => key !== course.catalog_status)
                                                    .map(([value, label]) => ({ value, label })),
                                            },
                                            reason,
                                        ],
                                    })
                                }
                            >
                                Changer le statut
                            </button>
                        </div>
                    )}
                </section>
                <section className="portal-panel">
                    <h2>Utilisations dans les maquettes</h2>
                    {uses.data.length ? (
                        <ul>
                            {uses.data.map((u) => (
                                <li key={u.id}>
                                    {u.version} · {u.unit} · {u.title} ({u.status})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune utilisation enregistrée.</p>
                    )}
                    <Pagination value={uses} />
                </section>
                <section className="portal-panel">
                    <h2>Offres existantes</h2>
                    {offerings.data.length ? (
                        <ul>
                            {offerings.data.map((o) => (
                                <li key={o.id}>
                                    <Link href={route('dashboard.admin.teaching.index', { offering: o.id })}>{o.year}</Link> · {o.sessions} séances ·{' '}
                                    {o.resources} ressources
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Aucune offre enregistrée.</p>
                    )}
                    <Pagination value={offerings} />
                </section>
            </main>
        </Dashboard>
    );
}
