import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../../css/dashboard/feedback-toast.css';
export type ToastFeedback = { id: number; message: string; tone: 'success' | 'error' };
export default function FeedbackToast({ feedback, onDismiss }: { feedback: ToastFeedback; onDismiss: () => void }) {
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (paused) return;
        const timeout = window.setTimeout(onDismiss, feedback.tone === 'error' ? 9000 : 5500);
        return () => window.clearTimeout(timeout);
    }, [feedback.id, feedback.tone, paused, onDismiss]);
    if (typeof document === 'undefined') return null;
    const Icon = feedback.tone === 'success' ? CheckCircle2 : CircleAlert;
    return createPortal(
        <div
            className={`dashboard-feedback-toast is-${feedback.tone}`}
            role={feedback.tone === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
            }}
        >
            <span className="feedback-toast-icon">
                <Icon size={22} strokeWidth={1.6} />
            </span>
            <div>
                <strong>{feedback.tone === 'success' ? 'Modification enregistrée' : 'Enregistrement impossible'}</strong>
                <p>{feedback.message}</p>
            </div>
            <button type="button" onClick={onDismiss} aria-label="Fermer la confirmation">
                <X size={17} />
            </button>
        </div>,
        document.body,
    );
}
