import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, CalendarDays, ClipboardList, FolderOpen, LockKeyhole } from 'lucide-react';
import { studentHref, studentSectionAccess } from './navigation';
import type { Permission } from './types';

type Item = { title: string; description: string; section: string };
const content: Record<string, { intro: string; items: Item[] }> = {
    academics: {
        intro: 'Organisez votre apprentissage à partir des enseignements publiés pour votre parcours.',
        items: [
            { title: 'Mes cours', description: 'Enseignements, crédits et titulaires publiés.', section: 'courses' },
            {
                title: 'Emploi du temps',
                description: 'Séances et salles communiquées par votre équipe pédagogique.',
                section: 'schedule',
            },
            {
                title: 'Supports de cours',
                description: 'Ressources pédagogiques classées par enseignement.',
                section: 'materials',
            },
            {
                title: 'Travaux et devoirs',
                description: 'Consignes, dates limites et dépôt de vos travaux.',
                section: 'assignments',
            },
        ],
    },
    assessments: {
        intro: 'Retrouvez vos évaluations, vos résultats publiés et les décisions officielles.',
        items: [
            {
                title: 'Mes devoirs',
                description: 'Remises, versions des travaux et corrections disponibles.',
                section: 'assignments',
            },
            {
                title: 'Mes évaluations',
                description: 'Consultez les évaluations publiées pour votre parcours.',
                section: 'evaluations',
            },
            {
                title: 'Mes résultats',
                description: 'Notes, crédits, décisions du jury et relevés officiels publiés.',
                section: 'results',
            },
            { title: 'Réclamation', description: 'Adressez une demande à l’administration et suivez sa réponse.', section: 'requests' },
        ],
    },
    services: {
        intro: 'Un point d’entrée pour vos démarches et vos échanges avec l’administration.',
        items: [
            {
                title: 'Mes inscriptions académiques',
                description: 'Situation annuelle, historique et réinscriptions autorisées.',
                section: 'enrollments',
            },
            {
                title: 'Déposer une demande',
                description: 'Assistance, demande financière, recours ou demande de document selon vos droits.',
                section: 'requests',
            },
            {
                title: 'Mes documents',
                description: 'Consultez les documents publiés et suivez vos demandes d’attestation ou de diplôme.',
                section: 'documents',
            },
            {
                title: 'Changement de parcours ou transfert',
                description: 'Adressez votre demande à la scolarité pour examen et décision.',
                section: 'requests',
            },
            { title: 'Congé académique ou abandon', description: 'Déposez une demande et consultez la réponse administrative.', section: 'requests' },
        ],
    },
};
const academicIcons = { courses: BookOpen, schedule: CalendarDays, materials: FolderOpen, assignments: ClipboardList };

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
    const items = module.items
        .map((item) => ({ ...item, access: studentSectionAccess(item.section, permissions) }))
        .filter((item) => item.access.visible);
    const conditionsUrl = studentHref('fees', academic);

    if (section === 'academics') {
        return (
            <div className="portal-academic-card-grid">
                {items.map((item) => {
                    const Icon = academicIcons[item.section as keyof typeof academicIcons] ?? BookOpen;
                    const allowed = item.access.allowed;
                    return (
                        <Link className="portal-academic-card" href={allowed ? studentHref(item.section, academic) : conditionsUrl} key={item.title}>
                            <span className="portal-academic-card-icon">
                                <Icon size={21} aria-hidden="true" />
                            </span>
                            <div>
                                <h3>{item.title}</h3>
                                <p>{allowed ? item.description : 'Consulter les conditions d’accès'}</p>
                            </div>
                            {allowed ? <ArrowUpRight size={17} aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}
                        </Link>
                    );
                })}
            </div>
        );
    }
    return (
        <div className="portal-module-landing">
            <p className="portal-module-intro">{module.intro}</p>
            <div className="portal-module-grid">
                {items.map((item) => {
                    const allowed = item.access.allowed;
                    return (
                        <article key={item.title} className="portal-module-card">
                            <span className="portal-module-state">{allowed ? 'Disponible' : 'Accès sous condition'}</span>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                            <Link href={allowed ? studentHref(item.section, academic) : conditionsUrl}>
                                {allowed ? 'Ouvrir' : 'Consulter les conditions'}
                                <ArrowUpRight size={16} />
                            </Link>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
