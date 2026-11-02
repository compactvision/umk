import { formatDate, historyLabels, nextStep, paymentLabels, statusLabels, verdictLabels, type StudentEnrollment } from '@/lib/studentEnrollment';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    ExternalLink,
    FilePenLine,
    FileText,
    GraduationCap,
    History,
    Info,
    Printer,
    UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import '../../../../../css/student-enrollments.css';
import { ReplacementForm } from './ReviewFeedback';

type Props = { enrollment: StudentEnrollment; success?: string };
export default function EnrollmentShowSection({ enrollment, success }: Props) {
    const [tab, setTab] = useState<'details' | 'documents' | 'history'>(enrollment.selected_document_uuid ? 'documents' : 'details');
    useEffect(() => {
        if (enrollment.selected_document_uuid) setTab('documents');
    }, [enrollment.selected_document_uuid]);
    useEffect(() => {
        if (tab === 'documents' && enrollment.selected_document_uuid) {
            window.document.getElementById(`student-document-${enrollment.selected_document_uuid}`)?.scrollIntoView({ block: 'start' });
        }
    }, [tab, enrollment.selected_document_uuid]);
    const documents = enrollment.documents || [];
    const accepted = documents.filter((doc) => doc.review_status === 'accepted').length;
    const corrections = documents.filter((doc) => doc.can_replace).length;
    const history = enrollment.status_history || [];
    const fullName = [enrollment.student?.first_name, enrollment.student?.post_name, enrollment.student?.last_name].filter(Boolean).join(' ');
    const isFinal = ['validated', 'rejected', 'cancelled'].includes(enrollment.status);
    const information = [
        ['Nom déclaré dans le dossier', enrollment.declared_name || fullName],
        ['Email du dossier', enrollment.declared_email || enrollment.student?.email],
        ['Nom du compte', fullName],
        ['Email du compte', enrollment.student?.email],
    ];
    return (
        <div className="student-enrollments student-enrollment-detail">
            <Head title={`Dossier ${enrollment.reference}`} />
            <div className="student-detail-toolbar">
                <Link href="/dashboard/enrollments" className="student-text-button">
                    <ArrowLeft size={16} />
                    Mes inscriptions
                </Link>
                <div>
                    {enrollment.academic_portal_url && (
                        <Link className="student-primary" href={enrollment.academic_portal_url}>
                            <GraduationCap size={17} />
                            Mon espace étudiant
                        </Link>
                    )}
                    {enrollment.status === 'draft' && (
                        <Link className="student-primary" href={`/dashboard/enrollments/${enrollment.uuid}/edit`}>
                            <FilePenLine size={16} />
                            Reprendre le brouillon
                        </Link>
                    )}
                    <button
                        className="student-secondary"
                        onClick={() => {
                            flushSync(() => setTab('details'));
                            window.print();
                        }}
                    >
                        <Printer size={16} />
                        Imprimer le récapitulatif
                    </button>
                </div>
            </div>
            <header className="student-dossier-hero">
                <div>
                    <span className="student-eyebrow">MON DOSSIER · {enrollment.reference}</span>
                    <h1>{enrollment.level?.title || 'Votre candidature'}</h1>
                    <p>
                        {enrollment.level?.faculty?.name || 'Formation à compléter'}
                        {enrollment.academic_year?.title && ` · ${enrollment.academic_year.title}`}
                    </p>
                    <div className="student-hero-badges">
                        <span className={`student-badge is-${enrollment.status}`}>{statusLabels[enrollment.status] || 'Statut à confirmer'}</span>
                        {enrollment.matricule && <span className="student-matricule">Matricule {enrollment.matricule}</span>}
                    </div>
                </div>
                <GraduationCap size={65} strokeWidth={1} aria-hidden="true" />
            </header>
            {success && (
                <p className="student-notice" role="status">
                    {success}
                </p>
            )}
            {enrollment.analysis_completed_at && (
                <p className="student-notice">
                    L’examen de toutes vos pièces est terminé depuis le {formatDate(enrollment.analysis_completed_at)}. Retrouvez les verdicts et les
                    remarques dans vos justificatifs. La décision finale est communiquée séparément.
                </p>
            )}
            <div className="student-detail-layout">
                <div className="student-detail-main">
                    <section className="student-panel student-progress">
                        <header>
                            <h2>
                                <Clock3 size={19} />
                                Le suivi de votre candidature
                            </h2>
                            <p>Votre dossier évolue à chaque étape de son traitement.</p>
                        </header>
                        <ol>
                            {[
                                { title: 'Préparation', caption: 'Informations et pièces', done: enrollment.status !== 'draft' },
                                { title: 'Transmission', caption: 'Envoi au service', done: enrollment.status !== 'draft' },
                                {
                                    title: 'Examen',
                                    caption: enrollment.analysis_completed_at ? 'Vérification terminée' : 'Vérification du dossier',
                                    done: !!enrollment.analysis_started_at || ['validated', 'rejected'].includes(enrollment.status),
                                },
                                { title: 'Décision', caption: isFinal ? statusLabels[enrollment.status] || '' : 'Résultat à venir', done: isFinal },
                            ].map((step, index) => (
                                <li key={step.title} className={step.done ? 'is-complete' : ''}>
                                    <span>{step.done ? <CheckCircle2 size={18} /> : `0${index + 1}`}</span>
                                    <strong>{step.title}</strong>
                                    <small>{step.caption}</small>
                                </li>
                            ))}
                        </ol>
                    </section>
                    <section className="student-panel student-tab-panel">
                        <div className="student-tabs" role="tablist" aria-label="Contenu du dossier">
                            {[
                                { id: 'details' as const, label: 'Informations', icon: UserRound },
                                { id: 'documents' as const, label: `Justificatifs (${documents.length})`, icon: FileText },
                                { id: 'history' as const, label: 'Historique', icon: History },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    id={`tab-${item.id}`}
                                    role="tab"
                                    aria-selected={tab === item.id}
                                    aria-controls={`panel-${item.id}`}
                                    tabIndex={tab === item.id ? 0 : -1}
                                    onKeyDown={(event) => {
                                        const ids = ['details', 'documents', 'history'] as const;
                                        const position = ids.indexOf(item.id);
                                        let next = position;
                                        if (event.key === 'ArrowRight') next = (position + 1) % 3;
                                        else if (event.key === 'ArrowLeft') next = (position + 2) % 3;
                                        else if (event.key === 'Home') next = 0;
                                        else if (event.key === 'End') next = 2;
                                        else return;
                                        event.preventDefault();
                                        setTab(ids[next]);
                                        document.getElementById(`tab-${ids[next]}`)?.focus();
                                    }}
                                    onClick={() => setTab(item.id)}
                                >
                                    <item.icon size={17} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="student-tab-content" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
                            {tab === 'details' && (
                                <>
                                    <section className="student-information-section">
                                        <h2>Vos informations</h2>
                                        <p>Les coordonnées communiquées lors de votre candidature.</p>
                                        <dl className="student-information-grid">
                                            {information.map(([label, value]) => (
                                                <div key={label}>
                                                    <dt>{label}</dt>
                                                    <dd>{value || 'Non renseigné'}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </section>
                                    <section className="student-information-section">
                                        <h2>
                                            <GraduationCap size={20} />
                                            La formation demandée
                                        </h2>
                                        <dl className="student-information-grid">
                                            {[
                                                ['Faculté', enrollment.level?.faculty?.name],
                                                ['Niveau', enrollment.level?.title],
                                                ['Code du niveau', enrollment.level?.code],
                                                ['Année académique', enrollment.academic_year?.title],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <dt>{label}</dt>
                                                    <dd>{value || 'À compléter'}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </section>
                                    <section className="student-information-section">
                                        <h2>
                                            <CalendarDays size={19} />
                                            Les dates de votre dossier
                                        </h2>
                                        <dl className="student-information-grid">
                                            {[
                                                ['Créé le', enrollment.created_at],
                                                ['Dernière mise à jour', enrollment.updated_at],
                                                ['Début de l’analyse', enrollment.analysis_started_at],
                                                ['Fin de vérification des pièces', enrollment.analysis_completed_at],
                                                ['Validation', enrollment.enrolled_at],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <dt>{label}</dt>
                                                    <dd>{value ? formatDate(value) : 'À venir'}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </section>
                                </>
                            )}
                            {tab === 'documents' && (
                                <>
                                    <div className="student-documents-heading">
                                        <div>
                                            <h2>Vos justificatifs</h2>
                                            <p>
                                                {accepted} pièce{accepted > 1 ? 's' : ''} acceptée{accepted > 1 ? 's' : ''} sur {documents.length}{' '}
                                                transmise{documents.length > 1 ? 's' : ''}.
                                            </p>
                                        </div>
                                        {corrections > 0 && <span className="student-badge is-correction_requested">{corrections} à remplacer</span>}
                                    </div>
                                    {documents.length ? (
                                        <div className="student-document-list">
                                            {documents.map((doc) => (
                                                <article
                                                    className={`student-document is-${doc.review_status} ${doc.version > 1 && doc.review_status === 'pending' ? 'is-replacement-pending' : ''} ${enrollment.selected_document_uuid === doc.uuid ? 'is-notification-target' : ''}`}
                                                    id={`student-document-${doc.uuid}`}
                                                    key={`${doc.uuid}-${doc.version}`}
                                                >
                                                    <header>
                                                        <FileText size={22} strokeWidth={1.5} />
                                                        <div>
                                                            <h3>{doc.label || doc.name}</h3>
                                                            {doc.label && <p>{doc.name}</p>}
                                                            <p>
                                                                Version {doc.version} {doc.size_human && `· ${doc.size_human}`} · Ajoutée le{' '}
                                                                {formatDate(doc.uploaded_at)}
                                                            </p>
                                                        </div>
                                                        <span className={`student-badge is-${doc.review_status}`}>
                                                            {doc.version > 1 && doc.review_status === 'pending'
                                                                ? 'Nouvelle version · À réexaminer'
                                                                : verdictLabels[doc.review_status] || 'À examiner'}
                                                        </span>
                                                    </header>
                                                    {doc.review_comment && (
                                                        <div className="student-document-comment">
                                                            <strong>Remarque du service</strong>
                                                            <p>{doc.review_comment}</p>
                                                        </div>
                                                    )}
                                                    <div className="student-document-actions">
                                                        {doc.preview_url && (
                                                            <a
                                                                href={doc.preview_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="student-secondary"
                                                            >
                                                                <ExternalLink size={16} />
                                                                Ouvrir la pièce
                                                            </a>
                                                        )}
                                                        {doc.url && (
                                                            <a href={doc.url} className="student-secondary">
                                                                <Download size={16} />
                                                                Télécharger la pièce
                                                            </a>
                                                        )}
                                                        {doc.review_status === 'accepted' && doc.verified_at && (
                                                            <small>Acceptée le {formatDate(doc.verified_at)}</small>
                                                        )}
                                                    </div>
                                                    {doc.can_replace && (
                                                        <ReplacementForm document={doc} limit={enrollment.document_upload_max_kb || 2048} />
                                                    )}
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="student-empty student-empty-compact">
                                            <FileText size={30} />
                                            <h3>Aucun justificatif transmis</h3>
                                            <p>
                                                {enrollment.status === 'draft'
                                                    ? 'Reprenez votre brouillon pour ajouter les pièces de votre candidature.'
                                                    : 'Aucune pièce n’est associée à ce dossier.'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            {tab === 'history' && (
                                <>
                                    <h2>L’historique de votre candidature</h2>
                                    <p className="student-muted">Les actions et décisions enregistrées sur votre dossier.</p>
                                    {history.length ? (
                                        <ol className="student-timeline">
                                            {history.map((event) => (
                                                <li key={event.id}>
                                                    <span>
                                                        <History size={16} />
                                                    </span>
                                                    <div>
                                                        <h3>{historyLabels[event.status] || 'Mise à jour du dossier'}</h3>
                                                        <small>
                                                            {formatDate(event.created_at, true)} · {event.user?.name || 'Service des inscriptions'}
                                                        </small>
                                                        {event.document_name && (
                                                            <p>
                                                                {event.document_name}
                                                                {event.verdict && ` · ${verdictLabels[event.verdict] || event.verdict}`}
                                                            </p>
                                                        )}
                                                        {event.notes && <p>{event.notes}</p>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="student-empty student-empty-compact">
                                            <History size={30} />
                                            <h3>Aucune étape enregistrée pour le moment</h3>
                                            <p>Les prochaines actions du service apparaîtront ici.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>
                <aside className="student-detail-aside">
                    <section className="student-panel student-next-step">
                        <span className="student-eyebrow">LA PROCHAINE ÉTAPE</span>
                        <h2>
                            {enrollment.status === 'draft'
                                ? 'Préparez votre candidature.'
                                : corrections > 0
                                  ? 'Complétez vos justificatifs.'
                                  : isFinal
                                    ? 'Votre décision est disponible.'
                                    : 'Gardez le fil.'}
                        </h2>
                        <p>{nextStep(enrollment)}</p>
                        {enrollment.status === 'draft' ? (
                            <Link className="student-primary" href={`/dashboard/enrollments/${enrollment.uuid}/edit`}>
                                Continuer mon inscription
                                <ArrowLeft className="student-arrow-forward" size={16} />
                            </Link>
                        ) : (
                            <button
                                className="student-secondary"
                                onClick={() => {
                                    setTab(corrections > 0 ? 'documents' : 'history');
                                    document.querySelector('.student-tab-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    document.getElementById(`tab-${corrections > 0 ? 'documents' : 'history'}`)?.focus({ preventScroll: true });
                                }}
                            >
                                {corrections > 0 ? 'Corriger mes pièces' : 'Voir le suivi'}
                            </button>
                        )}
                        {(enrollment.rejection_reason || enrollment.notes) && (
                            <div className="student-decision-note">
                                <strong>{enrollment.status === 'rejected' ? 'Motif de la décision' : 'Message du service'}</strong>
                                <p>{enrollment.rejection_reason || enrollment.notes}</p>
                            </div>
                        )}
                    </section>
                    <section className="student-panel student-payment">
                        <h2>
                            <CreditCard size={19} />
                            Situation de paiement
                        </h2>
                        <strong>{paymentLabels[enrollment.payment_status || 'unpaid'] || 'À confirmer'}</strong>
                        {enrollment.financial_portal_url && (
                            <Link className="student-secondary" href={enrollment.financial_portal_url}>
                                Consulter mes frais
                                <CreditCard size={15} />
                            </Link>
                        )}
                        <p>
                            La validation du dossier et le règlement des frais sont deux étapes distinctes. Suivez les modalités communiquées par
                            l’université.
                        </p>
                    </section>
                    <section className="student-help">
                        <Info size={18} />
                        <p>
                            Pour toute question au service des inscriptions, indiquez la référence <strong>{enrollment.reference}</strong>.
                        </p>
                    </section>
                </aside>
            </div>
        </div>
    );
}
