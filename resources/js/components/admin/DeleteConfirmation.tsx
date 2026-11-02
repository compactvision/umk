import { AlertTriangle } from 'lucide-react';
import type { FormEvent } from 'react';
import '../../../css/dashboard/delete-confirmation.css';
import AdminModal from './AdminModal';
export default function DeleteConfirmation({
    title,
    name,
    detail,
    explanation,
    hint,
    busy,
    errors,
    onClose,
    onConfirm,
}: {
    title: string;
    name: string;
    detail?: string;
    explanation: string;
    hint: string;
    busy: boolean;
    errors?: Record<string, string | undefined>;
    onClose: () => void;
    onConfirm: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <AdminModal
            className="admin-delete-modal"
            title={title}
            description="Vérifiez l’élément concerné avant de confirmer sa suppression."
            formId="admin-delete-form"
            submitLabel="Supprimer définitivement"
            busy={busy}
            errors={errors}
            onClose={onClose}
        >
            <form id="admin-delete-form" className="admin-modal-form" onSubmit={onConfirm}>
                <div className="admin-delete-target">
                    <span>
                        <AlertTriangle size={25} strokeWidth={1.5} />
                    </span>
                    <div>
                        {detail && <small>{detail}</small>}
                        <strong>{name}</strong>
                    </div>
                </div>
                <p className="admin-delete-explanation">
                    {explanation} <strong>Cette action est définitive.</strong>
                </p>
                <p className="admin-delete-hint">{hint}</p>
            </form>
        </AdminModal>
    );
}
