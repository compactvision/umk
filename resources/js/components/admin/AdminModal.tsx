import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import '../../../css/dashboard/admin-modal.css';
type Props = {
    title: string;
    description: string;
    onClose: () => void;
    formId: string;
    submitLabel: string;
    busy?: boolean;
    wide?: boolean;
    className?: string;
    errors?: Record<string, string | undefined>;
    children: ReactNode;
};
export default function AdminModal({
    title,
    description,
    onClose,
    formId,
    submitLabel,
    busy = false,
    wide = false,
    className = '',
    errors = {},
    children,
}: Props) {
    const content = useRef<HTMLDivElement>(null);
    const previousFocus = useRef(typeof document !== 'undefined' ? document.activeElement : null);
    const messages = [...new Set(Object.values(errors).filter(Boolean))];
    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <Dialog.Portal>
                <div className="usk-dashboard usk-admin-apps admin-modal-root">
                    <Dialog.Overlay className="admin-modal-overlay" />
                    <Dialog.Content
                        ref={content}
                        onOpenAutoFocus={(event) => {
                            const firstField = content.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
                                'input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
                            );
                            if (firstField) {
                                event.preventDefault();
                                firstField.focus({ preventScroll: true });
                            }
                        }}
                        onCloseAutoFocus={(event) => {
                            event.preventDefault();
                            if (previousFocus.current instanceof HTMLElement && previousFocus.current.isConnected) previousFocus.current.focus();
                        }}
                        className={`admin-modal ${wide ? 'admin-modal-wide' : ''} ${className}`}
                        onInteractOutside={(event) => event.preventDefault()}
                        onEscapeKeyDown={(event) => {
                            if (busy) event.preventDefault();
                        }}
                    >
                        <header className="admin-modal-header">
                            <div>
                                <span>ADMINISTRATION USK</span>
                                <Dialog.Title>{title}</Dialog.Title>
                                <Dialog.Description>{description}</Dialog.Description>
                            </div>
                            <Dialog.Close className="admin-modal-close" disabled={busy} aria-label="Fermer le formulaire">
                                <X size={20} />
                            </Dialog.Close>
                        </header>
                        <div className="admin-modal-body">
                            {messages.length > 0 && (
                                <div className="admin-modal-errors" role="alert">
                                    <strong>Vérifiez les informations indiquées.</strong>
                                    <ul>
                                        {messages.map((message) => (
                                            <li key={message}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {children}
                        </div>
                        <footer className="admin-modal-footer">
                            <span>Les champs marqués * sont obligatoires.</span>
                            <div>
                                <button type="button" className="admin-modal-cancel" onClick={onClose} disabled={busy}>
                                    Annuler
                                </button>
                                <button type="submit" form={formId} className="admin-modal-submit" disabled={busy}>
                                    {busy && <LoaderCircle size={16} className="animate-spin" />}
                                    {busy ? 'Enregistrement…' : submitLabel}
                                </button>
                            </div>
                        </footer>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
