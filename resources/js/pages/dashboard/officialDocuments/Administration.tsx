import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { documentLabels, documentReason, type DocumentRequest, type DocumentRow, type Page } from '@/components/student/OfficialDocumentCenter';
import AcademicForm, { type Field, type FormSpec } from '@/pages/dashboard/studentAcademic/AcademicForm';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Type = { id: number; name: string; kind: string; code: string; active: boolean; policy: { copies: boolean } };
type Template = {
    id: number;
    title: string;
    version: number;
    signer_id: number;
    author_id: number;
    approved_at: string | null;
    withdrawn_at: string | null;
    capacity: string;
    body: string;
    assets: string[];
};
type Archive = { id: number; kind: string; reference: string; year: string; revoked_at: string | null };
type Props = {
    actor: number;
    permissions: { manage: boolean; approve: boolean; issue: boolean };
    universities: { id: number; name: string; faculties: { id: number; name: string }[] }[];
    types: Page<Type>;
    type: Type | null;
    templates: Page<Template> | null;
    filters: { academic?: number; type?: number; status?: string; q?: string; kind?: string; archive?: string };
    entry: { id: number; name: string; matricule: string; year: string; types: { id: number; name: string }[] } | null;
    counts: Record<string, number>;
    requests: Page<DocumentRequest & { reason: string }>;
    documents: Page<DocumentRow>;
    archive_counts: Record<string, number>;
    audit: { id: number; actor_id: number; action: string; reason: string | null; created_at: string }[];
    result_archives: Page<Archive> | null;
};

const prefix = 'dashboard.admin.official-documents.';
const kinds = {
    enrollment: 'Attestation d’inscription',
    schooling: 'Certificat de scolarité',
    success: 'Attestation de réussite',
    diploma: 'Diplôme',
    card: 'Carte étudiante',
};
const kindOptions = Object.entries(kinds).map(([value, label]) => ({ value, label }));
const field = (name: string, label: string, type?: string, required = false): Field => ({ name, label, type, required });

export default function Administration({
    actor,
    permissions,
    universities,
    types,
    type,
    templates,
    filters,
    entry,
    counts,
    requests,
    documents,
    archive_counts,
    audit,
    result_archives,
}: Props) {
    const [modal, setModal] = useState<FormSpec>();
    const [message, setMessage] = useState('');
    function action(
        title: string,
        endpoint: string,
        params: Record<string, number> = {},
        values: FormSpec['values'] = {},
        fields: Field[] = [documentReason],
        description = 'Cette action est journalisée.',
    ) {
        setModal({ title, action: route(prefix + endpoint, params), description, values, fields });
    }
    function start(entryId: number, typeId: number, title: string, operation = 'initial', previous: number | null = null) {
        action(
            title,
            'submit',
            { entry: entryId },
            { type_id: typeId, action: operation, previous_id: previous, operation_key: crypto.randomUUID() },
        );
    }
    function transition(ticket: DocumentRequest, operation: string, label: string) {
        action(
            label,
            'transition',
            { ticket: ticket.id },
            { action: operation, revision: ticket.document_revision },
            ticket.kind === 'diploma' && operation === 'approve'
                ? [documentReason, field('mandate', 'Mandat de délivrance', 'textarea', true)]
                : [documentReason],
        );
    }
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Documents officiels" />
            <main className="mx-auto max-w-6xl space-y-6 p-5">
                <PageHeading title="Documents officiels" description="Catalogue, demandes, émission et registre de vérification" />
                {message && <p role="status">{message}</p>}
                <form
                    className="flex flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        router.get(
                            route(prefix + 'index'),
                            Object.fromEntries([...form].filter(([, value]) => value !== '').map(([name, value]) => [name, String(value)])),
                        );
                    }}
                >
                    <label className="flex flex-col">
                        Inscription (ID)
                        <input name="academic" type="number" min="1" defaultValue={filters.academic} />
                    </label>
                    <label className="flex flex-col">
                        Matricule de la demande
                        <input name="q" defaultValue={filters.q} />
                    </label>
                    <label className="flex flex-col">
                        Famille
                        <select name="kind" defaultValue={filters.kind || ''}>
                            <option value="">Toutes</option>
                            {kindOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col">
                        Statut de la demande
                        <select name="status" defaultValue={filters.status || ''}>
                            <option value="">Tous</option>
                            {['open', 'reviewed', 'correction', 'approved', 'refused', 'issued'].map((status) => (
                                <option key={status} value={status}>
                                    {documentLabels[status]}
                                </option>
                            ))}
                        </select>
                    </label>
                    {type && <input type="hidden" name="type" value={type.id} />}
                    <button className="admin-primary" type="submit">
                        Filtrer
                    </button>
                    <Link className="admin-secondary" href={route(prefix + 'index')}>
                        Réinitialiser
                    </Link>
                </form>
                <p>
                    {Object.entries(counts)
                        .map(([status, count]) => `${documentLabels[status]} ${count}`)
                        .join(' · ')}{' '}
                </p>

                <section className="space-y-3 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Catalogue</h2>
                    {permissions.manage && (
                        <button
                            className="admin-primary"
                            type="button"
                            onClick={() =>
                                action('Ajouter un type documentaire', 'type', {}, {}, [
                                    {
                                        ...field('university_id', 'Établissement', 'select', true),
                                        clears: 'faculty_id',
                                        options: universities.map(({ id, name }) => ({ value: id, label: name })),
                                    },
                                    {
                                        ...field('faculty_id', 'Faculté', 'select', true),
                                        optionsFor: (values) =>
                                            universities
                                                .find(({ id }) => id === Number(values.university_id))
                                                ?.faculties.map(({ id, name }) => ({ value: id, label: name })) ?? [],
                                    },
                                    { ...field('kind', 'Famille', 'select', true), options: kindOptions },
                                    field('code', 'Code', 'text', true),
                                    field('name', 'Libellé', 'text', true),
                                    field('student_request', 'Demandes étudiantes', 'checkbox'),
                                    field('download', 'Téléchargement étudiant', 'checkbox'),
                                    field('print', 'Impression autorisée', 'checkbox'),
                                    field('copies', 'Duplicata ou rectification', 'checkbox'),
                                    field('financial_gate', 'Appliquer la règle de délivrance financière', 'checkbox'),
                                    field('valid_days', 'Validité en jours', 'number'),
                                    field('decisions', 'Codes de décision autorisés pour la réussite ou le diplôme'),
                                    field('minimum_credits', 'Crédits requis en centièmes', 'number'),
                                    field('program_id', 'Programme (ID)', 'number'),
                                    field('regulation', 'Référence réglementaire'),
                                    field('retention', 'Règle d’archivage institutionnelle'),
                                    documentReason,
                                ])
                            }
                        >
                            Ajouter un type
                        </button>
                    )}
                    <ul className="space-y-2">
                        {types.data.map((item) => (
                            <li key={item.id}>
                                <Link href={route(prefix + 'index', { ...filters, type: item.id })}>
                                    {item.name} · {item.code}
                                </Link>{' '}
                                · {item.active ? 'Actif' : 'Inactif'}
                            </li>
                        ))}
                    </ul>
                    <Pagination value={types} />
                    {type && (
                        <>
                            <h3 className="font-semibold">Modèles · {type.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                {permissions.approve && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() =>
                                            action(
                                                type.active ? 'Désactiver le type' : 'Activer le type',
                                                'activate',
                                                { type: type.id },
                                                { active: !type.active },
                                            )
                                        }
                                    >
                                        {type.active ? 'Désactiver' : 'Activer'}
                                    </button>
                                )}
                                {permissions.manage && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() =>
                                            action(
                                                'Créer une version',
                                                'template',
                                                { type: type.id },
                                                {},
                                                [
                                                    field('title', 'Titre', 'text', true),
                                                    field('body', 'Texte et variables', 'textarea', true),
                                                    field('signer_id', 'Compte du signataire (ID)', 'number', true),
                                                    field('capacity', 'Qualité du signataire', 'text', true),
                                                    ...(type.kind === 'card'
                                                        ? [
                                                              { ...field('width_mm', 'Largeur (mm)', 'number', true), value: 85.6 },
                                                              { ...field('height_mm', 'Hauteur (mm)', 'number', true), value: 53.98 },
                                                              { ...field('margin_mm', 'Marge (mm)', 'number', true), value: 3 },
                                                          ]
                                                        : []),
                                                    { ...field('color', 'Couleur', 'color'), value: '#203852' },
                                                    ...(type.kind === 'card'
                                                        ? []
                                                        : [
                                                              field('logo', 'Logo PNG', 'file'),
                                                              field('signature', 'Signature visuelle PNG', 'file'),
                                                              field('stamp', 'Cachet visuel PNG', 'file'),
                                                          ]),
                                                    documentReason,
                                                ],
                                                'Variables disponibles avec la syntaxe {{ student }}. Utilisez matricule, institution, faculty, level, program, year, number et issued_on. Pour les résultats, decision, credits, session et degree sont aussi disponibles.',
                                            )
                                        }
                                    >
                                        Nouvelle version
                                    </button>
                                )}
                            </div>
                            {templates?.data.map((template) => (
                                <details key={template.id} className="border-t py-2">
                                    <summary>
                                        Version {template.version} · {template.title} ·{' '}
                                        {template.withdrawn_at ? 'Retirée' : template.approved_at ? 'Approuvée' : 'À approuver'}
                                    </summary>
                                    <p className="whitespace-pre-wrap">{template.body}</p>
                                    <p>
                                        {template.capacity} · compte {template.signer_id}
                                    </p>
                                    <ul className="flex flex-wrap gap-3">
                                        {template.assets.map((asset) => (
                                            <li key={asset}>
                                                <a href={route(prefix + 'template-asset', { template: template.id, asset })}>
                                                    Contrôler le fichier · {asset}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                    {permissions.approve &&
                                        !template.withdrawn_at &&
                                        (template.approved_at || (template.signer_id === actor && template.author_id !== actor)) && (
                                            <button
                                                className="admin-secondary"
                                                type="button"
                                                onClick={() =>
                                                    action(
                                                        template.approved_at ? 'Retirer la version' : 'Approuver la version',
                                                        'template-state',
                                                        { template: template.id },
                                                        { action: template.approved_at ? 'withdraw' : 'approve' },
                                                    )
                                                }
                                            >
                                                {template.approved_at ? 'Retirer' : 'Approuver'}
                                            </button>
                                        )}
                                </details>
                            ))}
                            {templates && <Pagination value={templates} />}
                        </>
                    )}
                </section>
                <section className="space-y-3 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Demandes</h2>
                    {entry && (
                        <p>
                            {entry.name} · {entry.matricule} · {entry.year}
                        </p>
                    )}
                    {entry &&
                        permissions.manage &&
                        entry.types.map((item) => (
                            <button className="admin-secondary" type="button" key={item.id} onClick={() => start(entry.id, item.id, item.name)}>
                                Ouvrir · {item.name}
                            </button>
                        ))}
                    {requests.data.length === 0 && <p>Aucune demande pour ces filtres.</p>}
                    {requests.data.map((ticket) => (
                        <article key={ticket.id} className="space-y-2 border-t py-3">
                            <p>
                                <strong>{ticket.subject}</strong> · {documentLabels[ticket.status]} ·{' '}
                                <Link href={route(prefix + 'index', { ...filters, academic: ticket.academic_enrollment_id })}>
                                    Inscription {ticket.academic_enrollment_id}
                                </Link>
                            </p>
                            <p className="whitespace-pre-wrap">{ticket.reason}</p>
                            {ticket.response && <p>{ticket.response}</p>}
                            <div className="flex flex-wrap gap-2">
                                {['reviewed', 'approved'].includes(ticket.status) && (ticket.kind !== 'diploma' || ticket.status === 'approved') && (
                                    <a className="admin-secondary" href={route(prefix + 'preview', { ticket: ticket.id })}>
                                        Aperçu provisoire
                                    </a>
                                )}
                                {permissions.manage && ticket.status === 'open' && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'review', 'Consigner le contrôle')}
                                    >
                                        Contrôler
                                    </button>
                                )}
                                {permissions.manage && ['open', 'reviewed'].includes(ticket.status) && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'correct', 'Demander une correction')}
                                    >
                                        Demander une correction
                                    </button>
                                )}
                                {permissions.manage && ['open', 'reviewed', 'correction', 'approved'].includes(ticket.status) && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'refuse', 'Refuser la demande')}
                                    >
                                        Refuser
                                    </button>
                                )}
                                {permissions.manage && ticket.status === 'correction' && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'resubmit', 'Consigner le complément')}
                                    >
                                        Consigner le complément
                                    </button>
                                )}
                                {permissions.manage && ticket.status === 'approved' && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'recheck', 'Ouvrir un nouveau contrôle')}
                                    >
                                        Recontrôler
                                    </button>
                                )}
                                {permissions.approve && ticket.status === 'reviewed' && ticket.signer_id === actor && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => transition(ticket, 'approve', 'Approuver la demande')}
                                    >
                                        Approuver
                                    </button>
                                )}
                                {permissions.issue && ticket.status === 'approved' && (
                                    <button
                                        className="admin-primary"
                                        type="button"
                                        onClick={() =>
                                            action(
                                                'Émettre le PDF officiel',
                                                'issue',
                                                { ticket: ticket.id },
                                                { revision: ticket.document_revision },
                                                [],
                                            )
                                        }
                                    >
                                        Émettre
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                    <Pagination value={requests} />
                </section>
                <section className="space-y-3 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">Archives et délivrance</h2>
                    <div className="flex flex-wrap gap-2">
                        <Link className="admin-secondary" href={route(prefix + 'index', { ...filters, archive: undefined })}>
                            Toutes les archives
                        </Link>
                        {Object.entries({
                            print: 'Cartes à imprimer',
                            delivery: 'À remettre',
                            issued: 'Émis',
                            revoked: 'Révoqués',
                            replaced: 'Remplacés',
                        }).map(([archive, label]) => (
                            <Link
                                key={archive}
                                className="admin-secondary"
                                aria-current={filters.archive === archive ? 'page' : undefined}
                                href={route(prefix + 'index', { ...filters, archive })}
                            >
                                {label} · {archive_counts[archive]}
                            </Link>
                        ))}
                    </div>
                    {documents.data.length === 0 && <p>Aucun document émis pour ces filtres.</p>}
                    {documents.data.map((document) => (
                        <article key={document.id} className="space-y-2 border-t py-3">
                            <p>
                                <strong>{document.name}</strong> · {document.number} · {documentLabels[document.validity]} · Inscription{' '}
                                {document.academic_enrollment_id}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <a className="admin-secondary" href={document.verify}>
                                    Vérifier
                                </a>
                                <a className="admin-secondary" href={route(prefix + 'download', { document: document.id })}>
                                    PDF archivé
                                </a>
                                {permissions.manage && document.status !== 'replaced' && document.copies && (
                                    <>
                                        {document.kind !== 'card' && document.status === 'issued' && (
                                            <button
                                                className="admin-secondary"
                                                type="button"
                                                onClick={() =>
                                                    start(
                                                        document.academic_enrollment_id,
                                                        document.official_document_type_id,
                                                        'Ouvrir un duplicata',
                                                        'duplicate',
                                                        document.id,
                                                    )
                                                }
                                            >
                                                Duplicata
                                            </button>
                                        )}
                                        <button
                                            className="admin-secondary"
                                            type="button"
                                            onClick={() =>
                                                start(
                                                    document.academic_enrollment_id,
                                                    document.official_document_type_id,
                                                    'Ouvrir un remplacement',
                                                    'replace',
                                                    document.id,
                                                )
                                            }
                                        >
                                            Remplacer
                                        </button>
                                    </>
                                )}
                                {permissions.issue && document.status === 'issued' && (
                                    <>
                                        {document.printable && !document.printed_at && document.validity !== 'expired' && (
                                            <button
                                                className="admin-secondary"
                                                type="button"
                                                onClick={() =>
                                                    action('Confirmer l’impression', 'lifecycle', { document: document.id }, { action: 'print' })
                                                }
                                            >
                                                Confirmer l’impression
                                            </button>
                                        )}
                                        {!document.delivered_at &&
                                            document.validity !== 'expired' &&
                                            (document.kind !== 'card' || document.printed_at) && (
                                                <button
                                                    className="admin-secondary"
                                                    type="button"
                                                    onClick={() =>
                                                        action('Confirmer la remise', 'lifecycle', { document: document.id }, { action: 'deliver' })
                                                    }
                                                >
                                                    Confirmer la remise
                                                </button>
                                            )}
                                        <button
                                            className="admin-secondary"
                                            type="button"
                                            onClick={() =>
                                                action('Révoquer la référence', 'lifecycle', { document: document.id }, { action: 'revoke' })
                                            }
                                        >
                                            Révoquer
                                        </button>
                                    </>
                                )}
                            </div>
                        </article>
                    ))}
                    <Pagination value={documents} />
                </section>
                {result_archives && (
                    <section className="space-y-3 rounded-lg border p-4">
                        <h2 className="text-lg font-semibold">Archives de résultats</h2>
                        {result_archives.data.map((archive) => (
                            <p className="flex flex-wrap gap-2" key={archive.id}>
                                {({ report: 'Bulletin', transcript: 'Relevé', minutes: 'Procès-verbal' } as Record<string, string>)[archive.kind] ??
                                    archive.kind}{' '}
                                · {archive.year} {archive.revoked_at && '· Révoqué'}
                                <a href={route('official-documents.verify', { reference: archive.reference })}>Vérifier</a>
                                {permissions.issue && !archive.revoked_at && (
                                    <button
                                        className="admin-secondary"
                                        type="button"
                                        onClick={() => action('Révoquer cette archive de résultats', 'revoke-result', { archive: archive.id })}
                                    >
                                        Révoquer
                                    </button>
                                )}
                            </p>
                        ))}
                        <Pagination value={result_archives} />
                    </section>
                )}
                {audit.length > 0 && (
                    <section className="space-y-3 rounded-lg border p-4">
                        <h2 className="text-lg font-semibold">Historique du dossier</h2>
                        <ul className="space-y-2">
                            {audit.map((event) => (
                                <li key={event.id}>
                                    <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleDateString('fr-CD')}</time> · Compte{' '}
                                    {event.actor_id} · {event.action.replace(/^official_document_/, '').replaceAll('_', ' ')}
                                    {event.reason && <p>{event.reason}</p>}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
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
