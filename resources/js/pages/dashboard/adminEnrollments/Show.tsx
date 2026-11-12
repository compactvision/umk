import FeedbackToast, { type ToastFeedback } from '@/components/admin/FeedbackToast';
import PageHeading from '@/components/admin/PageHeading';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock3, Download, ExternalLink, FilePenLine, FileText, History, Mail, Play, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../../../css/admin-enrollments.css';
import DocumentReview from './DocumentReview';
import { applicantName, documentReviewLabels, formatDate, statusLabels, type Dossier } from './types';
export default function Show({ enrollment, success }: { enrollment: Dossier; success?: string }) {
    const [toast, setToast] = useState<ToastFeedback | null>(success ? { id: 0, message: success, tone: 'success' } : null);
    const toastSequence = useRef(0);
    const announce = (message: string, tone: 'success' | 'error' = 'success') => setToast({ id: ++toastSequence.current, message, tone });
    const [selected, setSelected] = useState(
        enrollment.selected_document_uuid ||
            enrollment.documents?.find((doc) => doc.needs_reexamination)?.uuid ||
            enrollment.documents?.[0]?.uuid ||
            '',
    );
    useEffect(() => {
        if (enrollment.selected_document_uuid) {
            setSelected(enrollment.selected_document_uuid);
        }
    }, [enrollment.selected_document_uuid]);
    useEffect(() => {
        if (enrollment.selected_document_uuid && selected === enrollment.selected_document_uuid) {
            window.document.getElementById(`review-document-${selected}`)?.scrollIntoView({ block: 'start' });
        }
    }, [selected, enrollment.selected_document_uuid]);
    const [decision, setDecision] = useState<'validate' | 'reject' | null>(null);
    const [reviewed, setReviewed] = useState(false);
    const dialog = useRef<HTMLDialogElement>(null);
    const trigger = useRef<HTMLElement | null>(null);
    const form = useForm({ reason: '' });
    const reviewAction = useForm({});
    const analysisStarted = Boolean(enrollment.analysis_started_at);
    const proofs = enrollment.documents || [];
    const acceptedProofs = proofs.filter((proof) => proof.review_status === 'accepted').length;
    const correctionProofs = proofs.filter((proof) => ['rejected', 'correction_requested'].includes(proof.review_status));
    const allProofsAccepted = proofs.every((proof) => proof.review_status === 'accepted');
    const document = enrollment.documents?.find((item) => item.uuid === selected);
    const canDecide = ['submitted', 'pending'].includes(enrollment.status);
    useEffect(() => {
        if (decision) dialog.current?.showModal();
        else {
            dialog.current?.close();
            trigger.current?.focus();
        }
    }, [decision]);
    const openDecision = (value: 'validate' | 'reject', button: HTMLElement) => {
        trigger.current = button;
        form.clearErrors();
        setReviewed(false);
        setDecision(value);
    };
    const closeDecision = () => {
        if (!form.processing) setDecision(null);
    };
    const previewable = document && ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(document.mime);
    return (
        <Dashboard hideAppsNavigation>
            {toast && <FeedbackToast key={toast.id} feedback={toast} onDismiss={() => setToast(null)} />}
            <Head title={`Dossier de ${applicantName(enrollment.student)}`} />
            <div className="admin-enrollments">
                <PageHeading
                    title={applicantName(enrollment.student)}
                    description={`Référence ${enrollment.reference} · Créé le ${formatDate(enrollment.created_at)}`}
                    action={<span className={`review-status is-${enrollment.status}`}>{enrollment.status_label}</span>}
                />
                {enrollment.documents?.some((doc) => doc.needs_reexamination) && (
                    <div className="review-reexamination-banner">
                        <div>
                            <strong>De nouvelles versions attendent votre examen</strong>
                            <p>Les pièces signalées « À réexaminer » ont été remplacées par le candidat.</p>
                        </div>
                        <button
                            className="review-secondary"
                            onClick={() => {
                                const doc = enrollment.documents?.find((item) => item.needs_reexamination);
                                if (doc) setSelected(doc.uuid);
                                window.document.querySelector('.review-document-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        >
                            Examiner les nouvelles pièces
                        </button>
                    </div>
                )}
                {Object.entries(reviewAction.errors).map(([key, error]) => (
                    <p className="review-error" role="alert" key={key}>
                        {String(error)}
                    </p>
                ))}
                <div className="review-workflow">
                    <div className={analysisStarted ? 'is-complete' : ''}>
                        <span>01</span>
                        <strong>Commencer l’analyse</strong>
                    </div>
                    <div className={analysisStarted && allProofsAccepted ? 'is-complete' : ''}>
                        <span>02</span>
                        <strong>Examiner les pièces</strong>
                    </div>
                    <div className={['validated', 'rejected'].includes(enrollment.status) ? 'is-complete' : ''}>
                        <span>03</span>
                        <strong>Prendre une décision</strong>
                    </div>
                </div>
                <div className="review-detail-grid">
                    <div className="review-detail-main">
                        <section className="review-panel">
                            <header>
                                <h2>Le dossier de candidature</h2>
                            </header>
                            <dl className="review-information">
                                {[
                                    ['Nom déclaré', enrollment.snapshot?.name || applicantName(enrollment.student)],
                                    ['Email du dossier', enrollment.snapshot?.email || enrollment.student?.email || '—'],
                                    ['Email du compte', enrollment.student?.email || '—'],
                                    ['Faculté', enrollment.level?.faculty?.name || '—'],
                                    ['Niveau', enrollment.level?.title || '—'],
                                    ['Année académique', enrollment.academic_year?.title || '—'],
                                    ['Soumission', enrollment.submitted_at ? formatDate(enrollment.submitted_at) : '—'],
                                    ['Programme', enrollment.requested_program || enrollment.snapshot?.program || '—'],
                                    [
                                        'Certification de l’étudiant',
                                        enrollment.snapshot?.isConfirmed ? 'Informations certifiées par l’étudiant' : 'Non confirmée',
                                    ],
                                    ['Paiement', enrollment.payment_status_label || '—'],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                        <section className="review-panel review-document-panel">
                            <header>
                                <h2>Pièces jointes</h2>
                                <span>{enrollment.documents?.length || 0} document(s)</span>
                            </header>
                            {enrollment.documents?.length ? (
                                <>
                                    <div className="review-document-tabs" role="group" aria-label="Documents du dossier">
                                        {enrollment.documents.map((item) => (
                                            <button
                                                type="button"
                                                key={item.uuid}
                                                className={`is-${item.review_status} ${selected === item.uuid ? 'is-active' : ''} ${item.needs_reexamination ? 'needs-reexamination' : ''}`}
                                                onClick={() => setSelected(item.uuid)}
                                                aria-pressed={selected === item.uuid}
                                            >
                                                {item.review_status === 'accepted' ? (
                                                    <CheckCircle2 size={18} />
                                                ) : item.review_status === 'rejected' ? (
                                                    <XCircle size={18} />
                                                ) : item.review_status === 'correction_requested' ? (
                                                    <FilePenLine size={18} />
                                                ) : (
                                                    <Clock3 size={18} />
                                                )}
                                                <span>
                                                    {item.filename}
                                                    <span className={`review-proof-status is-${item.review_status}`}>
                                                        {documentReviewLabels[item.review_status]}
                                                    </span>
                                                    {item.needs_reexamination && (
                                                        <span className="review-new-version">Nouvelle version {item.version} · À réexaminer</span>
                                                    )}
                                                    <small>
                                                        Version {item.version} · {item.size_human} · {formatDate(item.created_at)}
                                                    </small>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {document && (
                                        <div className="review-document-view" id={`review-document-${document.uuid}`}>
                                            <div className="review-document-toolbar">
                                                <strong>
                                                    {document.filename}
                                                    {document.needs_reexamination && (
                                                        <span className="review-new-version">Version {document.version} · À réexaminer</span>
                                                    )}
                                                </strong>
                                                <div>
                                                    {previewable && (
                                                        <a href={document.preview_url} target="_blank" rel="noopener noreferrer">
                                                            Ouvrir <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                    <a href={document.download_url}>
                                                        Télécharger <Download size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                            {previewable ? (
                                                document.mime.startsWith('image/') ? (
                                                    <img src={document.preview_url} alt={`Document joint : ${document.filename}`} />
                                                ) : (
                                                    <iframe title={`Aperçu de ${document.filename}`} src={document.preview_url} />
                                                )
                                            ) : (
                                                <div className="review-empty">
                                                    <FileText size={30} />
                                                    <p>L’aperçu de ce format n’est pas disponible. Téléchargez le fichier pour le consulter.</p>
                                                </div>
                                            )}
                                            <DocumentReview
                                                key={`${document.uuid}-${document.version}-${document.review_status}-${document.review_comment || ''}`}
                                                document={document}
                                                enrollmentId={enrollment.id}
                                                enabled={canDecide && analysisStarted}
                                                onFeedback={announce}
                                                closed={!canDecide}
                                            />
                                            <p className="review-file-help">
                                                Si le fichier ne s’affiche pas, ouvrez-le dans un nouvel onglet ou téléchargez-le.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="review-empty">
                                    <FileText size={30} />
                                    <h3>Aucune pièce jointe.</h3>
                                    <p>Vérifiez la complétude du dossier avant de prendre une décision.</p>
                                </div>
                            )}
                        </section>
                        <section className="review-panel">
                            <header>
                                <h2>
                                    <History size={19} /> Historique des décisions
                                </h2>
                            </header>
                            {enrollment.events?.length ? (
                                <ol className="review-history">
                                    {enrollment.events.map((event) => (
                                        <li key={event.id}>
                                            <span className={`review-status is-${event.event}`}>{statusLabels[event.event] || event.event}</span>
                                            <div>
                                                <strong>{event.actor || 'Administration USK'}</strong>
                                                <small>{formatDate(event.occurred_at)}</small>
                                                {event.document_name && (
                                                    <p>
                                                        {event.document_name}
                                                        {event.verdict ? ` · ${documentReviewLabels[event.verdict] || event.verdict}` : ''}
                                                    </p>
                                                )}
                                                {event.notification && (
                                                    <p>
                                                        {(
                                                            {
                                                                analysis_started: 'Début de l’analyse',
                                                                analysis_completed: 'Compte rendu de vérification',
                                                                document_replaced_admin: 'Nouvelle pièce · Notification à l’administration',
                                                                corrections_requested: 'Demande de corrections',
                                                                validated: 'Validation',
                                                                rejected: 'Rejet',
                                                            } as Record<string, string>
                                                        )[event.notification] || event.notification}
                                                    </p>
                                                )}
                                                {event.reason && <p>{event.reason}</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="review-muted">Aucune décision administrative enregistrée.</p>
                            )}
                        </section>
                    </div>
                    <aside className="review-decision-card">
                        <span>EXAMEN DE LA DEMANDE</span>
                        <h2>Votre décision compte.</h2>
                        <p>Examinez les informations et les pièces jointes avant de vous prononcer.</p>
                        {canDecide && !analysisStarted && (
                            <div className="review-start-analysis">
                                <button
                                    className="admin-primary"
                                    disabled={reviewAction.processing}
                                    onClick={() =>
                                        reviewAction.post(`/dashboard/admin/enrollments/${enrollment.id}/start-analysis`, {
                                            preserveScroll: true,
                                            onSuccess: (page) => announce(String(page.props.success || 'Analyse commencée.')),
                                            onError: (errors) => announce(String(Object.values(errors)[0] || 'Action impossible.'), 'error'),
                                        })
                                    }
                                >
                                    <Play size={17} />
                                    {reviewAction.processing ? 'Démarrage…' : 'Commencer l’analyse'}
                                </button>
                                <small>L’étudiant sera informé par email du début de l’examen.</small>
                            </div>
                        )}
                        {analysisStarted && (
                            <div className="review-proof-summary">
                                <strong>
                                    {acceptedProofs} / {proofs.length} pièce(s) acceptée(s)
                                </strong>
                                <span>Analyse commencée le {formatDate(enrollment.analysis_started_at)}</span>
                                {enrollment.analysis_completed_at && (
                                    <span>Pièces examinées le {formatDate(enrollment.analysis_completed_at)} · Compte rendu automatique</span>
                                )}
                            </div>
                        )}
                        {canDecide && analysisStarted ? (
                            <>
                                {correctionProofs.length > 0 && (
                                    <button
                                        className="review-secondary"
                                        disabled={reviewAction.processing}
                                        onClick={() =>
                                            reviewAction.post(`/dashboard/admin/enrollments/${enrollment.id}/request-corrections`, {
                                                preserveScroll: true,
                                                onSuccess: (page) => announce(String(page.props.success || 'Demande de corrections enregistrée.')),
                                                onError: (errors) => announce(String(Object.values(errors)[0] || 'Action impossible.'), 'error'),
                                            })
                                        }
                                    >
                                        <Mail size={17} />
                                        Demander les corrections ({correctionProofs.length})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={!allProofsAccepted || reviewAction.processing}
                                    className="admin-primary"
                                    onClick={(e) => openDecision('validate', e.currentTarget)}
                                >
                                    <CheckCircle2 size={17} /> Valider le dossier
                                </button>
                                <button type="button" className="review-reject" onClick={(e) => openDecision('reject', e.currentTarget)}>
                                    <XCircle size={17} /> Rejeter la demande
                                </button>
                                {!allProofsAccepted && <small>Acceptez chaque pièce jointe avant de valider le dossier.</small>}
                                <small>La décision sera enregistrée dans l’historique et communiquée à l’étudiant par email.</small>
                            </>
                        ) : (
                            <div className="review-final-state">
                                <span className={`review-status is-${enrollment.status}`}>{enrollment.status_label}</span>
                                <p>
                                    {enrollment.status === 'draft'
                                        ? 'Ce dossier est encore en cours de préparation. Attendez sa soumission avant de le traiter.'
                                        : !analysisStarted && canDecide
                                          ? 'Commencez l’analyse pour examiner les pièces et prendre une décision.'
                                          : 'Ce dossier ne peut plus faire l’objet d’une nouvelle décision.'}
                                </p>
                            </div>
                        )}
                        {enrollment.decision_reason && (
                            <div className="review-rejection-reason">
                                <strong>Motif communiqué à l’étudiant</strong>
                                <p>{enrollment.decision_reason}</p>
                            </div>
                        )}
                    </aside>
                </div>
                <dialog
                    ref={dialog}
                    className="review-dialog"
                    aria-labelledby="review-decision-title"
                    onCancel={(e) => {
                        e.preventDefault();
                        closeDecision();
                    }}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!decision || !reviewed) return;
                            form.post(`/dashboard/admin/enrollments/${enrollment.id}/${decision}`, {
                                preserveScroll: true,
                                onSuccess: (page) => {
                                    announce(String(page.props.success || 'Décision enregistrée.'));
                                    setDecision(null);
                                    form.reset();
                                },
                            });
                        }}
                    >
                        <span className="review-dialog-eyebrow">CONFIRMATION DE LA DÉCISION</span>
                        <h2 id="review-decision-title">{decision === 'reject' ? 'Motiver le rejet.' : 'Valider cette candidature ?'}</h2>
                        <p>
                            {applicantName(enrollment.student)} · {enrollment.level?.title}
                        </p>
                        {decision === 'reject' && (
                            <div className="review-reason-field">
                                <label htmlFor="rejection-reason">
                                    Motif du rejet <span>(obligatoire)</span>
                                </label>
                                <textarea
                                    id="rejection-reason"
                                    required
                                    minLength={3}
                                    maxLength={1000}
                                    rows={5}
                                    value={form.data.reason}
                                    onChange={(e) => form.setData('reason', e.target.value)}
                                    placeholder="Expliquez clairement pourquoi la demande ne peut pas être acceptée…"
                                    aria-invalid={!!form.errors.reason}
                                    aria-describedby="rejection-help"
                                />
                                <small id="rejection-help">Ce texte sera visible par l’étudiant. {form.data.reason.length}/1000 caractères.</small>
                                {form.errors.reason && (
                                    <p className="review-error" role="alert">
                                        {form.errors.reason}
                                    </p>
                                )}
                            </div>
                        )}
                        {Object.entries(form.errors)
                            .filter(([key]) => key !== 'reason')
                            .map(([key, error]) => (
                                <p className="review-error" role="alert" key={key}>
                                    {String(error)}
                                </p>
                            ))}
                        <label className="review-attestation">
                            <input type="checkbox" checked={reviewed} required onChange={(e) => setReviewed(e.target.checked)} />
                            J’ai examiné les informations et les documents de ce dossier.
                        </label>
                        <div className="review-dialog-actions">
                            <button type="button" className="review-secondary" disabled={form.processing} onClick={closeDecision}>
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className={decision === 'reject' ? 'review-reject' : 'admin-primary'}
                                disabled={form.processing || !reviewed}
                            >
                                {form.processing ? 'Enregistrement…' : decision === 'reject' ? 'Confirmer le rejet' : 'Confirmer la validation'}
                            </button>
                        </div>
                    </form>
                </dialog>
            </div>
        </Dashboard>
    );
}
