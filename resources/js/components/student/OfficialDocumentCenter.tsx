import Pagination from '@/components/admin/Pagination';
import AcademicForm, { type FormSpec } from '@/pages/dashboard/studentAcademic/AcademicForm';
import { useState } from 'react';

export type Page<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[] };
export type DocumentRow = {
    id: number;
    academic_enrollment_id: number;
    official_document_type_id: number;
    number: string;
    name: string;
    kind: string;
    status: string;
    validity: string;
    verify: string;
    printable: boolean;
    copies: boolean;
    printed_at: string | null;
    delivered_at: string | null;
    download?: string | null;
};
export type DocumentRequest = {
    id: number;
    academic_enrollment_id: number;
    subject: string;
    kind: string;
    status: string;
    response: string | null;
    document_revision: number;
    signer_id: number | null;
    resubmit_allowed: boolean;
};
export type DocumentCenter = {
    can_request: boolean;
    types: { id: number; name: string; kind: string; copies: boolean }[];
    requests: Page<DocumentRequest>;
    documents: Page<DocumentRow>;
    results: { reference: string; session: string; edition: number; report: string; transcript: string }[];
};

export const documentLabels: Record<string, string> = {
    open: 'Reçue',
    reviewed: 'Contrôlée',
    correction: 'À compléter',
    approved: 'Approuvée',
    refused: 'Refusée',
    issued: 'Émis',
    valid: 'Valide',
    expired: 'Expiré',
    pending: 'En attente de remise',
    revoked: 'Révoqué',
    replaced: 'Remplacé',
    unknown: 'Inconnu',
};
export const documentReason = { name: 'reason', label: 'Motif', type: 'textarea', required: true };

export default function OfficialDocumentCenter({ data, academic }: { data: DocumentCenter; academic: number }) {
    const [modal, setModal] = useState<FormSpec>();
    const [message, setMessage] = useState('');
    const prefix = 'dashboard.student.official-documents.';
    const submit = (type: DocumentCenter['types'][number], action: string, previous?: number) => {
        setModal({
            title: type.name,
            description: action === 'initial' ? 'Décrivez votre demande.' : 'Indiquez la raison de la nouvelle édition.',
            action: route(prefix + 'submit', { academic }),
            fields: [documentReason],
            values: { type_id: type.id, action, previous_id: previous ?? null, operation_key: crypto.randomUUID() },
            submitLabel: 'Envoyer',
        });
    };
    const existingTypes = new Set(data.documents.data.map((document) => document.official_document_type_id));

    return (
        <section className="student-panel space-y-4">
            <h2>Mes documents officiels</h2>
            {message && <p role="status">{message}</p>}
            {!data.can_request && <p>La règle de délivrance de cette inscription ne permet pas les nouvelles demandes.</p>}
            {data.types
                .filter((type) => !existingTypes.has(type.id))
                .map((type) => (
                    <button key={type.id} className="admin-secondary" type="button" onClick={() => submit(type, 'initial')}>
                        Demander · {type.name}
                    </button>
                ))}
            {data.requests.data.length > 0 && <h3>Suivi des demandes</h3>}
            <ul className="space-y-2">
                {data.requests.data.map((ticket) => (
                    <li key={ticket.id}>
                        <strong>{ticket.subject}</strong> · {documentLabels[ticket.status]}
                        {ticket.response && <p>{ticket.response}</p>}
                        {ticket.status === 'correction' && ticket.resubmit_allowed && (
                            <button
                                className="admin-secondary"
                                type="button"
                                onClick={() =>
                                    setModal({
                                        title: 'Compléter la demande',
                                        description: 'Répondez au service documentaire.',
                                        action: route(prefix + 'transition', { ticket: ticket.id, academic }),
                                        fields: [documentReason],
                                        values: { action: 'resubmit', revision: ticket.document_revision },
                                    })
                                }
                            >
                                Compléter
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            <Pagination value={data.requests} />
            {data.documents.data.length > 0 && <h3>Documents émis</h3>}
            <ul className="space-y-2">
                {data.documents.data.map((document) => {
                    const type = data.types.find((item) => item.id === document.official_document_type_id);
                    return (
                        <li key={document.id} className="flex flex-wrap items-center gap-2">
                            <strong>{document.name}</strong> · {document.number} · {documentLabels[document.validity]}
                            <a href={document.verify}>Vérifier</a>
                            {document.download && <a href={document.download}>Télécharger le PDF</a>}
                            {type?.copies && document.status !== 'replaced' && (
                                <>
                                    {document.status === 'issued' && type.kind !== 'card' && (
                                        <button className="admin-secondary" type="button" onClick={() => submit(type, 'duplicate', document.id)}>
                                            Demander un duplicata
                                        </button>
                                    )}
                                    <button className="admin-secondary" type="button" onClick={() => submit(type, 'replace', document.id)}>
                                        Demander {type.kind === 'card' ? 'un remplacement' : 'une rectification'}
                                    </button>
                                </>
                            )}
                        </li>
                    );
                })}
            </ul>
            <Pagination value={data.documents} />
            {data.results.length > 0 && <h3>Bulletins et relevés de résultats</h3>}
            <ul className="space-y-2">
                {data.results.map((result) => (
                    <li key={result.reference} className="flex flex-wrap gap-2">
                        {result.session} · édition {result.edition}
                        <a href={result.report}>Bulletin PDF</a>
                        <a href={result.transcript}>Relevé PDF</a>
                    </li>
                ))}
            </ul>
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
        </section>
    );
}
