export type StudentDocument = {
    id: number;
    uuid: string;
    name: string;
    label?: string;
    preview_url?: string;
    type: string;
    size_human?: string;
    verified: boolean;
    review_status: string;
    review_comment?: string | null;
    can_replace: boolean;
    version: number;
    url: string;
    uploaded_at?: string;
    verified_at?: string | null;
};
export type StudentEnrollment = {
    financial_portal_url?: string | null;
    academic_portal_url?: string | null;
    selected_document_uuid?: string | null;
    id: number;
    uuid: string;
    reference: string;
    matricule?: string | null;
    status: string;
    payment_status?: string;
    created_at?: string;
    updated_at?: string;
    enrolled_at?: string | null;
    analysis_completed_at?: string | null;
    analysis_started_at?: string | null;
    corrections_requested_at?: string | null;
    document_upload_max_kb?: number;
    notes?: string | null;
    rejection_reason?: string | null;
    declared_name?: string | null;
    declared_email?: string | null;
    student?: { first_name: string; last_name: string; post_name?: string; email: string };
    level?: { title: string; code?: string; faculty?: { name: string } } | null;
    academic_year?: { title: string; start_date?: string; end_date?: string } | null;
    documents_count?: number;
    accepted_documents_count?: number;
    correction_documents_count?: number;
    documents?: StudentDocument[];
    status_history?: {
        id: number;
        status: string;
        created_at: string;
        notes?: string | null;
        document_name?: string | null;
        verdict?: string | null;
        user?: { name: string };
    }[];
};
export const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    submitted: 'Dossier transmis',
    pending: 'En cours d’examen',
    validated: 'Dossier validé',
    rejected: 'Dossier rejeté',
    cancelled: 'Inscription annulée',
};
export const verdictLabels: Record<string, string> = {
    pending: 'À examiner',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    correction_requested: 'À corriger',
};
export const historyLabels: Record<string, string> = {
    ...statusLabels,
    created: 'Dossier créé',
    draft_saved: 'Brouillon enregistré',
    saved: 'Brouillon enregistré',
    analysis_started: 'Début de l’analyse',
    analysis_completed: 'Vérification des pièces terminée',
    document_reviewed: 'Justificatif examiné',
    corrections_requested: 'Corrections demandées',
    document_replaced: 'Nouvelle version transmise',
};
export const paymentLabels: Record<string, string> = {
    unpaid: 'Non réglé',
    partial: 'Partiellement réglé',
    paid: 'Réglé',
    refunded: 'Remboursé',
    unassessed: 'Tarif à confirmer',
    exempted: 'Exonération',
    overdue: 'Échéance dépassée',
};
export function formatDate(value?: string | null, time = false) {
    if (!value || Number.isNaN(Date.parse(value))) return '—';
    return new Date(value).toLocaleString('fr-FR', {
        timeZone: 'Africa/Kinshasa',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
}
export function nextStep(entry: StudentEnrollment) {
    if (entry.status === 'draft') return 'Complétez votre brouillon, puis transmettez-le au service des inscriptions.';
    if (entry.status === 'validated') return 'Votre dossier est validé. Consultez les indications du service pour la suite de votre inscription.';
    if (entry.status === 'rejected')
        return 'Consultez le motif de la décision dans votre dossier. Le service des inscriptions peut vous apporter des précisions.';
    if (entry.status === 'cancelled') return 'Cette inscription est annulée. Son historique reste consultable.';
    if (entry.documents?.some((doc) => doc.can_replace) || (entry.status === 'pending' && (entry.correction_documents_count || 0) > 0))
        return 'Des corrections sont attendues. Ouvrez vos justificatifs pour transmettre les pièces demandées.';
    if (entry.analysis_completed_at)
        return 'Toutes vos pièces ont été examinées. Consultez le compte rendu dans vos justificatifs. La décision finale du service reste à venir.';
    return entry.analysis_started_at
        ? 'Le service examine vos informations et vos justificatifs. Vous serez informé de la décision par email.'
        : 'Votre dossier a été transmis. Le service des inscriptions vous informera du début de son examen.';
}
