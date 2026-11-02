import { Link, usePage, usePoll } from '@inertiajs/react';
import { Bell, CheckCheck, CheckCircle2, FilePenLine, FileUp, GraduationCap, X, XCircle } from 'lucide-react';
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
        kind?: 'admission' | 'document';
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
                            <p>{audience === 'admin' ? 'Les nouvelles pièces de vos candidats.' : 'Le suivi de vos justificatifs.'}</p>
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
                                const Icon = notice.kind === 'admission' ? GraduationCap : audience === 'student' && verdict ? verdict.icon : FileUp;
                                return (
                                    <li key={notice.id} className={notice.read_at ? '' : 'is-unread'}>
                                        <span className="admin-notification-icon">
                                            <Icon size={18} />
                                        </span>
                                        <div>
                                            <strong>
                                                {audience === 'student'
                                                    ? notice.kind === 'admission'
                                                        ? 'Bienvenue dans votre espace étudiant'
                                                        : verdict?.title || 'Votre justificatif a été examiné'
                                                    : 'Une pièce à réexaminer'}
                                            </strong>
                                            <p>
                                                {audience === 'admin' && notice.student_name ? `${notice.student_name} · ` : ''}
                                                {notice.reference}
                                            </p>
                                            {notice.kind !== 'admission' && (
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
                                                {notice.kind === 'admission' ? 'Accéder à mon espace étudiant' : 'Ouvrir le justificatif'}
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
