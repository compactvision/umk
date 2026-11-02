import { Link } from '@inertiajs/react';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { Permission } from './types';

type Item = { title: string; description: string; section?: string; feature?: string };
const content: Record<string, { intro: string; items: Item[] }> = {
    profile: {
        intro: 'Vos repères académiques figurent dans votre fiche ci-dessus. Retrouvez ici votre dossier et les prochains services liés à votre identité étudiante.',
        items: [
            {
                title: 'Documents et dossier d’inscription',
                description: 'Retrouvez vos pièces déposées et votre dossier d’origine.',
                section: 'documents',
            },
            { title: 'Historique de mes inscriptions', description: 'Consultez vos dossiers et leur suivi année par année.', section: 'enrollments' },
            { title: 'Coordonnées et personne à prévenir', description: 'Gestion de vos contacts et de votre contact d’urgence.' },
            { title: 'Carte d’étudiant numérique', description: 'Carte personnelle avec un QR code vérifiable.' },
        ],
    },
    academics: {
        intro: 'Organisez votre apprentissage à partir des enseignements publiés pour votre parcours.',
        items: [
            { title: 'Mes cours', description: 'Enseignements, crédits et titulaires publiés.', section: 'courses', feature: 'courses_view' },
            {
                title: 'Emploi du temps',
                description: 'Séances et salles communiquées par votre équipe pédagogique.',
                section: 'schedule',
                feature: 'schedule_view',
            },
            {
                title: 'Supports de cours',
                description: 'Ressources pédagogiques classées par enseignement.',
                section: 'materials',
                feature: 'materials_download',
            },
            {
                title: 'Travaux et devoirs',
                description: 'Consignes, dates limites et dépôt de vos travaux.',
                section: 'assignments',
                feature: 'assignments_submit',
            },
            { title: 'Présences et absences', description: 'Taux de présence et justification des absences.' },
            { title: 'Structure UE / EC', description: 'Unités d’enseignement, éléments constitutifs et volumes horaires.' },
        ],
    },
    assessments: {
        intro: 'Retrouvez les évaluations et résultats publiés pour vous. Les moyennes et décisions officielles seront développées dans ce module.',
        items: [
            {
                title: 'Mes évaluations',
                description: 'Consultez les évaluations publiées pour votre parcours.',
                section: 'evaluations',
                feature: 'evaluations_participate',
            },
            {
                title: 'Mes résultats',
                description: 'Vos résultats personnels publiés par l’équipe pédagogique.',
                section: 'results',
                feature: 'results_view',
            },
            { title: 'Réclamation', description: 'Adressez une demande à l’administration et suivez sa réponse.', section: 'requests' },
            { title: 'Notes par session et moyennes', description: 'TD, TP, interrogations, examens, mentions et crédits validés.' },
            { title: 'Délibérations et relevé officiel', description: 'Décisions du jury et relevé de notes téléchargeable.' },
            { title: 'Calendrier et convocations', description: 'Dates d’examens et convocations personnelles.' },
        ],
    },
    services: {
        intro: 'Un point d’entrée pour vos démarches et vos échanges avec l’administration.',
        items: [
            {
                title: 'Déposer une demande',
                description: 'Assistance, demande financière, recours ou demande de document selon vos droits.',
                section: 'requests',
            },
            { title: 'Mes documents', description: 'Consultez les documents publiés et retrouvez votre dossier.', section: 'documents' },
            { title: 'Attestations et diplômes', description: 'Catalogue de démarches et délivrance des documents officiels.' },
            { title: 'Changement de parcours ou transfert', description: 'Demandes de changement de faculté ou d’option et transferts.' },
            { title: 'Congé académique ou abandon', description: 'Demandes encadrées et suivi administratif.' },
            { title: 'Suivi des documents à retirer', description: 'Étapes de traitement et notification de disponibilité.' },
        ],
    },
};
export default function ModuleLanding({
    section,
    academic,
    permissions,
}: {
    section: string;
    academic: number;
    permissions: Record<string, Permission>;
}) {
    const module = content[section];
    if (!module) return null;
    return (
        <div className="portal-module-landing">
            <p className="portal-module-intro">{module.intro}</p>
            <div className="portal-module-grid">
                {module.items
                    .filter((item) => !item.feature || permissions[item.feature]?.visible !== false)
                    .map((item) => {
                        const allowed = !item.feature || permissions[item.feature]?.allowed;
                        const url =
                            item.section === 'enrollments' ? '/dashboard/enrollments' : `/dashboard/student/${item.section}?academic=${academic}`;
                        return (
                            <article key={item.title} className={`portal-module-card ${item.section ? '' : 'is-planned'}`}>
                                <span className="portal-module-state">
                                    {item.section ? (
                                        allowed ? (
                                            'Disponible'
                                        ) : (
                                            'Accès sous condition'
                                        )
                                    ) : (
                                        <>
                                            <Clock3 size={13} />À développer
                                        </>
                                    )}
                                </span>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                                {item.section && (
                                    <Link href={allowed ? url : `/dashboard/student/fees?academic=${academic}`}>
                                        {allowed ? 'Ouvrir' : 'Consulter les conditions'}
                                        <ArrowUpRight size={16} />
                                    </Link>
                                )}
                            </article>
                        );
                    })}
            </div>
        </div>
    );
}
