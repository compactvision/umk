import { useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, FilePenLine, LoaderCircle, Save, XCircle } from 'lucide-react';
import { documentReviewLabels, type Dossier } from './types';
type ReviewDocument = NonNullable<Dossier['documents']>[number];
const options = [
    { value: 'pending', label: 'À examiner', icon: Clock3 },
    { value: 'accepted', label: 'Accepter', icon: CheckCircle2 },
    { value: 'correction_requested', label: 'À corriger', icon: FilePenLine },
    { value: 'rejected', label: 'Refuser la pièce', icon: XCircle },
] as const;
export default function DocumentReview({
    document,
    enrollmentId,
    enabled,
    onFeedback,
    closed = false,
}: {
    document: ReviewDocument;
    enrollmentId: number;
    enabled: boolean;
    closed?: boolean;
    onFeedback: (message: string, tone: 'success' | 'error') => void;
}) {
    const form = useForm({ verdict: document.review_status || 'pending', reason: document.review_comment || '' });
    const requiresReason = ['rejected', 'correction_requested'].includes(form.data.verdict);
    return (
        <section className={`review-proof-decision is-${document.review_status}`} aria-label="Décision sur la pièce sélectionnée">
            <header>
                <div>
                    <span>EXAMEN DU JUSTIFICATIF · VERSION {document.version}</span>
                    <h3>{document.needs_reexamination ? 'Nouvelle version : enregistrez un nouveau verdict.' : 'Quelle suite pour cette pièce ?'}</h3>
                </div>
                <span className={`review-proof-status is-${document.review_status}`}>{documentReviewLabels[document.review_status]}</span>
            </header>
            {enabled ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!form.processing)
                            form.post(`/dashboard/admin/enrollments/${enrollmentId}/documents/${document.uuid}/review`, {
                                preserveScroll: true,
                                onSuccess: () =>
                                    onFeedback(
                                        `${document.filename} : ${documentReviewLabels[form.data.verdict] || 'verdict enregistré'}.`,
                                        'success',
                                    ),
                                onError: (errors) =>
                                    onFeedback(Object.values(errors)[0] || 'Le verdict n’a pas pu être enregistré. Veuillez réessayer.', 'error'),
                            });
                    }}
                >
                    <fieldset disabled={form.processing}>
                        <legend className="sr-only">Choisir un verdict pour cette pièce</legend>
                        <div className="review-verdict-options">
                            {options.map((option) => (
                                <label key={option.value}>
                                    <input
                                        type="radio"
                                        name={`verdict-${document.uuid}`}
                                        value={option.value}
                                        checked={form.data.verdict === option.value}
                                        onChange={() => form.setData('verdict', option.value)}
                                    />
                                    <span>
                                        <option.icon size={17} />
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <label className="review-proof-label" htmlFor={`proof-reason-${document.uuid}`}>
                            Remarque à l’étudiant {requiresReason ? '(obligatoire)' : '(facultatif)'}
                        </label>
                        <textarea
                            id={`proof-reason-${document.uuid}`}
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                            rows={3}
                            maxLength={1000}
                            required={requiresReason}
                            minLength={requiresReason ? 3 : undefined}
                            placeholder="Expliquez le résultat de votre examen et, si nécessaire, ce que l’étudiant doit corriger…"
                        />
                        <small>
                            Cette remarque est visible par l’étudiant. Dès que toutes les pièces sont examinées, un compte rendu lui est envoyé
                            automatiquement.
                        </small>
                        {Object.entries(form.errors).map(([key, error]) => (
                            <p key={key} role="alert" className="review-error">
                                {error}
                            </p>
                        ))}
                        <button className="review-secondary" disabled={form.processing} type="submit">
                            {form.processing ? <LoaderCircle className="review-saving-spinner" size={15} /> : <Save size={15} />}
                            {form.processing
                                ? 'Enregistrement…'
                                : form.data.verdict === 'accepted'
                                  ? 'Accepter cette pièce'
                                  : form.data.verdict === 'correction_requested'
                                    ? 'Demander une correction'
                                    : form.data.verdict === 'rejected'
                                      ? 'Enregistrer le refus'
                                      : 'Enregistrer le verdict'}
                        </button>
                    </fieldset>
                </form>
            ) : (
                <div className="review-proof-readonly">
                    <p>
                        {document.review_comment ||
                            (closed
                                ? 'Ce dossier est clôturé. Les pièces et leurs verdicts restent consultables.'
                                : 'Commencez l’analyse pour examiner cette pièce.')}
                    </p>
                </div>
            )}
        </section>
    );
}
