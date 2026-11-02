export type Permission = { visible?: boolean; allowed: boolean; reason: string | null };
export type Academic = {
    id: number;
    application_uuid: string;
    reference: string;
    matricule: string | null;
    name: string;
    email: string;
    faculty: string;
    level: string;
    year: string;
    group: string | null;
    application_status: string;
    student_status: string;
    enrollment_status: string;
    fee_category: string | null;
    phone?: string | null;
    photo_url?: string | null;
};
export type Balance = {
    assessed: boolean;
    currency: string;
    total_cents: number;
    waived_cents: number;
    due_cents: number;
    paid_cents: number;
    pending_cents: number;
    balance_cents: number;
    overdue_cents: number;
    credit_cents: number;
    financial_clearance_status: string;
};
export type Resource = {
    id: number;
    kind: string;
    title: string;
    body: string | null;
    course: string;
    allowed: boolean;
    reason: string | null;
    download_url: string | null;
    opens_at: string | null;
    closes_at: string | null;
    submission: { body: string | null; version: number; submitted_at: string; filename?: string | null; download_url?: string | null } | null;
};
export type OverviewResource = {
    id: number;
    title: string;
    course: string;
    excerpt: string;
    updated_at: string;
    opens_at: string | null;
    closes_at: string | null;
};
export type StudentOverviewData = {
    fee_summary: { kind: string; title: string; balance: Balance }[];
    ongoing_evaluations: OverviewResource[];
    generated_at: string;
    timezone: string;
    today_count: number;
    week_count: number;
    course_count: number;
    today_sessions: (PortalProps['sessions'][number] & { ongoing: boolean })[];
    week_sessions: (PortalProps['sessions'][number] & { ongoing: boolean })[];
    alerts: { id: string; tone: string; title: string; message: string; section: string }[];
    latest_results: OverviewResource[];
    announcements: OverviewResource[];
    upcoming_evaluations: OverviewResource[];
    missing_documents: string[];
};
export type PortalProps = {
    overview: StudentOverviewData | null;
    profile_form: { values: Record<string, string | number | null>; provinces: string[] } | null;
    welcome_pending: boolean;
    section: string;
    academic: Academic;
    contexts: { id: number; label: string }[];
    permissions: Record<string, Permission>;
    balance: Balance;
    courses: { id: number; course_id: number; detail_url: string; title: string; code: string | null; credits: number; semester: string | null; teacher: string | null; catalog_only?: boolean }[];
    schedule_week: string;
    sessions: { id: number; course: string; starts_at: string; ends_at: string; room: string; teacher?: string | null; level_id?: number }[];
    upcoming_sessions: PortalProps['sessions'];
    resources: Resource[];
    obligations: { id: number; title: string; amount_cents: number; due_at: string | null; installment: number }[];
    payments: {
        id: number;
        uuid: string;
        reference: string;
        amount_cents: number;
        status: string;
        method: string;
        created_at: string;
        confirmed_at: string | null;
        receipt_url: string | null;
    }[];
    tariffs: { national: (string | number | null)[]; foreign: (string | number | null)[] };
    adjustments: {
        id: number;
        type: string;
        amount_cents: number | null;
        feature: string | null;
        starts_at: string | null;
        expires_at: string | null;
        schedule?: { due_at: string; amount_cents: number }[] | null;
    }[];
    requests: { id: number; category: string; subject: string; body: string; status: string; response: string | null; created_at: string }[];
    work_archive: {
        id: number;
        title: string;
        body: string | null;
        version: number;
        submitted_at: string;
        filename: string | null;
        download_url: string | null;
    }[];
    success?: string;
};
export const money = (cents: number, currency = 'USD') =>
    `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
export const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    graduated: 'Diplômé',
    archived: 'Archivé',
    confirmed: 'Confirmée',
    pending_confirmation: 'À confirmer',
    completed: 'Terminée',
    cancelled: 'Annulée',
    unpaid: 'Non réglé',
    partial: 'Paiement partiel',
    cleared: 'Solde réglé',
    exempted: 'Exonération',
    overdue: 'Échéance dépassée',
    unassessed: 'Tarif à confirmer',
    pending: 'En attente de confirmation',
    refunded: 'Remboursement enregistré',
    exemption: 'Exonération',
    scholarship: 'Bourse',
    plan: 'Échéancier approuvé',
    override: 'Dérogation',
    open: 'En cours',
    resolved: 'Résolue',
};
