import {
    BarChart3,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    Clock,
    FileText,
    Gavel,
    GraduationCap,
    Headphones,
    IdCard,
    Landmark,
    LayoutDashboard,
    Megaphone,
    NotebookPen,
    Settings,
    Users,
    Wallet,
} from 'lucide-react';

type Destination = { href: string; anyPermission?: string[]; institutionWide?: boolean; native?: boolean };
type Entry = [label: string, destination: Destination];

const admin = '/dashboard/admin';
const access = 'manage academic access';
const publish = 'publish academic content';
const finance = 'manage academic finance';
const destination = (path: string, ...anyPermission: string[]): Destination => ({ href: `${admin}/${path}`, anyPermission });
const studentPermissions = [access, finance, publish];
const renewals = destination('student-academic/renewals', access, finance, publish);
const teaching = destination('teaching', access, publish);
const manageResults = 'manage academic results';
const publishResults = 'publish official results';
const results = (query = '') => destination('academic-results' + query, manageResults, 'deliberate academic results', publishResults);
const documents = (query = '') =>
    destination('official-documents' + query, 'manage official documents', 'approve official documents', 'issue official documents');
const requests = destination('student-academic?tab=requests', access);
const rules = destination('student-academic?tab=rules', access);
const institution = destination('academic-structure?tab=institution', access, publish);
const programs = destination('academic-structure?tab=programs', access, publish);
const curricula = destination('academic-structure?tab=curriculum', access, publish);
const years = destination('academic-years');
const schedule = destination('schedule', publish);
const admissions = destination('enrollments', access);

export const adminNavigation: { id: string; title: string; shortLabel: string; icon: typeof BarChart3; items: Entry[] }[] = [
    {
        id: 'vue-ensemble',
        title: 'Vue d’ensemble',
        shortLabel: 'Vue d’ensemble',
        icon: LayoutDashboard,
        items: [['Tableau de bord', { href: '/dashboard' }]],
    },
    {
        id: 'structure',
        title: 'Structure universitaire',
        shortLabel: 'Structure',
        icon: Landmark,
        items: [
            ['Établissement', institution],
            ['Facultés et départements', destination('faculties')],
            ['Niveaux', destination('levels')],
            ['Programmes, cycles et promotions', programs],
            ['Maquettes pédagogiques', curricula],
        ],
    },
    {
        id: 'annees',
        title: 'Années académiques',
        shortLabel: 'Années académiques',
        icon: CalendarDays,
        items: [
            ['Années académiques', years],
            ['Semestres et périodes', destination('academic-years/semesters', publish)],
            ['Calendrier académique', destination('academic-years/calendar', publish)],
        ],
    },
    {
        id: 'admissions',
        title: 'Admissions',
        shortLabel: 'Admissions',
        icon: ClipboardCheck,
        items: [
            ['Vue d’ensemble', destination('enrollments/overview', access)],
            ['Toutes les candidatures', admissions],
            ['Campagnes d’admission', destination('enrollments/campaigns', access)],
            ['À traiter', destination('enrollments?queue=new', access)],
            ['Décisions', destination('enrollments?queue=decisions', access)],
        ],
    },
    {
        id: 'etudiants',
        title: 'Étudiants',
        shortLabel: 'Étudiants',
        icon: Users,
        items: [['Répertoire et dossiers étudiants', destination('student-academic?tab=students', ...studentPermissions)]],
    },
    {
        id: 'inscriptions',
        title: 'Inscriptions',
        shortLabel: 'Inscriptions',
        icon: GraduationCap,
        items: [
            ['Inscriptions confirmées', destination('student-academic?tab=students&enrollment_status=confirmed', ...studentPermissions)],
            [
                'Inscriptions en attente',
                destination('student-academic?tab=students&enrollment_status=pending_confirmation', ...studentPermissions),
            ],
            ['Réinscriptions', renewals],
            ['Progression académique', destination('progression', access, publish, 'manage academic progression', 'approve academic progression')],
            ['Situations, affectations et transferts', destination('student-academic/administration', ...studentPermissions)],
            ['Suspensions', destination('student-academic/administration?status=suspended', ...studentPermissions)],
            ['Congés', destination('student-academic/administration?status=on_leave', ...studentPermissions)],
            ['Clôture administrative', { ...destination('student-academic/administration/closure', access), institutionWide: true }],
            ['Historique des inscriptions', destination('student-academic?tab=students&history=1', ...studentPermissions)],
        ],
    },
    {
        id: 'cartes',
        title: 'Cartes étudiantes',
        shortLabel: 'Cartes',
        icon: IdCard,
        items: [
            ['Modèles de cartes', destination('card-templates', access)],
            ['Demandes et éligibilité', destination('card-requests', access)],
            ['Génération et impression', destination('card-issuance/printing', access)],
            ['Délivrance', destination('card-issuance/delivery', access)],
            ['Cartes officielles et vérification', documents('?kind=card')],
        ],
    },
    {
        id: 'enseignements',
        title: 'Enseignements',
        shortLabel: 'Cours',
        icon: BookOpen,
        items: [
            ['Catalogue des cours', destination('course-catalog')],
            ['Offres et inscriptions pédagogiques', teaching],
            ['Annuaire des enseignants', destination('professors')],
            ['Supports pédagogiques', destination('teaching/resources', publish)],
        ],
    },
    {
        id: 'planification',
        title: 'Planification',
        shortLabel: 'Planning',
        icon: Clock,
        items: [
            ['Emplois du temps et séances', schedule],
            ['Salles et disponibilités', { ...destination('schedule/resources', publish), institutionWide: true }],
            ['Justifications d’absence', destination('schedule/absences', access)],
        ],
    },
    {
        id: 'evaluations',
        title: 'Évaluations et notes',
        shortLabel: 'Notes',
        icon: NotebookPen,
        items: [
            ['Évaluations, devoirs et barèmes', destination('assessments', publish)],
            ['Corrections et validation pédagogique', destination('assessments?state=closed', publish)],
            ['Résultats pédagogiques transmis', { ...destination('assessments/handoff', publish), native: true }],
            ['Publication des résultats officiels', results('?state=approved')],
            ['Recours sur résultats officiels', destination('academic-results#recours', manageResults, publishResults)],
        ],
    },
    {
        id: 'deliberations',
        title: 'Délibérations',
        shortLabel: 'Jurys',
        icon: Gavel,
        items: [
            ['Règlements et sessions de jury', results()],
            ['Procès-verbaux et historique', results('?state=published')],
            ['Sessions ouvertes', results('?state=open')],
        ],
    },
    {
        id: 'finances',
        title: 'Finances',
        shortLabel: 'Finances',
        icon: Wallet,
        items: [
            ['Comptes étudiants, paiements et échéanciers', destination('finance', finance)],
            ['Confirmation des inscriptions', destination('finance/confirmations', finance)],
            ['Barèmes des frais', destination('finance#tariffs', finance)],
            ['Rapprochements', destination('finance#reconciliation', finance)],
        ],
    },
    {
        id: 'documents',
        title: 'Documents officiels',
        shortLabel: 'Documents',
        icon: FileText,
        items: [
            ['Registre et émission', documents()],
            ['Attestations', documents('?kind=enrollment')],
            ['Certificats', documents('?kind=schooling')],
            ['Diplômes', documents('?kind=diploma')],
        ],
    },
    {
        id: 'communication',
        title: 'Communication',
        shortLabel: 'Annonces',
        icon: Megaphone,
        items: [['Annonces', destination('posts')]],
    },
    {
        id: 'assistance',
        title: 'Demandes et assistance',
        shortLabel: 'Assistance',
        icon: Headphones,
        items: [['Demandes et réclamations', requests]],
    },
    {
        id: 'rapports',
        title: 'Rapports et statistiques',
        shortLabel: 'Rapports',
        icon: BarChart3,
        items: [
            ['Indicateurs des enseignements', destination('teaching#reports', access, publish)],
            ['Rapports de présence', destination('schedule/reports', access, publish)],
            ['Indicateurs et exports financiers', destination('finance#reports', finance)],
        ],
    },
    {
        id: 'parametres',
        title: 'Paramètres',
        shortLabel: 'Paramètres',
        icon: Settings,
        items: [
            ['Paramètres du site public', destination('site')],
            ['Règles académiques', rules],
            ['Paramètres financiers', destination('finance#settings', finance)],
            ['Référencement et pages légales', destination('seo')],
        ],
    },
];
