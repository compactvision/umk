import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { labels } from '@/components/student/types';
import { Head, Link, useForm } from '@inertiajs/react';
import '../../../../css/student-portal.css';
type Props = {
    entries: {
        data: {
            id: number;
            matricule: string | null;
            year: string;
            level: string;
            status: string;
            program: string | null;
            curriculum: string | null;
            faculty: string;
            promotion: string | null;
            group: string | null;
            requirements: string[];
            renewal: { id: number; level: string; year: string; target_id: number | null; can_start: boolean } | null;
        }[];
    };
    changes: { data: { id: number; action: string; after: { enrollment_status: string }; effective_at: string; ends_at: string | null }[] };
};
export default function MyEnrollments({ entries, changes }: Props) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Mes inscriptions académiques" />
            <main className="student-portal">
                <header className="directory-heading">
                    <h1>Mes inscriptions académiques</h1>
                    <Link href="/dashboard/student">Mon espace étudiant</Link>
                </header>
                <section className="portal-panel">
                    <h2>Situation annuelle et historique</h2>
                    {entries.data.map((entry) => (
                        <article key={entry.id} style={{ paddingBlock: 12 }}>
                            <h3>
                                {entry.year} · {entry.level}
                            </h3>
                            <p>
                                {entry.matricule} · {entry.program ?? 'Programme à rattacher'} · Maquette {entry.curriculum ?? 'à rattacher'}
                            </p>
                            <p>{labels[entry.status] || entry.status}</p>
                            <p>
                                {entry.faculty} · {entry.promotion ?? 'Promotion à affecter'} · {entry.group ?? 'Groupe à affecter'}
                            </p>
                            {entry.requirements.length > 0 && (
                                <ul>
                                    {entry.requirements.map((requirement) => (
                                        <li key={requirement}>{requirement}</li>
                                    ))}
                                </ul>
                            )}
                            {entry.renewal && <RenewalAction entry={entry} />}
                            {entry.status === 'pending_confirmation' && (
                                <p>La confirmation dépend des contrôles administratifs et des conditions financières applicables.</p>
                            )}
                            <Link href={route('dashboard.student.index', { section: 'overview', academic: entry.id })}>
                                Consulter cette inscription et les possibilités de réinscription
                            </Link>{' '}
                            ·{' '}
                            <Link href={route('dashboard.student.index', { section: 'requests', academic: entry.id })}>
                                Demander une correction ou un changement de situation
                            </Link>
                        </article>
                    ))}
                    {!entries.data.length && <p>Aucune inscription académique enregistrée.</p>}
                    <Pagination value={entries} />
                </section>
                <section className="portal-panel">
                    <h2>Décisions administratives</h2>
                    {changes.data.map((change) => (
                        <p key={change.id}>
                            {new Date(change.effective_at).toLocaleDateString('fr-FR')} ·{' '}
                            {change.action === 'transfer' ? 'Transfert autorisé' : 'Situation mise à jour'} :{' '}
                            {labels[change.after.enrollment_status] || change.after.enrollment_status}
                            {change.ends_at && ` · Fin prévue : ${new Date(change.ends_at).toLocaleDateString('fr-FR')}`}
                        </p>
                    ))}
                    {!changes.data.length && <p>Aucune nouvelle décision dans ce registre.</p>}
                    <Pagination value={changes} />
                </section>
            </main>
        </Dashboard>
    );
}

function RenewalAction({ entry }: { entry: Props['entries']['data'][number] }) {
    const form = useForm<{ progression?: string }>({});
    const renewal = entry.renewal!;
    return (
        <section aria-label="Réinscription autorisée">
            <h4>
                {renewal.year} · {renewal.level}
            </h4>
            {renewal.target_id ? (
                <Link href={route('dashboard.student.index', { section: 'overview', academic: renewal.target_id })}>Consulter la réinscription</Link>
            ) : renewal.can_start ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('dashboard.student.renewals.start', { progression: renewal.id, academic: entry.id }));
                    }}
                >
                    <button className="portal-primary" disabled={form.processing}>
                        Demander ma réinscription
                    </button>
                    {Object.values(form.errors).map((error) => (
                        <p key={error} role="alert">
                            {error}
                        </p>
                    ))}
                </form>
            ) : (
                <p>La décision de poursuite est enregistrée ; les conditions d’ouverture et d’éligibilité doivent être remplies avant la demande.</p>
            )}
        </section>
    );
}
