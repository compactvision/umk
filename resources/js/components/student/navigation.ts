import { BookOpen, ClipboardCheck, House, Landmark, Library, MessagesSquare, UserRound, Wallet } from 'lucide-react';
import type { Permission } from './types';

type StudentNavigationItem = { label: string; section: string; hash?: string };
type StudentModule = {
    id: string;
    title: string;
    icon: typeof House;
    description: string;
    sections: string[];
    items: StudentNavigationItem[];
};

export const studentModules: StudentModule[] = [
    {
        id: 'overview',
        title: 'Vue d’ensemble',
        icon: House,
        description: 'Vos priorités et votre journée.',
        sections: ['overview'],
        items: [
            { label: 'Tableau de bord', section: 'overview' },
            { label: 'Horaire sur le tableau de bord', section: 'overview', hash: 'home-schedule' },
        ],
    },
    {
        id: 'academics',
        title: 'Mes études',
        icon: BookOpen,
        description: 'Votre programme et vos enseignements.',
        sections: ['academics', 'courses', 'schedule', 'absences', 'assignments', 'evaluations'],
        items: [
            { label: 'Programme académique', section: 'academics' },
            { label: 'Mes cours', section: 'courses' },
            { label: 'Emploi du temps', section: 'schedule' },
            { label: 'Justification des absences', section: 'absences' },
            { label: 'Devoirs et travaux', section: 'assignments' },
            { label: 'Évaluations', section: 'evaluations' },
        ],
    },
    {
        id: 'assessments',
        title: 'Résultats',
        icon: ClipboardCheck,
        description: 'Notes, crédits et décisions du jury.',
        sections: ['results', 'assessments'],
        items: [
            { label: 'Notes et bulletins', section: 'results' },
            { label: 'Évaluations et résultats', section: 'assessments' },
        ],
    },
    {
        id: 'services',
        title: 'Administration',
        icon: Landmark,
        description: 'Vos inscriptions et démarches.',
        sections: ['services', 'enrollments', 'documents', 'requests'],
        items: [
            { label: 'Démarches administratives', section: 'services' },
            { label: 'Inscriptions', section: 'enrollments' },
            { label: 'Documents', section: 'documents' },
            { label: 'Demandes administratives', section: 'requests' },
        ],
    },
    {
        id: 'fees',
        title: 'Finances',
        icon: Wallet,
        description: 'Votre situation et vos paiements.',
        sections: ['fees', 'transactions'],
        items: [
            { label: 'Situation financière et échéancier', section: 'fees' },
            { label: 'Historique des paiements et reçus', section: 'transactions' },
        ],
    },
    {
        id: 'communication',
        title: 'Communication',
        icon: MessagesSquare,
        description: 'Les annonces de votre établissement.',
        sections: ['announcements'],
        items: [{ label: 'Annonces', section: 'announcements' }],
    },
    {
        id: 'resources',
        title: 'Ressources',
        icon: Library,
        description: 'Les supports de vos enseignements.',
        sections: ['materials'],
        items: [{ label: 'Supports de cours', section: 'materials' }],
    },
    {
        id: 'profile',
        title: 'Mon compte',
        icon: UserRound,
        description: 'Votre profil et votre carte étudiante.',
        sections: ['profile', 'card'],
        items: [
            { label: 'Profil', section: 'profile' },
            { label: 'Carte étudiante NFC', section: 'card' },
        ],
    },
];

export const studentSectionLabels: Record<string, string> = {
    overview: 'Tableau de bord',
    profile: 'Profil',
    card: 'Carte étudiante NFC',
    documents: 'Documents',
    academics: 'Programme académique',
    courses: 'Mes cours',
    schedule: 'Emploi du temps',
    absences: 'Justification des absences',
    materials: 'Supports de cours',
    assignments: 'Devoirs et travaux',
    assessments: 'Résultats',
    evaluations: 'Évaluations',
    results: 'Notes et bulletins',
    fees: 'Situation financière',
    transactions: 'Historique des paiements et reçus',
    services: 'Démarches administratives',
    enrollments: 'Mes inscriptions académiques',
    requests: 'Demandes administratives',
    announcements: 'Annonces',
};

// Match the page-level decisions in StudentPortalController::show.
const pagePermissions: Record<string, string> = {
    courses: 'courses_view',
    schedule: 'schedule_view',
    materials: 'courses_view',
    assignments: 'courses_view',
    evaluations: 'courses_view',
    announcements: 'courses_view',
    results: 'results_view',
};

const sectionVisibility: Record<string, string> = {
    materials: 'materials_download',
    assignments: 'assignments_submit',
    evaluations: 'evaluations_participate',
};

export function studentSectionAccess(section: string, permissions?: Record<string, Permission>) {
    const pagePermission = pagePermissions[section];
    const decision = permissions?.[pagePermission];
    const visibility = permissions?.[sectionVisibility[section]];
    return {
        visible: decision?.visible !== false && visibility?.visible !== false,
        allowed: !pagePermission || decision?.allowed === true,
        reason: decision?.reason ?? (pagePermission && !decision ? 'Consultez la vue d’ensemble pour vérifier votre accès.' : null),
    };
}

export function studentHref(section: string, academic?: number, hash?: string) {
    const accountWide = section === 'enrollments' || section === 'absences';
    const context = academic !== undefined && !accountWide ? `?academic=${academic}` : '';
    return `/dashboard/student/${section}${context}${hash ? `#${hash}` : ''}`;
}
