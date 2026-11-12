import { Link, usePage, usePoll } from '@inertiajs/react';
import { Bell, CheckCheck, CheckCircle2, FilePenLine, FileUp, GraduationCap, Wallet, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../../css/dashboard/admin-notifications.css';
type Notices = {
    unread_count: number;
    items: {
        id: string;
        reference: string;
        student_name?: string;
        filename: string;
        version: number | null;
        status?: string;
        kind?: 'admission' | 'document' | 'enrollment' | 'finance' | 'schedule' | 'learning' | 'assessment' | 'results' | 'official_document';
        verdict?: string;
        comment?: string | null;
        created_at: string;
        read_at: string | null;
        open_url: string;
    }[];
};
export default function AdminNotifications({ audience = 'admin' }: { audience?: 'admin' | 'student' }) {
    const propName = audience === 'admin' ? 'adminNotifications' : 'studentNotifications';
    const props = usePage<{ adminNotifications: Notices | null; studentNotifications: Notices | null }>().props;
    const notices = props[propName];
    const panelId = `${audience}-notifications-panel`;
    const verdicts: Record<string, { title: string; icon: typeof FileUp }> = {
        accepted: { title: 'Votre pièce a été acceptée', icon: CheckCircle2 },
        rejected: { title: 'Votre pièce a été refusée', icon: XCircle },
        correction_requested: { title: 'Une pièce est à corriger', icon: FilePenLine },
    };
    const [open, setOpen] = useState(false);
    const panel = useRef<HTMLDivElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    usePoll(30000, { only: [propName] });
    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => {
            if (panel.current && !panel.current.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                toggle.current?.focus();
            }
        };
        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', escape);
        return () => {
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', escape);
        };
    }, [open]);
    if (!notices) return null;
    return (
        <div className="admin-notifications" ref={panel}>
            <button
                type="button"
                ref={toggle}
                className="admin-notifications-toggle"
                aria-label={`Notifications, ${notices.unread_count} non lue(s)`}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen(!open)}
            >
                <Bell size={20} />
                {notices.unread_count > 0 && <span>{notices.unread_count > 99 ? '99+' : notices.unread_count}</span>}
            </button>
            {open && (
                <section id={panelId} className="admin-notifications-panel" aria-label="Notifications des inscriptions">
                    <header>
                        <div>
                            <h2>Notifications</h2>
                            <p>
                                {audience === 'admin'
                                    ? 'Les nouvelles pièces de vos candidats.'
                                    : 'Vos inscriptions, justificatifs et opérations financières.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Fermer les notifications"
                            onClick={() => {
                                setOpen(false);
                                toggle.current?.focus();
                            }}
                        >
                            <X size={18} />
                        </button>
                    </header>
                    {notices.unread_count > 0 && (
                        <Link
                            href={audience === 'admin' ? '/dashboard/admin/notifications/read-all' : '/dashboard/notifications/read-all'}
                            method="post"
                            as="button"
                            preserveScroll
                            className="admin-notifications-read-all"
                        >
                            <CheckCheck size={15} />
                            Tout marquer comme lu
                        </Link>
                    )}
                    {notices.items.length ? (
                        <ul>
                            {notices.items.map((notice) => {
                                const verdict = verdicts[notice.verdict || ''];
                                const Icon =
                                    notice.kind === 'finance'
                                        ? Wallet
                                        : notice.kind === 'admission'
                                          ? GraduationCap
                                          : audience === 'student' && verdict
                                            ? verdict.icon
                                            : FileUp;
                                return (
                                    <li key={notice.id} className={notice.read_at ? '' : 'is-unread'}>
                                        <span className="admin-notification-icon">
                                            <Icon size={18} />
                                        </span>
                                        <div>
                                            <strong>
                                                {notice.kind === 'official_document'
                                                    ? ({
                                                          received: 'Demande documentaire reçue',
                                                          correction: 'Demande documentaire à compléter',
                                                          refused: 'Demande documentaire refusée',
                                                          approved: 'Demande documentaire approuvée',
                                                          issued: 'Document émis',
                                                          deliver: 'Remise confirmée',
                                                          revoke: 'Document révoqué',
                                                      }[notice.status ?? ''] ?? 'Suivi documentaire')
                                                    : notice.kind === 'results'
                                                      ? notice.status === 'appeal_decided'
                                                          ? 'Votre recours a reçu une décision'
                                                          : 'Résultats officiels publiés'
                                                      : notice.kind === 'assessment'
                                                        ? ({
                                                              published: 'Évaluation publiée',
                                                              received: 'Travail reçu',
                                                              cancelled: 'Évaluation annulée',
                                                              feedback: 'Correction disponible',
                                                          }[notice.status ?? ''] ?? 'Suivi d’évaluation')
                                                        : notice.kind === 'learning'
                                                          ? 'Nouvelle ressource pédagogique'
                                                          : notice.kind === 'schedule'
                                                            ? ({
                                                                  published: 'Nouvelle séance publiée',
                                                                  changed: 'Séance modifiée',
                                                                  cancelled: 'Séance annulée',
                                                                  rescheduled: 'Séance reportée',
                                                                  absence_submitted: 'Justification reçue',
                                                                  absence_accepted: 'Justification acceptée',
                                                                  absence_refused: 'Justification refusée',
                                                                  absence_correction: 'Justification à compléter',
                                                                  absence_in_review: 'Justification en examen',
                                                              }[notice.status ?? ''] ?? 'Planification mise à jour')
                                                            : audience === 'student'
                                                              ? notice.kind === 'finance'
                                                                  ? ({
                                                                        confirmed: 'Votre versement a été confirmé',
                                                                        cancelled: 'Une écriture de paiement a été annulée',
                                                                        refund_executed: 'Un remboursement a été enregistré comme exécuté',
                                                                    }[notice.status ?? ''] ?? 'Votre situation financière a été mise à jour')
                                                                  : notice.kind === 'enrollment'
                                                                    ? 'Votre situation administrative a été mise à jour'
                                                                    : notice.kind === 'admission'
                                                                      ? 'Bienvenue dans votre espace étudiant'
                                                                      : verdict?.title || 'Votre justificatif a été examiné'
                                                              : 'Une pièce à réexaminer'}
                                            </strong>
                                            <p>
                                                {audience === 'admin' && notice.student_name ? `${notice.student_name} · ` : ''}
                                                {notice.reference}
                                            </p>
                                            {notice.kind !== 'admission' &&
                                                notice.kind !== 'enrollment' &&
                                                notice.kind !== 'finance' &&
                                                notice.kind !== 'schedule' &&
                                                notice.kind !== 'learning' &&
                                                notice.kind !== 'assessment' &&
                                                notice.kind !== 'results' &&
                                                notice.kind !== 'official_document' && (
                                                    <p className="admin-notification-file">
                                                        {notice.filename} · Version {notice.version}
                                                    </p>
                                                )}
                                            {notice.comment && <p className="notification-review-comment">{notice.comment}</p>}
                                            <small>
                                                {new Date(notice.created_at).toLocaleString('fr-FR', {
                                                    timeZone: 'Africa/Kinshasa',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </small>
                                            <Link
                                                href={notice.open_url}
                                                preserveState={false}
                                                method="post"
                                                as="button"
                                                onSuccess={() => setOpen(false)}
                                                className="admin-notification-open"
                                            >
                                                {notice.kind === 'official_document'
                                                    ? 'Ouvrir mes documents'
                                                    : notice.kind === 'results'
                                                      ? 'Consulter mes résultats'
                                                      : notice.kind === 'assessment'
                                                        ? 'Consulter mes activités'
                                                        : notice.kind === 'learning'
                                                          ? 'Consulter les ressources'
                                                          : notice.kind === 'schedule'
                                                            ? 'Ouvrir le suivi'
                                                            : notice.kind === 'finance'
                                                              ? 'Consulter mes transactions'
                                                              : notice.kind === 'enrollment'
                                                                ? 'Consulter mes inscriptions'
                                                                : notice.kind === 'admission'
                                                                  ? 'Accéder à mon espace étudiant'
                                                                  : 'Ouvrir le justificatif'}
                                            </Link>
                                        </div>
                                        {!notice.read_at && <span className="admin-notification-dot" aria-label="Non lue" />}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="admin-notifications-empty">
                            <Bell size={27} strokeWidth={1.4} />
                            <strong>Vous êtes à jour.</strong>
                            <p>
                                {audience === 'admin'
                                    ? 'Le remplacement d’un justificatif apparaîtra ici.'
                                    : 'Les décisions sur vos pièces apparaîtront ici.'}
                            </p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
