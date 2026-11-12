import type { AdmissionCondition } from '@/types/academic';
import { Link } from '@inertiajs/react';
import { CalendarDays, ClipboardCheck, FileCheck2, FolderOpen, GraduationCap, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import type { useLevelModals } from '../hooks/useLevelModals';
const sections = [
    { id: 'personal_info', title: 'Dossier personnel', text: 'Les pièces et informations concernant le candidat.', icon: UserRound },
    { id: 'academic_info', title: 'Parcours académique', text: 'Les prérequis et justificatifs liés aux études.', icon: GraduationCap },
    { id: 'other', title: 'Conditions complémentaires', text: 'Les autres exigences pour rejoindre ce programme.', icon: FolderOpen },
];
export default function ConditionsTab({
    levelConditions = [],
    modalsHook,
    campaignsHref,
}: {
    levelConditions?: AdmissionCondition[];
    campaignsHref?: string;
    modalsHook: ReturnType<typeof useLevelModals>;
}) {
    const conditions = Array.isArray(levelConditions) ? levelConditions : [];
    const required = conditions.filter((condition) => condition.is_required).length;
    return (
        <section className="ld-admissions" aria-labelledby="ld-admissions-title">
            <div className="ld-section-heading">
                <div>
                    <span className="ld-eyebrow">REJOINDRE LE PARCOURS</span>
                    <h2 id="ld-admissions-title">Conditions d’admission.</h2>
                    <p>Conditions générales et pièces exigées pour ce niveau.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {campaignsHref && (
                        <Link href={campaignsHref} className="admin-primary">
                            <CalendarDays size={17} aria-hidden="true" /> Campagnes d’admission
                        </Link>
                    )}
                    <button className="admin-primary" onClick={() => modalsHook.openConditionModal('add')}>
                        <Plus size={17} /> Ajouter une condition
                    </button>
                </div>
            </div>
            <div className="ld-admission-summary">
                <span className="ld-icon">
                    <ClipboardCheck size={23} strokeWidth={1.5} />
                </span>
                <div>
                    <strong>
                        {conditions.length} condition{conditions.length > 1 ? 's' : ''} d’admission
                    </strong>
                    <p>
                        {required} obligatoire{required > 1 ? 's' : ''} · {conditions.length - required} facultative
                        {conditions.length - required > 1 ? 's' : ''}
                    </p>
                </div>
                <span className="ld-summary-note">PRÉPARER · VÉRIFIER · ADMETTRE</span>
            </div>
            {!conditions.length ? (
                <div className="ld-empty">
                    <FileCheck2 size={40} strokeWidth={1.2} />
                    <h3>Les conditions restent à définir.</h3>
                    <p>Ajoutez les documents requis et les prérequis pour guider les futurs étudiants dans leur candidature.</p>
                    <button className="ld-edit-button" onClick={() => modalsHook.openConditionModal('add')}>
                        <Plus size={16} />
                        Créer la première condition
                    </button>
                </div>
            ) : (
                <div className="ld-condition-groups">
                    {sections.map((section) => {
                        const items = conditions.filter((condition) =>
                            section.id === 'other'
                                ? !['personal_info', 'academic_info'].includes(condition.section)
                                : condition.section === section.id,
                        );
                        if (!items.length) return null;
                        return (
                            <section className="ld-condition-group" key={section.id} aria-labelledby={`condition-group-${section.id}`}>
                                <header>
                                    <section.icon size={21} strokeWidth={1.5} />
                                    <div>
                                        <h3 id={`condition-group-${section.id}`}>{section.title}</h3>
                                        <p>{section.text}</p>
                                    </div>
                                    <span>{items.length}</span>
                                </header>
                                <ul>
                                    {items.map((condition, index) => (
                                        <li className="ld-condition" key={condition.id}>
                                            <span className="ld-condition-number">{String(index + 1).padStart(2, '0')}</span>
                                            <div className="ld-condition-copy">
                                                <div>
                                                    <h4>{condition.title}</h4>
                                                    <span className={`ld-required ${condition.is_required ? '' : 'is-optional'}`}>
                                                        {condition.is_required ? 'Obligatoire' : 'Facultatif'}
                                                    </span>
                                                </div>
                                                {condition.description && <p>{condition.description}</p>}
                                            </div>
                                            <div className="ld-condition-actions">
                                                <button
                                                    className="ld-icon-button"
                                                    aria-label={`Modifier la condition : ${condition.title}`}
                                                    title="Modifier"
                                                    onClick={() => modalsHook.openConditionModal('edit', condition.id, condition)}
                                                >
                                                    <Pencil size={16} strokeWidth={1.7} />
                                                </button>
                                                <button
                                                    className="ld-icon-button ld-danger"
                                                    aria-label={`Supprimer la condition : ${condition.title}`}
                                                    title="Supprimer"
                                                    onClick={() => modalsHook.deleteCondition(condition.id)}
                                                >
                                                    <Trash2 size={16} strokeWidth={1.7} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
