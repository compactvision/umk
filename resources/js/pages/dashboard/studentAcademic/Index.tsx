import FeedbackToast, { type ToastFeedback } from '@/components/admin/FeedbackToast';
import PageHeading from '@/components/admin/PageHeading';
import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { EmptyState, PaymentOverview } from '@/components/student/PortalCards';
import { labels, money, type Balance } from '@/components/student/types';
import { formatDate } from '@/lib/studentEnrollment';
import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    CreditCard,
    GraduationCap,
    LayoutGrid,
    List,
    MessageSquare,
    Plus,
    Search,
    Settings2,
    ShieldCheck,
} from 'lucide-react';
import { useRef, useState } from 'react';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type Field, type FormSpec } from './AcademicForm';
type StudentRow = {
    program: string | null;
    account_status: string;
    id: number;
    name: string;
    matricule: string | null;
    faculty: string;
    department: string | null;
    level: string;
    year: string;
    status: string;
    student_status: string;
    photo_url: string | null;
};
type Props = {
    students: { data: StudentRow[]; total: number; current_page: number; links: { url: string | null; label: string; active: boolean }[] };
    programs: { id: number; name: string }[];
    departments: { id: number; name: string; faculty_id: number; faculty: { name: string } }[];
    filters: {
        program?: number;
        academic?: number;
        q?: string;
        tab?: string;
        faculty?: number;
        department?: number;
        level?: number;
        view?: 'table' | 'grid';
        history?: '1';
        year?: number;
        enrollment_status?: 'pending_confirmation' | 'confirmed' | 'completed' | 'suspended' | 'cancelled';
    };
    selected: {
        id: number;
        profile_id: number;
        name: string;
        matricule: string | null;
        level_id: number;
        year_id: number;
        class_id: number | null;
        status: string;
        student_status: string;
        category: string | null;
    } | null;
    balance: Balance | null;
    obligations: { id: number; title: string; amount_cents: number; due_at: string | null }[];
    fee_kinds: string[];
    payments: {
        id: number;
        reference: string;
        amount_cents: number;
        currency: string;
        status: string;
        method: string;
        confirmed_at: string | null;
    }[];
    adjustments: {
        id: number;
        type: string;
        feature: string | null;
        reason: string;
        is_active: boolean;
        amount_cents: number | null;
        expires_at: string | null;
    }[];
    rules: {
        id: number;
        feature: string;
        fee_kind: string;
        mode: string;
        minimum_cents: number | null;
        academic_year_id: number | null;
        level_id: number | null;
        allow_plan: boolean;
        allow_exemption: boolean;
        regulation_reference: string | null;
    }[];
    levels: { id: number; title: string; faculty_id: number; faculty: { name: string }; department_options: { id: number; name: string }[] }[];
    years: { id: number; title: string }[];
    groups: { id: number; intake: { name: string } }[];
    courses: { id: number; level_id: number; title: string }[];
    professors: { id: number; first_name: string; last_name: string }[];
    offerings: {
        id: number;
        level_id: number;
        academic_year_id: number;
        course: { title: string };
        department: { id: number; name: string } | null;
        professor: { first_name: string; last_name: string } | null;
        semester: string | null;
        is_optional: boolean;
        is_published: boolean;
    }[];
    resources: {
        assessment_exists?: boolean;
        id: number;
        academic_offering_id: number;
        kind: string;
        title: string;
        is_published: boolean;
        student_profile_id: number | null;
    }[];
    sessions: { id: number; offering: { course: { title: string } }; starts_at: string; ends_at: string; room: string; is_published: boolean }[];
    submissions: {
        id: number;
        title: string;
        body: string | null;
        filename: string | null;
        version: number;
        submitted_at: string;
        version_url: string;
        download_url: string | null;
    }[];
    requests: {
        id: number;
        academic_enrollment_id: number;
        student_name: string;
        category: string;
        subject: string;
        body: string;
        status: string;
        response: string | null;
        created_at: string;
    }[];
    audit: {
        id: number;
        actor_id: number | null;
        actor_name: string;
        action: string;
        entity_type: string;
        entity_id: number;
        reason: string | null;
        created_at: string;
    }[];
    abilities: { finance: boolean; access: boolean; publish: boolean };
    success?: string;
};
const features = [
    { value: 'materials_download', label: 'Téléchargement de supports' },
    { value: 'assignments_submit', label: 'Dépôt de travaux' },
    { value: 'evaluations_participate', label: 'Participation aux évaluations' },
    { value: 'documents_request', label: 'Documents soumis à condition' },
    { value: 'results_view', label: 'Consultation des résultats' },
];
const auditLabels: Record<string, string> = {
    student_admission_activated: 'Espace étudiant activé',
    fees_assessed: 'Barème affecté',
    additional_fee_created: 'Frais complémentaire établi',
    payment_recorded: 'Versement saisi',
    payment_confirmed: 'Versement confirmé',
    payment_cancelled: 'Écriture annulée',
    payment_refunded: 'Remboursement enregistré',
    financial_adjustment_approved: 'Autorisation financière approuvée',
    financial_adjustment_revoked: 'Autorisation révoquée',
    academic_access_rule_created: 'Règle d’accès définie',
    academic_access_rule_disabled: 'Règle d’accès désactivée',
    academic_status_changed: 'Situation académique modifiée',
    academic_enrollment_confirmed: 'Inscription confirmée automatiquement',
    course_created: 'Matière créée',
    offering_created: 'Enseignement affecté',
    academic_publication_changed: 'Publication modifiée',
    session_created: 'Séance planifiée',
    academic_resource_created: 'Ressource créée',
    course_exception_changed: 'Affectation individuelle modifiée',
    academic_work_submitted: 'Travail transmis',
    student_request_created: 'Demande reçue',
    student_request_answered: 'Réponse publiée',
};
const modes = [
    { value: 'hidden', label: 'Masqué : service non proposé pour ce périmètre' },
    { value: 'open', label: 'Accessible sans condition financière' },
    { value: 'first_installment', label: 'Première tranche réglée' },
    { value: 'minimum', label: 'Acompte minimum confirmé' },
    { value: 'full', label: 'Frais nets intégralement réglés' },
    { value: 'exemption', label: 'Exonération autorisée' },
];
const reason: Field = {
    name: 'reason',
    label: 'Justification de la décision',
    type: 'textarea',
    required: true,
    help: 'Cette justification est conservée dans le journal d’audit.',
};
const directoryPanelKeys = 'tab q faculty department program level view year enrollment_status history page';

export default function Index(props: Props) {
    const tab = props.filters.tab || 'students';
    const selected = props.selected;
    const [faculty, setFaculty] = useState(String(props.filters.faculty ?? ''));
    const [level, setLevel] = useState(String(props.filters.level ?? ''));
    const [department, setDepartment] = useState(String(props.filters.department ?? ''));
    const [program, setProgram] = useState(String(props.filters.program ?? ''));
    const [year, setYear] = useState(String(props.filters.year ?? ''));
    const [status, setStatus] = useState<string>(props.filters.enrollment_status ?? '');
    const [query, setQuery] = useState(props.filters.q || '');
    const [spec, setSpec] = useState<FormSpec | null>(null);
    const [toast, setToast] = useState<ToastFeedback | null>(null);
    const sequence = useRef(0);
    const base = '/dashboard/admin/student-academic';
    const show = (title: string, description: string, action: string, fields: Field[], submitLabel?: string) =>
        setSpec({ title, description, action, fields, submitLabel });
    const choose = (tab: string, id = selected?.id) => `${base}?${new URLSearchParams({ tab, ...(id ? { academic: String(id) } : {}) })}`;
    const optionsLevels = props.levels.map((level) => ({ value: level.id, label: `${level.faculty.name} · ${level.title}` }));
    const optionsYears = props.years.map((year) => ({ value: year.id, label: year.title }));
    const feeKindField: Field = {
        name: 'fee_kind',
        label: 'Type de frais concerné',
        type: 'select',
        required: true,
        value: 'tuition',
        options: props.fee_kinds.map((kind) => ({ value: kind, label: kind === 'tuition' ? 'Frais académiques' : kind })),
    };
    const offeringOptions = props.offerings.map((offering) => ({
        value: offering.id,
        label: `${offering.course.title} · ${offering.department?.name ?? 'Tronc commun'} · ${props.years.find((y) => y.id === offering.academic_year_id)?.title || ''} · ${offering.is_published ? 'Publié' : 'Brouillon'}`,
    }));
    const publish = (type: string, id: number, isPublished: boolean, title: string) =>
        show(
            isPublished ? 'Retirer la publication' : 'Publier cet élément',
            `${title}. Seuls les étudiants réellement affectés verront les éléments publiés.`,
            `${base}/publication/${type}/${id}`,
            [{ name: 'is_published', label: 'Visible par les étudiants concernés', type: 'checkbox', value: !isPublished }, reason],
        );
    const openRule = (existing?: Props['rules'][number]) =>
        show(
            'Définir une règle d’accès',
            'Cette règle remplace la règle active du même périmètre. Les services essentiels, les recours et l’assistance restent accessibles.',
            `${base}/rules`,
            [
                { ...feeKindField, value: existing?.fee_kind || 'tuition' },
                { name: 'feature', label: 'Service concerné', type: 'select', required: true, options: features, value: existing?.feature },
                {
                    name: 'academic_year_id',
                    label: 'Année (vide = toutes)',
                    type: 'select',
                    options: optionsYears,
                    value: existing?.academic_year_id,
                },
                { name: 'level_id', label: 'Niveau (vide = tous)', type: 'select', options: optionsLevels, value: existing?.level_id },
                { name: 'mode', label: 'Condition / visibilité du service', type: 'select', required: true, options: modes, value: existing?.mode },
                {
                    name: 'minimum',
                    label: 'Acompte minimum (si ce mode est choisi)',
                    type: 'number',
                    value: existing?.minimum_cents ? (existing.minimum_cents / 100).toFixed(2) : '',
                },
                {
                    name: 'allow_plan',
                    label: 'Accepter un échéancier approuvé dont les échéances sont respectées',
                    type: 'checkbox',
                    value: existing?.allow_plan ?? false,
                },
                { name: 'allow_exemption', label: 'Accepter une exonération valide', type: 'checkbox', value: existing?.allow_exemption ?? true },
                {
                    name: 'regulation_reference',
                    label: 'Référence au règlement (évaluations / résultats)',
                    type: 'textarea',
                    value: existing?.regulation_reference || '',
                    help: 'Obligatoire pour toute restriction financière d’une évaluation ou d’un résultat.',
                },
                {
                    name: 'regulation_confirmed',
                    label: 'Je confirme que cette restriction est prévue par le règlement applicable et validée par l’administration',
                    type: 'checkbox',
                },
                reason,
            ],
        );
    const openAdjustment = (type: string) =>
        selected &&
        show(
            labels[type],
            type === 'override'
                ? 'La dérogation ne contourne ni une suspension, ni l’affectation, ni les règles de publication.'
                : 'Cette autorisation est réservée au service financier et reste traçable.',
            `${base}/${selected.id}/adjustments`,
            [
                feeKindField,
                {
                    name: 'type',
                    label: 'Type d’autorisation',
                    type: 'select',
                    value: type,
                    required: true,
                    options: [{ value: type, label: labels[type] }],
                },
                ...(type === 'scholarship' ? [{ name: 'amount', label: 'Montant de la bourse (USD)', type: 'number', required: true }] : []),
                ...(type === 'override' ? [{ name: 'feature', label: 'Service concerné', type: 'select', required: true, options: features }] : []),
                { name: 'starts_at', label: 'Début de validité', type: 'date' },
                { name: 'expires_at', label: 'Fin de validité', type: 'date', required: type === 'override' },
                ...(type === 'plan'
                    ? [
                          {
                              name: 'schedule',
                              label: 'Échéancier de paiement',
                              type: 'schedule',
                              help: 'Le total des échéances doit correspondre exactement aux frais nets applicables.',
                          },
                      ]
                    : []),
                reason,
            ],
        );
    const directoryView = props.filters.view ?? 'table';
    const enrollmentStatus = props.filters.enrollment_status;
    const history = props.filters.history === '1';
    const pendingEnrollments = !history && enrollmentStatus === 'pending_confirmation';
    const directoryTitle = history
        ? 'Historique des inscriptions'
        : pendingEnrollments
          ? 'Inscriptions en attente'
          : enrollmentStatus === 'confirmed'
            ? 'Inscriptions annuelles'
            : 'Répertoire des étudiants';
    const hasFilters =
        props.filters.q ||
        props.filters.faculty ||
        props.filters.department ||
        props.filters.level ||
        props.filters.program ||
        props.filters.year ||
        enrollmentStatus;
    const facultyOptions = [...new Map(props.levels.map((item) => [item.faculty_id, item.faculty.name])).entries()].sort((left, right) =>
        left[1].localeCompare(right[1], 'fr'),
    );
    const departments = props.departments.filter((item) => !faculty || String(item.faculty_id) === faculty);
    const levels = props.levels
        .filter((item) => !faculty || String(item.faculty_id) === faculty)
        .sort((left, right) => left.faculty.name.localeCompare(right.faculty.name, 'fr') || left.title.localeCompare(right.title, 'fr'));
    const dossier = (student: StudentRow) =>
        route('dashboard.admin.student-academic.show', {
            ...props.filters,
            tab: undefined,
            academic: student.id,
            page: props.students.current_page,
        });
    const studentIdentity = (student: StudentRow) => (
        <Link href={dossier(student)} className="academic-directory-identity">
            <span className="academic-directory-initials" aria-hidden="true">
                {student.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((name) => name.charAt(0))
                    .join('')
                    .toLocaleUpperCase('fr')}
                {student.photo_url && (
                    <img
                        key={student.photo_url}
                        src={student.photo_url}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                            event.currentTarget.hidden = true;
                        }}
                    />
                )}
            </span>
            <div>
                <strong>{student.name}</strong>
                <small>{student.matricule || 'Matricule à renseigner'}</small>
                <small>{student.account_status}</small>
            </div>
        </Link>
    );
    const studentActions = (student: StudentRow) => (
        <div className="academic-directory-actions">
            <Link href={dossier(student)}>Ouvrir le dossier</Link>
            {pendingEnrollments && props.abilities.finance && (
                <Link href={base} data={{ tab: 'finance', academic: student.id }}>
                    Suivi financier
                </Link>
            )}
            {props.abilities.access && !history && (
                <button
                    className="academic-link-button"
                    onClick={() =>
                        show(
                            'Situation académique',
                            'Un changement de statut entraîne le recalcul immédiat des droits pédagogiques.',
                            `${base}/${student.id}/status`,
                            [
                                {
                                    name: 'student_status',
                                    label: 'Statut étudiant',
                                    type: 'select',
                                    value: student.student_status,
                                    required: true,
                                    options: ['active', 'suspended', 'graduated', 'archived'].map((value) => ({ value, label: labels[value] })),
                                },
                                {
                                    name: 'enrollment_status',
                                    label: 'Statut de l’inscription',
                                    type: 'select',
                                    value: student.status,
                                    required: true,
                                    options: ['pending_confirmation', 'confirmed', 'suspended', 'completed', 'cancelled'].map((value) => ({
                                        value,
                                        label: labels[value],
                                    })),
                                },
                                reason,
                            ],
                        )
                    }
                >
                    Modifier les statuts
                </button>
            )}
        </div>
    );
    const tabs = [
        { id: 'students', label: 'Étudiants', icon: GraduationCap, show: true },
        { id: 'finance', label: 'Suivi financier', icon: CreditCard, show: props.abilities.finance },
        { id: 'rules', label: 'Règles d’accès', icon: ShieldCheck, show: props.abilities.access },
        { id: 'teaching', label: 'Enseignements', icon: BookOpen, show: props.abilities.publish },
        { id: 'requests', label: 'Demandes', icon: MessageSquare, show: props.abilities.access },
    ];
    return (
        <Dashboard hideAppsNavigation={tab === 'students'}>
            <Head title={tab === 'students' ? directoryTitle : 'Nos étudiants'} />
            {toast && <FeedbackToast key={toast.id} feedback={toast} onDismiss={() => setToast(null)} />}
            <div className="student-portal academic-administration">
                {tab === 'students' ? (
                    <header className="directory-heading">
                        <div>
                            <p className="directory-heading-label">
                                <GraduationCap size={17} aria-hidden="true" /> Scolarité
                            </p>
                            <h1>{directoryTitle}</h1>
                            <p>
                                {history
                                    ? 'Consultez les inscriptions de la plus récente à la plus ancienne, par année académique.'
                                    : pendingEnrollments
                                      ? 'Les candidatures admises apparaissent ici jusqu’à la couverture intégrale de la première tranche.'
                                      : 'Retrouvez une inscription par faculté, département ou niveau.'}
                            </p>
                        </div>
                        <div className="directory-heading-count">
                            <strong>{props.students.total.toLocaleString('fr-FR')}</strong>
                            <span>{props.students.total === 1 ? 'Inscription affichée' : 'Inscriptions affichées'}</span>
                        </div>
                    </header>
                ) : (
                    <>
                        <PageHeading
                            title="Nos étudiants"
                            description="Admissions activées, affectations pédagogiques, suivi financier et droits d’accès."
                        />
                        <nav className="portal-tabs" aria-label="Gestion du parcours étudiant">
                            {tabs
                                .filter((t) => t.show)
                                .map((item) => (
                                    <Link href={choose(item.id)} key={item.id} aria-current={tab === item.id ? 'page' : undefined}>
                                        <item.icon size={15} />
                                        {item.label}
                                    </Link>
                                ))}
                        </nav>
                    </>
                )}
                {selected && (
                    <section className="academic-selected" data-dashboard-panel="academic">
                        <GraduationCap size={24} strokeWidth={1.4} />
                        <div>
                            <strong>{selected.name}</strong>
                            <p>
                                {selected.matricule || 'Matricule non renseigné'} · {props.levels.find((l) => l.id === selected.level_id)?.title} ·{' '}
                                {props.years.find((y) => y.id === selected.year_id)?.title}
                            </p>
                        </div>
                        <Link href={base}>Changer d’étudiant</Link>
                    </section>
                )}
                {tab === 'students' && (
                    <>
                        <section className="portal-panel academic-directory" aria-label="Inscriptions académiques">
                            <form
                                className="academic-student-search"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    router.get(
                                        base,
                                        {
                                            ...props.filters,
                                            tab,
                                            q: query || undefined,
                                            faculty: faculty || undefined,
                                            department: department || undefined,
                                            program: program || undefined,
                                            level: level || undefined,
                                            view: directoryView,
                                            year: year || undefined,
                                            enrollment_status: status || undefined,
                                        },
                                        { preserveScroll: true },
                                    );
                                }}
                            >
                                <div className="directory-search-row">
                                    <label className="directory-search-field" htmlFor="academic-search">
                                        <span className="sr-only">Retrouver un étudiant</span>
                                        <span className="directory-search-input">
                                            <Search size={18} aria-hidden="true" />
                                            <input
                                                id="academic-search"
                                                type="search"
                                                value={query}
                                                placeholder="Nom, email ou matricule…"
                                                onChange={(event) => setQuery(event.target.value)}
                                            />
                                        </span>
                                    </label>
                                    <button type="submit" className="admin-primary">
                                        Rechercher
                                    </button>
                                </div>
                                <div className="directory-filters">
                                    <label>
                                        <span>Faculté</span>
                                        <select
                                            aria-label="Filtrer par faculté"
                                            value={faculty}
                                            onChange={(event) => {
                                                setFaculty(event.target.value);
                                                setDepartment('');
                                                setLevel('');
                                            }}
                                        >
                                            <option value="">Toutes les facultés</option>
                                            {facultyOptions.map(([id, name]) => (
                                                <option key={id} value={id}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Département</span>
                                        <select
                                            aria-label="Filtrer par département"
                                            value={department}
                                            onChange={(event) => setDepartment(event.target.value)}
                                        >
                                            <option value="">Tous les départements</option>
                                            {departments.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {faculty ? item.name : `${item.faculty.name} · ${item.name}`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Niveau</span>
                                        <select aria-label="Filtrer par niveau" value={level} onChange={(event) => setLevel(event.target.value)}>
                                            <option value="">Tous les niveaux</option>
                                            {levels.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {faculty ? item.title : `${item.faculty.name} · ${item.title}`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    {
                                        <>
                                            <label>
                                                <span>Programme</span>
                                                <select value={program} onChange={(event) => setProgram(event.target.value)}>
                                                    <option value="">Tous les programmes</option>
                                                    {props.programs.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Année académique</span>
                                                <select value={year} onChange={(event) => setYear(event.target.value)}>
                                                    <option value="">Toutes les années</option>
                                                    {props.years.map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <span>Statut</span>
                                                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                                                    <option value="">Tous les statuts</option>
                                                    {['confirmed', 'pending_confirmation', 'completed', 'suspended', 'cancelled'].map((value) => (
                                                        <option key={value} value={value}>
                                                            {labels[value]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </>
                                    }
                                </div>
                            </form>
                            <header className="academic-directory-header">
                                <div>
                                    <h2>{history ? 'Inscriptions par année' : 'Liste des inscriptions'}</h2>
                                    {hasFilters && (
                                        <Link
                                            className="directory-reset"
                                            href={base}
                                            data={{
                                                tab,
                                                view: directoryView,
                                                academic: selected?.id,
                                                history: props.filters.history,
                                                enrollment_status: history ? undefined : enrollmentStatus,
                                            }}
                                        >
                                            Réinitialiser les filtres
                                        </Link>
                                    )}
                                </div>
                                <div className="academic-directory-views" role="group" aria-label="Mode d’affichage">
                                    {(
                                        [
                                            { value: 'table', label: 'Tableau', Icon: List },
                                            { value: 'grid', label: 'Grille', Icon: LayoutGrid },
                                        ] as const
                                    ).map(({ value, label, Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className="admin-secondary"
                                            aria-pressed={directoryView === value}
                                            onClick={() => {
                                                if (directoryView !== value)
                                                    router.get(
                                                        base,
                                                        { ...props.filters, tab, view: value, page: props.students.current_page },
                                                        { preserveScroll: true },
                                                    );
                                            }}
                                        >
                                            <Icon size={16} aria-hidden="true" /> {label}
                                        </button>
                                    ))}
                                </div>
                            </header>
                            {directoryView === 'table' && props.students.data.length > 0 && (
                                <div className="academic-table-scroll" data-dashboard-panel={directoryPanelKeys}>
                                    <table className="academic-table">
                                        <thead>
                                            <tr>
                                                <th>Étudiant</th>
                                                <th>Faculté</th>
                                                <th>Département</th>
                                                <th>Niveau</th>
                                                {history && <th>Année académique</th>}
                                                <th>Statut</th>
                                                <th>{history ? 'Dossier' : 'Gestion'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.students.data.map((student) => (
                                                <tr key={student.id}>
                                                    <td>{studentIdentity(student)}</td>
                                                    <td>{student.faculty}</td>
                                                    <td>
                                                        {student.department || 'Sans département'}
                                                        <small style={{ display: 'block' }}>{student.program || 'Programme non rattaché'}</small>
                                                    </td>
                                                    <td>
                                                        {student.level}
                                                        {!history && <small>{student.year}</small>}
                                                    </td>
                                                    {history && (
                                                        <td>
                                                            {student.year}
                                                            <small style={{ display: 'block' }}>{student.account_status}</small>
                                                        </td>
                                                    )}
                                                    <td>
                                                        <span className={`portal-status is-${student.status}`}>
                                                            {labels[student.status] || student.status}
                                                        </span>
                                                    </td>
                                                    <td>{studentActions(student)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {directoryView === 'grid' && props.students.data.length > 0 && (
                                <div className="academic-directory-grid" data-dashboard-panel={directoryPanelKeys}>
                                    {props.students.data.map((student) => (
                                        <article key={student.id}>
                                            <div className="academic-directory-card-header">
                                                {studentIdentity(student)}
                                                <span className={`portal-status is-${student.status}`}>
                                                    {labels[student.status] || student.status}
                                                </span>
                                            </div>
                                            <dl>
                                                <div>
                                                    <dt>Faculté</dt>
                                                    <dd>{student.faculty}</dd>
                                                </div>
                                                <div>
                                                    <dt>Département</dt>
                                                    <dd>{student.department || 'Sans département'}</dd>
                                                </div>
                                                <div>
                                                    <dt>Niveau</dt>
                                                    <dd>{student.level}</dd>
                                                </div>
                                                <div>
                                                    <dt>Année</dt>
                                                    <dd>{student.year}</dd>
                                                </div>
                                            </dl>
                                            {studentActions(student)}
                                        </article>
                                    ))}
                                </div>
                            )}
                            {!props.students.data.length && (
                                <div data-dashboard-panel={directoryPanelKeys}>
                                    <EmptyState title={pendingEnrollments ? 'Aucune inscription en attente.' : 'Aucune inscription trouvée.'}>
                                        {pendingEnrollments &&
                                        !props.filters.q &&
                                        !props.filters.faculty &&
                                        !props.filters.department &&
                                        !props.filters.level
                                            ? 'Les nouvelles admissions apparaîtront ici.'
                                            : 'Ajustez la recherche ou les filtres pour afficher d’autres résultats.'}
                                    </EmptyState>
                                </div>
                            )}
                            <Pagination value={props.students} />
                        </section>
                        {selected && props.abilities.access && !history && (
                            <section className="portal-panel" data-dashboard-panel="tab academic">
                                <header>
                                    <h2>Affectations de l’étudiant sélectionné</h2>
                                </header>
                                <div className="academic-actions">
                                    <button
                                        className="admin-secondary"
                                        onClick={() =>
                                            show(
                                                'Affecter une promotion',
                                                'Seules les promotions du niveau peuvent être affectées.',
                                                `${base}/${selected.id}/status`,
                                                [
                                                    {
                                                        name: 'student_status',
                                                        label: 'Statut étudiant',
                                                        type: 'select',
                                                        value: selected.student_status,
                                                        required: true,
                                                        options: ['active', 'suspended', 'graduated', 'archived'].map((value) => ({
                                                            value,
                                                            label: labels[value],
                                                        })),
                                                    },
                                                    {
                                                        name: 'enrollment_status',
                                                        label: 'Statut de l’inscription',
                                                        type: 'select',
                                                        value: selected.status,
                                                        required: true,
                                                        options: ['pending_confirmation', 'confirmed', 'suspended', 'completed', 'cancelled'].map(
                                                            (value) => ({ value, label: labels[value] }),
                                                        ),
                                                    },
                                                    {
                                                        name: 'class_id',
                                                        label: 'Promotion / groupe',
                                                        type: 'select',
                                                        value: selected.class_id,
                                                        options: props.groups.map((group) => ({ value: group.id, label: group.intake.name })),
                                                    },
                                                    reason,
                                                ],
                                            )
                                        }
                                    >
                                        Affecter une promotion
                                    </button>
                                    <button
                                        className="admin-secondary"
                                        onClick={() =>
                                            show(
                                                'Exception d’affectation',
                                                'Permet d’inclure un cours optionnel ou d’exclure un enseignement de ce même niveau et de cette même année.',
                                                `${base}/${selected.id}/course-exceptions`,
                                                [
                                                    {
                                                        name: 'academic_offering_id',
                                                        label: 'Enseignement',
                                                        type: 'select',
                                                        required: true,
                                                        options: offeringOptions,
                                                    },
                                                    {
                                                        name: 'action',
                                                        label: 'Décision',
                                                        type: 'select',
                                                        required: true,
                                                        options: [
                                                            { value: 'include', label: 'Inclure (cours optionnel)' },
                                                            { value: 'exclude', label: 'Exclure' },
                                                        ],
                                                    },
                                                    reason,
                                                ],
                                            )
                                        }
                                    >
                                        Affectation individuelle
                                    </button>
                                </div>
                            </section>
                        )}
                    </>
                )}
                {tab === 'finance' &&
                    (selected && props.balance ? (
                        <>
                            <div data-dashboard-panel="tab academic">
                                <PaymentOverview balance={props.balance} />
                            </div>
                            <section className="portal-panel" data-dashboard-panel="tab academic">
                                <header>
                                    <div>
                                        <h2>Obligations financières</h2>
                                        <p className="portal-muted">
                                            Catégorie :{' '}
                                            {selected.category === 'national'
                                                ? 'Nationaux'
                                                : selected.category === 'foreign'
                                                  ? 'Étrangers'
                                                  : 'À confirmer'}
                                            . Les frais sont issus du barème enregistré sur le niveau.
                                        </p>
                                    </div>
                                    <button
                                        className="admin-primary"
                                        onClick={() =>
                                            show(
                                                'Établir les frais académiques',
                                                'Le compte est établi avec les deux tranches du barème existant. Une catégorie ne peut plus être modifiée après création d’un historique financier.',
                                                `${base}/${selected.id}/fees`,
                                                [
                                                    {
                                                        name: 'category',
                                                        label: 'Catégorie tarifaire confirmée',
                                                        type: 'select',
                                                        required: true,
                                                        options: [
                                                            { value: 'national', label: 'Nationaux' },
                                                            { value: 'foreign', label: 'Étrangers' },
                                                        ],
                                                    },
                                                    { name: 'first_due', label: 'Échéance de la première tranche', type: 'date' },
                                                    { name: 'second_due', label: 'Échéance de la deuxième tranche', type: 'date' },
                                                    reason,
                                                ],
                                            )
                                        }
                                    >
                                        <Settings2 size={15} />
                                        Établir les frais
                                    </button>
                                </header>
                                <button
                                    className="admin-secondary"
                                    onClick={() =>
                                        show(
                                            'Ajouter un frais complémentaire',
                                            'Indiquez une obligation réelle et sa référence au barème ou à la décision applicable. Les frais académiques restent établis par le barème du niveau.',
                                            `${base}/${selected.id}/obligations`,
                                            [
                                                { name: 'kind', label: 'Code du type de frais (ex. inscription)', required: true },
                                                { name: 'title', label: 'Libellé présenté à l’étudiant', required: true },
                                                { name: 'installment', label: 'Numéro de tranche', type: 'number', required: true, value: 1 },
                                                { name: 'amount', label: 'Montant (USD)', type: 'number', required: true },
                                                { name: 'due_at', label: 'Échéance', type: 'date' },
                                                reason,
                                            ],
                                        )
                                    }
                                >
                                    Ajouter une obligation complémentaire
                                </button>
                                {props.obligations.map((o) => (
                                    <div className="academic-fee-row" key={o.id}>
                                        <strong>{o.title}</strong>
                                        <span>{money(o.amount_cents)}</span>
                                        <small>{o.due_at ? formatDate(o.due_at) : 'Échéance non fixée'}</small>
                                    </div>
                                ))}
                                {!props.obligations.length && (
                                    <p className="portal-muted">Aucune obligation n’est encore établie. Confirmez la catégorie tarifaire.</p>
                                )}
                            </section>
                            <section className="portal-panel" data-dashboard-panel="tab academic">
                                <header>
                                    <h2>Versements et confirmations</h2>
                                    <button
                                        className="admin-primary"
                                        onClick={() =>
                                            show(
                                                'Enregistrer un versement à vérifier',
                                                'Ce versement restera en attente jusqu’à une confirmation comptable explicite, après vérification de la pièce justificative.',
                                                `${base}/${selected.id}/payments`,
                                                [
                                                    { ...feeKindField, name: 'kind' },
                                                    { name: 'amount', label: 'Montant reçu (USD)', type: 'number', required: true },
                                                    {
                                                        name: 'method',
                                                        label: 'Mode de versement',
                                                        type: 'select',
                                                        required: true,
                                                        options: [
                                                            { value: 'bank_transfer', label: 'Virement bancaire' },
                                                            { value: 'cash', label: 'Espèces' },
                                                            { value: 'other', label: 'Autre moyen vérifié' },
                                                        ],
                                                    },
                                                    { name: 'reference', label: 'Référence bancaire ou de caisse unique', required: true },
                                                    { name: 'note', label: 'Source et explication', type: 'textarea', required: true },
                                                ],
                                            )
                                        }
                                    >
                                        <Plus size={16} />
                                        Saisir un versement
                                    </button>
                                </header>
                                {props.payments.length ? (
                                    <div className="academic-table-scroll">
                                        <table className="academic-table">
                                            <thead>
                                                <tr>
                                                    <th>Référence</th>
                                                    <th>Montant</th>
                                                    <th>État</th>
                                                    <th>Traitement comptable</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {props.payments.map((payment) => (
                                                    <tr key={payment.id}>
                                                        <td>
                                                            {payment.reference}
                                                            <small>{payment.method}</small>
                                                        </td>
                                                        <td>
                                                            {money(payment.amount_cents, payment.currency)}
                                                            {payment.status === 'confirmed' && (
                                                                <Link href={route('dashboard.admin.finance.index', { academic: selected!.id })}>
                                                                    Remboursements avec autorisation
                                                                </Link>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`portal-status is-${payment.status}`}>
                                                                {labels[payment.status] || payment.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {payment.status === 'pending' && (
                                                                <button
                                                                    className="academic-link-button"
                                                                    onClick={() =>
                                                                        show(
                                                                            'Confirmer le versement',
                                                                            `${money(payment.amount_cents, payment.currency)} · ${payment.reference}. Confirmez uniquement après vérification de la pièce comptable ou du rapprochement bancaire.`,
                                                                            `${base}/payments/${payment.id}/status`,
                                                                            [
                                                                                {
                                                                                    name: 'status',
                                                                                    label: 'Décision',
                                                                                    type: 'select',
                                                                                    value: 'confirmed',
                                                                                    required: true,
                                                                                    options: [{ value: 'confirmed', label: 'Versement confirmé' }],
                                                                                },
                                                                                reason,
                                                                            ],
                                                                            'Confirmer après vérification',
                                                                        )
                                                                    }
                                                                >
                                                                    Confirmer après vérification
                                                                </button>
                                                            )}
                                                            {['pending', 'confirmed'].includes(payment.status) && (
                                                                <button
                                                                    className="academic-link-button"
                                                                    onClick={() =>
                                                                        show(
                                                                            'Corriger une écriture comptable',
                                                                            'Cette action corrige le registre. Elle n’exécute aucun transfert bancaire. Un remboursement ne doit être enregistré qu’après son exécution effective.',
                                                                            `${base}/payments/${payment.id}/status`,
                                                                            [
                                                                                {
                                                                                    name: 'status',
                                                                                    label: 'Décision comptable',
                                                                                    type: 'select',
                                                                                    required: true,
                                                                                    options: [
                                                                                        { value: 'cancelled', label: 'Annuler cette écriture' },
                                                                                    ],
                                                                                },
                                                                                reason,
                                                                            ],
                                                                        )
                                                                    }
                                                                >
                                                                    Annuler l’écriture
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <EmptyState title="Aucun versement saisi." icon={CreditCard}>
                                        Les écritures restent indépendantes de l’admission et ne débloquent aucun service tant qu’elles ne sont pas
                                        confirmées.
                                    </EmptyState>
                                )}
                            </section>
                            <section className="portal-panel" data-dashboard-panel="tab academic">
                                <header>
                                    <h2>Autorisations financières</h2>
                                </header>
                                <div className="academic-actions">
                                    {['exemption', 'scholarship', 'plan', 'override'].map((type) => (
                                        <button key={type} className="admin-secondary" onClick={() => openAdjustment(type)}>
                                            <Plus size={15} />
                                            {labels[type]}
                                        </button>
                                    ))}
                                </div>
                                {props.adjustments.map((adjustment) => (
                                    <article className="academic-adjustment" key={adjustment.id}>
                                        <div>
                                            <strong>
                                                {labels[adjustment.type]} {adjustment.amount_cents ? money(adjustment.amount_cents) : ''}
                                            </strong>
                                            <p>{adjustment.reason}</p>
                                            <small>
                                                {adjustment.expires_at ? `Fin : ${formatDate(adjustment.expires_at)}` : 'Sans date de fin'} ·{' '}
                                                {adjustment.is_active ? 'Active' : 'Révoquée'}
                                            </small>
                                        </div>
                                        {adjustment.is_active && (
                                            <button
                                                className="academic-link-button"
                                                onClick={() =>
                                                    show(
                                                        'Révoquer cette autorisation',
                                                        'Les droits seront réévalués lors du prochain accès.',
                                                        `${base}/adjustments/${adjustment.id}/revoke`,
                                                        [reason],
                                                    )
                                                }
                                            >
                                                Révoquer
                                            </button>
                                        )}
                                    </article>
                                ))}
                            </section>
                        </>
                    ) : (
                        <div data-dashboard-panel="tab academic">
                            <EmptyState title="Sélectionnez un étudiant." icon={GraduationCap}>
                                Ouvrez une inscription depuis l’onglet Étudiants pour consulter son compte financier.
                            </EmptyState>
                        </div>
                    ))}
                {tab === 'rules' && (
                    <section className="portal-panel" data-dashboard-panel="tab">
                        <header>
                            <div>
                                <h2>Des droits adaptés à chaque parcours</h2>
                                <p className="portal-muted">
                                    Les cours publiés, l’emploi du temps, le suivi des paiements et l’assistance restent consultables avant paiement.
                                    Les résultats et évaluations ne peuvent subir une restriction financière que sur référence explicite au règlement
                                    applicable.
                                </p>
                            </div>
                            <button className="admin-primary" onClick={() => openRule()}>
                                <Plus size={16} />
                                Nouvelle règle
                            </button>
                        </header>
                        {props.rules.length ? (
                            <div className="academic-rules">
                                {props.rules.map((rule) => (
                                    <article key={rule.id}>
                                        <ShieldCheck size={22} strokeWidth={1.4} />
                                        <div>
                                            <h3>{features.find((feature) => feature.value === rule.feature)?.label}</h3>
                                            <p>
                                                {modes.find((mode) => mode.value === rule.mode)?.label}
                                                {rule.minimum_cents ? ` · ${money(rule.minimum_cents)}` : ''}
                                            </p>
                                            <small>
                                                {rule.level_id ? props.levels.find((level) => level.id === rule.level_id)?.title : 'Tous les niveaux'}{' '}
                                                ·{' '}
                                                {rule.academic_year_id
                                                    ? props.years.find((year) => year.id === rule.academic_year_id)?.title
                                                    : 'Toutes les années'}
                                            </small>
                                            {rule.regulation_reference && <p>Règlement : {rule.regulation_reference}</p>}
                                        </div>
                                        <button className="academic-link-button" onClick={() => openRule(rule)}>
                                            Remplacer par une nouvelle règle
                                        </button>
                                        <button
                                            className="academic-link-button"
                                            onClick={() =>
                                                show(
                                                    'Désactiver cette règle',
                                                    'Le périmètre héritera des autres règles applicables, ou des conditions par défaut si aucune règle ne s’applique.',
                                                    `${base}/rules/${rule.id}/deactivate`,
                                                    [reason],
                                                )
                                            }
                                        >
                                            Désactiver
                                        </button>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="Aucune règle financière n’est encore définie." icon={ShieldCheck}>
                                Les services essentiels sont ouverts. Les dépôts, supports et demandes réglementées attendent une configuration
                                explicite ; aucun seuil arbitraire n’est appliqué.
                            </EmptyState>
                        )}
                    </section>
                )}
                {tab === 'teaching' && (
                    <>
                        <section className="portal-panel" data-dashboard-panel="tab">
                            <header>
                                <div>
                                    <h2>Les enseignements publiés</h2>
                                    <p className="portal-muted">
                                        L’affectation se fait par niveau et année, avec un groupe et un enseignant si disponibles.
                                    </p>
                                </div>
                                <div className="academic-actions">
                                    <button
                                        className="admin-primary"
                                        onClick={() =>
                                            show(
                                                'Affecter un enseignement',
                                                'Un enseignement non publié reste invisible aux étudiants.',
                                                `${base}/offerings`,
                                                [
                                                    {
                                                        name: 'course_id',
                                                        label: 'Matière du catalogue',
                                                        type: 'select',
                                                        clears: 'academic_department_id',
                                                        required: true,
                                                        options: props.courses.map((course) => ({ value: course.id, label: course.title })),
                                                    },
                                                    {
                                                        name: 'academic_year_id',
                                                        label: 'Année académique',
                                                        type: 'select',
                                                        required: true,
                                                        options: optionsYears,
                                                    },
                                                    {
                                                        name: 'academic_department_id',
                                                        label: 'Public de l’enseignement',
                                                        type: 'select',
                                                        optionsFor: ({ course_id }) => {
                                                            const course = props.courses.find(({ id }) => id === Number(course_id));
                                                            return (
                                                                props.levels
                                                                    .find(({ id }) => id === course?.level_id)
                                                                    ?.department_options.map(({ id, name }) => ({ value: id, label: name })) ?? []
                                                            );
                                                        },
                                                    },
                                                    {
                                                        name: 'professor_id',
                                                        label: 'Enseignant',
                                                        type: 'select',
                                                        options: props.professors.map((professor) => ({
                                                            value: professor.id,
                                                            label: `${professor.first_name} ${professor.last_name}`,
                                                        })),
                                                    },
                                                    {
                                                        name: 'class_id',
                                                        label: 'Groupe (si un étudiant du niveau est sélectionné)',
                                                        type: 'select',
                                                        options: props.groups.map((group) => ({ value: group.id, label: group.intake.name })),
                                                    },
                                                    { name: 'semester', label: 'Semestre / période' },
                                                    {
                                                        name: 'is_optional',
                                                        label: 'Cours optionnel (affectation individuelle requise)',
                                                        type: 'checkbox',
                                                    },
                                                    { name: 'is_published', label: 'Publier pour les étudiants concernés', type: 'checkbox' },
                                                ],
                                            )
                                        }
                                    >
                                        <Plus size={15} />
                                        Enseignement
                                    </button>
                                </div>
                            </header>
                            <div className="academic-offerings">
                                {props.offerings.map((offering) => (
                                    <article key={offering.id}>
                                        <div>
                                            <strong>{offering.course.title}</strong>
                                            <p>
                                                {props.years.find((year) => year.id === offering.academic_year_id)?.title} ·{' '}
                                                {offering.semester || 'Période non définie'} · {offering.department?.name ?? 'Tronc commun'} ·{' '}
                                                {offering.professor
                                                    ? `${offering.professor.first_name} ${offering.professor.last_name}`
                                                    : 'Enseignant à affecter'}
                                            </p>
                                        </div>
                                        <span className="portal-status">
                                            {offering.is_published ? 'Publié' : 'Brouillon'}
                                            {offering.is_optional ? ' · Optionnel' : ''}
                                        </span>
                                        <button
                                            className="academic-link-button"
                                            onClick={() => publish('offerings', offering.id, offering.is_published, offering.course.title)}
                                        >
                                            {offering.is_published ? 'Dépublier' : 'Publier'}
                                        </button>
                                    </article>
                                ))}
                            </div>
                            {!props.offerings.length && (
                                <EmptyState title="Aucun enseignement affecté à une année." icon={BookOpen}>
                                    Les matières du catalogue ne sont pas automatiquement des enseignements publiés.
                                </EmptyState>
                            )}
                        </section>
                        <section className="portal-panel" data-dashboard-panel="tab">
                            <header>
                                <h2>Ressources, travaux et publications</h2>
                                <button
                                    className="admin-primary"
                                    onClick={() =>
                                        show(
                                            'Publier une ressource',
                                            'Les fichiers restent privés. Pour un résultat ou un document personnel, sélectionnez d’abord l’étudiant concerné dans la liste.',
                                            `${base}/resources`,
                                            [
                                                {
                                                    name: 'academic_offering_id',
                                                    label: 'Enseignement',
                                                    type: 'select',
                                                    required: true,
                                                    options: offeringOptions,
                                                },
                                                {
                                                    name: 'kind',
                                                    label: 'Type de publication',
                                                    type: 'select',
                                                    required: true,
                                                    options: [
                                                        { value: 'material', label: 'Support pédagogique' },
                                                        { value: 'assignment', label: 'Travail / devoir' },
                                                        { value: 'evaluation', label: 'Évaluation' },
                                                        { value: 'online', label: 'Cours en ligne' },
                                                        { value: 'video', label: 'Vidéo' },
                                                        { value: 'result', label: 'Résultat personnel' },
                                                        { value: 'announcement', label: 'Annonce' },
                                                        { value: 'document', label: 'Document personnel' },
                                                    ],
                                                },
                                                {
                                                    name: 'student_profile_id',
                                                    label: 'Destinataire personnel (obligatoire pour un résultat ou document)',
                                                    type: 'select',
                                                    options: selected ? [{ value: selected.profile_id, label: selected.name }] : [],
                                                },
                                                { name: 'title', label: 'Titre', required: true },
                                                { name: 'body', label: 'Contenu / consignes', type: 'textarea' },
                                                { name: 'url', label: 'Lien (obligatoire pour un cours en ligne ou une vidéo)', type: 'url' },
                                                { name: 'file', label: 'Fichier privé', type: 'file' },
                                                { name: 'opens_at', label: 'Ouverture du dépôt', type: 'datetime-local' },
                                                { name: 'closes_at', label: 'Fin du dépôt', type: 'datetime-local' },
                                                { name: 'is_published', label: 'Publier', type: 'checkbox' },
                                            ],
                                        )
                                    }
                                >
                                    <Plus size={15} />
                                    Ressource
                                </button>
                            </header>
                            {props.resources.map((resource) => (
                                <article className="academic-offering-row" key={resource.id}>
                                    <div>
                                        <strong>{resource.title}</strong>
                                        <small>
                                            {resource.kind} · {resource.is_published ? 'Publié' : 'Brouillon'}
                                        </small>
                                    </div>
                                    {resource.assessment_exists ? (
                                        <Link
                                            className="academic-link-button"
                                            href={route('dashboard.admin.assessments.index', { resource: resource.id })}
                                        >
                                            Ouvrir l’évaluation
                                        </Link>
                                    ) : (
                                        <button
                                            className="academic-link-button"
                                            onClick={() => publish('resources', resource.id, resource.is_published, resource.title)}
                                        >
                                            {resource.is_published ? 'Dépublier' : 'Publier'}
                                        </button>
                                    )}
                                </article>
                            ))}
                        </section>
                        <section className="portal-panel" data-dashboard-panel="tab">
                            <header>
                                <h2>Emploi du temps</h2>
                                <Link className="admin-secondary" href="/dashboard/admin/schedule">
                                    Gérer les horaires
                                </Link>
                                <button
                                    className="admin-primary"
                                    onClick={() =>
                                        show(
                                            'Planifier une séance',
                                            'Les horaires sont saisis à l’heure de Kinshasa et affichés aux étudiants du groupe concerné.',
                                            `${base}/sessions`,
                                            [
                                                {
                                                    name: 'academic_offering_id',
                                                    label: 'Enseignement',
                                                    type: 'select',
                                                    required: true,
                                                    options: offeringOptions,
                                                },
                                                { name: 'starts_at', label: 'Début', type: 'datetime-local', required: true },
                                                { name: 'ends_at', label: 'Fin', type: 'datetime-local', required: true },
                                                { name: 'room', label: 'Salle / lieu', required: true },
                                                { name: 'is_published', label: 'Publier la séance', type: 'checkbox' },
                                            ],
                                        )
                                    }
                                >
                                    <Plus size={15} />
                                    Séance
                                </button>
                            </header>
                            {props.sessions.map((session) => (
                                <article className="academic-offering-row" key={session.id}>
                                    <div>
                                        <strong>{session.offering.course.title}</strong>
                                        <small>
                                            {formatDate(session.starts_at, true)} · {session.room} · {session.is_published ? 'Publiée' : 'Brouillon'}
                                        </small>
                                    </div>
                                    <button
                                        className="academic-link-button"
                                        onClick={() => publish('sessions', session.id, session.is_published, session.offering.course.title)}
                                    >
                                        {session.is_published ? 'Dépublier' : 'Publier'}
                                    </button>
                                </article>
                            ))}
                        </section>
                    </>
                )}
                {tab === 'teaching' && selected && (
                    <section className="portal-panel" data-dashboard-panel="tab academic">
                        <h2>Travaux de {selected.name}</h2>
                        {props.submissions.length ? (
                            props.submissions.map((work) => (
                                <article className="academic-ticket" key={work.id}>
                                    <div>
                                        <h3>{work.title}</h3>
                                        <small>
                                            {formatDate(work.submitted_at, true)} · <Link href={work.version_url}>Version {work.version}</Link>
                                        </small>
                                        {work.body && <p>{work.body}</p>}
                                        {work.download_url && (
                                            <a href={work.download_url} className="academic-link-button">
                                                Télécharger le dépôt : {work.filename}
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))
                        ) : (
                            <EmptyState title="Aucun travail transmis pour cet étudiant.">
                                Les dépôts autorisés sont conservés dans cet espace sécurisé.
                            </EmptyState>
                        )}
                    </section>
                )}
                {tab === 'requests' && (
                    <section className="portal-panel" data-dashboard-panel="tab">
                        <h2>Demandes et réclamations</h2>
                        {props.requests.length ? (
                            props.requests.map((ticket) => (
                                <article className="academic-ticket" key={ticket.id}>
                                    <div>
                                        <span className="portal-status">{labels[ticket.status]}</span>
                                        <h3>{ticket.subject}</h3>
                                        <small>
                                            {ticket.student_name} · {formatDate(ticket.created_at)}
                                        </small>
                                        <p>{ticket.body}</p>
                                        {ticket.response && <p className="academic-response">{ticket.response}</p>}
                                    </div>
                                    <button
                                        className="admin-secondary"
                                        onClick={() =>
                                            show(
                                                'Répondre à cette demande',
                                                'La réponse sera visible dans l’espace de cet étudiant uniquement.',
                                                `${base}/requests/${ticket.id}/reply`,
                                                [
                                                    {
                                                        name: 'response',
                                                        label: 'Votre réponse',
                                                        type: 'textarea',
                                                        required: true,
                                                        value: ticket.response || '',
                                                    },
                                                    {
                                                        name: 'status',
                                                        label: 'Suivi',
                                                        type: 'select',
                                                        required: true,
                                                        value: ticket.status,
                                                        options: [
                                                            { value: 'open', label: 'En cours' },
                                                            { value: 'resolved', label: 'Résolue' },
                                                        ],
                                                    },
                                                ],
                                            )
                                        }
                                    >
                                        Répondre
                                    </button>
                                </article>
                            ))
                        ) : (
                            <EmptyState title="Aucune demande en attente." icon={MessageSquare}>
                                Les échanges créés dans l’espace étudiant apparaîtront ici.
                            </EmptyState>
                        )}
                    </section>
                )}
                {props.audit.length > 0 && (
                    <details className="academic-audit">
                        <summary>
                            <ClipboardCheck size={16} />
                            Journal des opérations récentes
                        </summary>
                        <div>
                            {props.audit.map((event) => (
                                <p key={event.id}>
                                    <strong>{auditLabels[event.action] || event.action}</strong>
                                    <span>
                                        {formatDate(event.created_at, true)} · Responsable : {event.actor_name}
                                    </span>
                                    {event.reason && <small>{event.reason}</small>}
                                </p>
                            ))}
                        </div>
                    </details>
                )}
            </div>
            {spec && (
                <AcademicForm
                    spec={spec}
                    onClose={() => setSpec(null)}
                    onSuccess={(message) => {
                        setSpec(null);
                        setToast({ id: ++sequence.current, message, tone: 'success' });
                    }}
                />
            )}
        </Dashboard>
    );
}
