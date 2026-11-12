import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import AcademicForm, { type Field, type FormSpec } from '@/pages/dashboard/studentAcademic/AcademicForm';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export const lifecycleLabels: Record<string, string> = {
    interruption: 'Interruption',
    resumption: 'Reprise d’études',
    reorientation: 'Réorientation',
    external_transfer: 'Transfert externe',
    cycle: 'Changement de cycle',
    graduation: 'Fin de cursus',
    repeat: 'Redoublement',
    advance: 'Passage',
    conditional: 'Passage conditionnel',
    open: 'À examiner',
    correction: 'À compléter',
    approved: 'Approuvé',
    refused: 'Refusé',
    awaiting_results: 'En attente de résultats publiés',
    blocked: 'Incohérence dans le dossier',
    not_authorized: 'Passage non autorisé par la décision',
    eligible: 'Décision autorisant un parcours suivant',
};

type Page<T> = { data: T[]; links: unknown[] };
type Case = {
    id: number;
    academic_enrollment_id: number;
    author_id: number;
    revision: number;
    reference: string;
    kind: string;
    status: string;
    reason: string;
    response: string | null;
    decided_at: string | null;
    decided_by: number | null;
    target_enrollment_id: number | null;
    requested: Record<string, string | number | null>;
    completion: { credits: number; degree: string; result_reference: string } | null;
};
type Retake = { item_id: number; unit: string; name: string; credits: number | null };
type Decision = {
    id: number;
    academic: number;
    kind: string | null;
    level: string;
    year: string;
    target: number | null;
    target_status: string | null;
    due_on: string | null;
    retakes: Retake[];
    assigned_items: number[];
};
type Props = {
    actor: number;
    abilities: { manage: boolean; approve: boolean; graduation: boolean; register: boolean };
    entry: {
        id: number;
        name: string;
        matricule: string;
        level: string;
        year: string;
        program: string | null;
        status: string;
        mode: string | null;
        result: string | null;
        can_finish: boolean;
    } | null;
    filters: { academic?: number; year?: number; q?: string; kind?: string; status?: string };
    counts: Record<string, number>;
    cases: Page<Case>;
    progressions: Page<Decision>;
};

const prefix = 'dashboard.admin.progression.';
const kinds = ['interruption', 'resumption', 'reorientation', 'external_transfer', 'cycle', 'graduation'];
const reason: Field = { name: 'reason', type: 'textarea', label: 'Motif ou référence institutionnelle', required: true };
const numeric = (name: string, label: string): Field => ({ name, label, type: 'number', required: true });

export default function Progression({ actor, abilities, entry, filters, counts, cases, progressions }: Props) {
    const [modal, setModal] = useState<FormSpec>();
    const [message, setMessage] = useState('');
    function propose(kind: string, editing?: Case) {
        if (!entry && !editing) return;
        const evidence = { name: 'evidence', label: 'Référence du dossier ou de la vérification', required: kind === 'external_transfer' };
        const fields: Record<string, Field[]> = {
            interruption: [],
            resumption: [numeric('year_id', 'Année cible (ID)'), numeric('version_id', 'Maquette publiée (ID)')],
            reorientation: [numeric('level_id', 'Niveau cible (ID)'), numeric('version_id', 'Maquette publiée (ID)')],
            external_transfer: [evidence],
            cycle: [numeric('application_id', 'Nouvelle admission validée (ID)')],
            graduation: [evidence],
        };
        setModal({
            title: lifecycleLabels[kind],
            description: 'Un autre agent habilité examine et valide cette proposition.',
            action: editing ? route(prefix + 'revise', { case: editing.id }) : route(prefix + 'propose', { academic: entry?.id }),
            values: editing ? { revision: editing.revision } : { kind, operation_key: crypto.randomUUID() },
            fields: [
                ...fields[kind].map((field) => ({ ...field, value: editing?.requested[field.name] ?? undefined })),
                { ...reason, value: editing?.reason },
            ],
        });
    }
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Progression académique" />
            <main className="mx-auto max-w-6xl space-y-6 p-5">
                <PageHeading title="Progression académique" description="Passages, reprises, transitions et fins de cursus" />
                {message && <p role="status">{message}</p>}
                <form
                    className="flex flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const query = Object.fromEntries(
                            [...new FormData(event.currentTarget)].filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)]),
                        );
                        router.get(route(prefix + 'index'), query);
                    }}
                >
                    <label className="flex flex-col">
                        Inscription (ID)
                        <input name="academic" type="number" min="1" defaultValue={filters.academic} />
                    </label>
                    <label className="flex flex-col">
                        Année source (ID)
                        <input name="year" type="number" min="1" defaultValue={filters.year} />
                    </label>
                    <label className="flex flex-col">
                        Matricule
                        <input name="q" defaultValue={filters.q} />
                    </label>
                    <label className="flex flex-col">
                        Type de dossier
                        <select name="kind" defaultValue={filters.kind || ''}>
                            <option value="">Tous</option>
                            {kinds.map((kind) => (
                                <option key={kind} value={kind}>
                                    {lifecycleLabels[kind]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col">
                        Statut
                        <select name="status" defaultValue={filters.status || ''}>
                            <option value="">Tous</option>
                            {['open', 'correction', 'approved', 'refused'].map((state) => (
                                <option key={state} value={state}>
                                    {lifecycleLabels[state]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button className="admin-primary">Filtrer</button>
                    <Link className="admin-secondary" href={route(prefix + 'index')}>
                        Réinitialiser
                    </Link>
                </form>
                {entry && (
                    <section className="space-y-2 rounded-lg border p-4">
                        <h2 className="font-semibold">
                            {entry.name} · {entry.matricule}
                        </h2>
                        <p>
                            {entry.program} · {entry.level} · {entry.year}
                        </p>
                        <p>
                            {lifecycleLabels[entry.status]}
                            {entry.can_finish && ' · Une règle de fin de cursus s’applique.'}
                        </p>
                        {entry.result && <p>Résultat officiel {entry.result}</p>}
                        <Link
                            className="admin-secondary"
                            href={route('dashboard.admin.student-academic.show', { academic: entry.id, section: 'Parcours' })}
                        >
                            Dossier et décision de passage
                        </Link>
                        {abilities.manage && (
                            <div className="flex flex-wrap gap-2">
                                {kinds.map((kind) => (
                                    <button className="admin-secondary" type="button" key={kind} onClick={() => propose(kind)}>
                                        {lifecycleLabels[kind]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}
                <section className="space-y-3 rounded-lg border p-4">
                    <h2 className="font-semibold">Dossiers de parcours</h2>
                    <p>
                        {['open', 'correction', 'approved', 'refused'].map((state) => `${lifecycleLabels[state]} ${counts[state] ?? 0}`).join(' · ')}
                    </p>
                    {!cases.data.length && <p>Aucun dossier pour ces filtres.</p>}
                    {cases.data.map((item) => (
                        <article key={item.id} className="space-y-2 border-t py-3">
                            <p>
                                <strong>{lifecycleLabels[item.kind]}</strong> · {lifecycleLabels[item.status]} ·{' '}
                                <Link href={route(prefix + 'index', { academic: item.academic_enrollment_id })}>
                                    Inscription {item.academic_enrollment_id}
                                </Link>
                            </p>
                            <p>{item.reason}</p>
                            <p className="text-sm">
                                {item.reference}
                                {item.decided_at && ` · ${new Date(item.decided_at).toLocaleDateString('fr-CD')} · Compte ${item.decided_by}`}
                            </p>
                            {item.requested.evidence && <p>Référence du contrôle · {item.requested.evidence}</p>}
                            {item.response && <p>{item.response}</p>}
                            {item.completion && (
                                <p>
                                    {item.completion.degree} · {(item.completion.credits / 100).toLocaleString('fr-CD')} crédits certifiés
                                </p>
                            )}
                            {item.target_enrollment_id && (
                                <Link href={route('dashboard.admin.student-academic.show', item.target_enrollment_id)}>Inscription cible</Link>
                            )}
                            {item.status === 'correction' && abilities.manage && item.author_id === actor && (
                                <button className="admin-secondary" type="button" onClick={() => propose(item.kind, item)}>
                                    Compléter et soumettre
                                </button>
                            )}
                            {item.status === 'open' && item.author_id !== actor && abilities.approve && (
                                <div className="flex flex-wrap gap-2">
                                    {(['approve', 'correct', 'refuse'] as const)
                                        .filter((action) => action !== 'approve' || item.kind !== 'graduation' || abilities.graduation)
                                        .map((action) => (
                                            <button
                                                className="admin-secondary"
                                                key={action}
                                                type="button"
                                                onClick={() =>
                                                    setModal({
                                                        title:
                                                            action === 'approve'
                                                                ? 'Approuver le dossier'
                                                                : action === 'correct'
                                                                  ? 'Demander une correction'
                                                                  : 'Refuser le dossier',
                                                        description:
                                                            action === 'correct'
                                                                ? 'L’auteur pourra compléter et soumettre le dossier.'
                                                                : 'La décision sera historisée et communiquée à l’étudiant.',
                                                        action: route(prefix + 'decide', { case: item.id }),
                                                        fields: [reason],
                                                        values: { action, revision: item.revision },
                                                    })
                                                }
                                            >
                                                {action === 'approve' ? 'Approuver' : action === 'correct' ? 'Demander une correction' : 'Refuser'}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </article>
                    ))}
                    <Pagination value={cases} />
                </section>
                <section className="space-y-3 rounded-lg border p-4">
                    <h2 className="font-semibold">Décisions et plans de reprise</h2>
                    {!progressions.data.length && <p>Aucune décision pour ces filtres.</p>}
                    {progressions.data.map((item) => (
                        <article key={item.id} className="space-y-2 border-t py-3">
                            <p>
                                {lifecycleLabels[item.kind ?? ''] || 'Décision historique'} · {item.level} · {item.year} ·{' '}
                                <Link href={route(prefix + 'index', { academic: item.academic })}>Inscription {item.academic}</Link>
                            </p>
                            {item.due_on && <p>Échéance {item.due_on}</p>}
                            {item.retakes.map((retake) => (
                                <div key={retake.item_id} className="flex flex-wrap items-center gap-2">
                                    <span>
                                        {retake.unit} · {retake.name}
                                    </span>
                                    {item.assigned_items.includes(retake.item_id) ? (
                                        <span>Inscription pédagogique liée</span>
                                    ) : (
                                        abilities.register &&
                                        item.target_status === 'confirmed' && (
                                            <button
                                                className="admin-secondary"
                                                type="button"
                                                onClick={() =>
                                                    setModal({
                                                        title: 'Rattacher une offre de reprise',
                                                        description: 'Utilisez une offre publiée de l’année et de la maquette cibles.',
                                                        action: route(prefix + 'retake', { progression: item.id }),
                                                        values: { item_id: retake.item_id },
                                                        fields: [numeric('offering_id', 'Offre de cours (ID)'), reason],
                                                    })
                                                }
                                            >
                                                Rattacher une offre
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </article>
                    ))}
                    <Pagination value={progressions} />
                </section>
                {modal && (
                    <AcademicForm
                        spec={modal}
                        onClose={() => setModal(undefined)}
                        onSuccess={(text) => {
                            setMessage(text);
                            setModal(undefined);
                        }}
                    />
                )}
            </main>
        </Dashboard>
    );
}
