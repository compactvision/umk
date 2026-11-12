export type Applicant = { first_name: string; last_name: string; post_name?: string; email: string };
export type Dossier = {
    selected_document_uuid?: string | null;
    id: number;
    reference: string;
    uuid: string;
    matricule?: string;
    status: string;
    status_label: string;
    created_at: string;
    submitted_at?: string | null;
    requested_program?: string | null;
    enrolled_at?: string;
    student: Applicant | null;
    level?: { title: string; faculty?: { name: string } };
    academic_year?: { title: string };
    documents_count?: number;
    pending_documents?: number;
    accepted_documents?: number;
    correction_documents?: number;
    reexamination_count?: number;
    snapshot?: { name?: string; email?: string; program?: string; isConfirmed?: boolean };
    decision_reason?: string;
    analysis_completed_at?: string;
    analysis_started_at?: string;
    corrections_requested_at?: string;
    payment_status_label?: string;
    documents?: {
        uuid: string;
        key: string;
        filename: string;
        mime: string;
        size_human: string;
        verified: boolean;
        needs_reexamination: boolean;
        review_status: 'pending' | 'accepted' | 'rejected' | 'correction_requested';
        review_comment?: string;
        reviewed_at?: string;
        version: number;
        created_at: string;
        preview_url: string;
        download_url: string;
    }[];
    events?: {
        id: number;
        event: string;
        document_name?: string;
        verdict?: string;
        notification?: string;
        reason?: string;
        actor?: string;
        occurred_at: string;
    }[];
};
export const applicantName = (student: Omit<Applicant, 'email'> | null) =>
    student ? [student.last_name, student.post_name, student.first_name].filter(Boolean).join(' ') : 'Compte indisponible';
export const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    submitted: 'Soumise',
    pending: 'En attente',
    validated: 'Validée',
    rejected: 'Rejetée',
    cancelled: 'Annulée',
    analysis_started: 'Analyse commencée',
    analysis_completed: 'Vérification terminée · Compte rendu',
    document_reviewed: 'Pièce examinée',
    corrections_requested: 'Corrections demandées',
    document_replaced: 'Nouvelle pièce transmise',
    email_sent: 'Email envoyé',
    email_failed: 'Échec d’envoi de l’email',
};

export const documentReviewLabels: Record<string, string> = {
    pending: 'À examiner',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    correction_requested: 'À corriger',
};
