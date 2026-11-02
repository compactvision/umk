import { BookOpen, ClipboardCheck, House, Landmark, UserRound, Wallet } from 'lucide-react';

export const studentModules = [
    { id: 'overview', title: 'Accueil', icon: House, description: 'Votre parcours en un regard.', sections: ['overview', 'announcements'] },
    {
        id: 'profile',
        title: 'Mon profil',
        icon: UserRound,
        description: 'Identité, parcours et dossier étudiant.',
        sections: ['profile', 'documents'],
    },
    {
        id: 'academics',
        title: 'Pédagogie',
        icon: BookOpen,
        description: 'Enseignements, horaires et activités.',
        sections: ['academics', 'courses', 'schedule', 'materials', 'assignments'],
    },
    {
        id: 'assessments',
        title: 'Notes et examens',
        icon: ClipboardCheck,
        description: 'Évaluations et résultats de votre formation.',
        sections: ['assessments', 'evaluations', 'results'],
    },
    { id: 'fees', title: 'Finances', icon: Wallet, description: 'Frais, échéances et versements.', sections: ['fees', 'transactions'] },
    {
        id: 'services',
        title: 'Guichet administratif',
        icon: Landmark,
        description: 'Démarches, demandes et assistance.',
        sections: ['services', 'requests'],
    },
];
export const studentSectionLabels: Record<string, string> = {
    overview: 'Vue d’ensemble',
    announcements: 'Annonces',
    profile: 'Mon profil',
    documents: 'Mes documents',
    academics: 'Vue pédagogique',
    courses: 'Mes cours',
    schedule: 'Emploi du temps',
    materials: 'Supports de cours',
    assignments: 'Travaux et devoirs',
    assessments: 'Vue des évaluations',
    evaluations: 'Évaluations',
    results: 'Mes résultats',
    fees: 'Frais et échéances',
    transactions: 'Transactions et reçus',
    services: 'Mes démarches',
    requests: 'Demandes et réclamations',
};
