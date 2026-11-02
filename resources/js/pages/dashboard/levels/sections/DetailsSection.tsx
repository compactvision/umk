import { Award, BriefcaseBusiness, Languages, Pencil, Target } from 'lucide-react';
export default function DetailsSection({ levelData, onEdit, getFieldValue }) {
    let options = levelData.options;
    if (typeof options === 'string') {
        try {
            options = JSON.parse(options);
        } catch {
            options = options
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean);
        }
    }
    const opportunities = Array.isArray(options) ? options.filter((value) => typeof value === 'string' && value.trim()) : [];
    const edit = (field: string, label: string) => (
        <button className="ld-edit-button" onClick={() => onEdit(field, getFieldValue(field))} aria-label={`Modifier : ${label}`}>
            <Pencil size={14} strokeWidth={1.7} />
            <span>Modifier</span>
        </button>
    );
    return (
        <section className="ld-program-section" aria-labelledby="ld-program-title">
            <div className="ld-section-heading">
                <div>
                    <span className="ld-eyebrow">COMPRENDRE LA FORMATION</span>
                    <h2 id="ld-program-title">Le programme, en détail.</h2>
                </div>
            </div>
            <div className="ld-program-grid">
                <article className="ld-panel ld-objectives">
                    <div className="ld-panel-heading">
                        <span className="ld-icon">
                            <Target size={21} strokeWidth={1.6} />
                        </span>
                        <h3>Objectifs du programme</h3>
                        {edit('course_objective', 'Objectifs du programme')}
                    </div>
                    <p className={!levelData.course_objective ? 'ld-muted' : ''}>
                        {levelData.course_objective ||
                            'Précisez les connaissances et compétences que les étudiants développeront au cours de ce parcours.'}
                    </p>
                </article>
                <article className="ld-panel">
                    <div className="ld-panel-heading">
                        <span className="ld-icon">
                            <BriefcaseBusiness size={21} strokeWidth={1.6} />
                        </span>
                        <h3>Perspectives professionnelles</h3>
                        {edit('options', 'Perspectives professionnelles')}
                    </div>
                    {opportunities.length ? (
                        <ul className="ld-opportunities">
                            {opportunities.map((option, index) => (
                                <li key={index}>{option}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="ld-muted">Présentez les opportunités professionnelles accessibles à l’issue de la formation.</p>
                    )}
                </article>
                <article className="ld-panel ld-small-panel">
                    <div className="ld-panel-heading">
                        <span className="ld-icon">
                            <Languages size={21} strokeWidth={1.6} />
                        </span>
                        <h3>Langue d’enseignement</h3>
                        {edit('language', 'Langue d’enseignement')}
                    </div>
                    <strong>{levelData.language || 'À préciser'}</strong>
                </article>
                <article className="ld-panel ld-small-panel">
                    <div className="ld-panel-heading">
                        <span className="ld-icon">
                            <Award size={21} strokeWidth={1.6} />
                        </span>
                        <h3>Certification</h3>
                        {edit('has_certificate', 'Certification')}
                    </div>
                    <strong>{levelData.has_certificate ? 'Certificat délivré' : 'Sans certificat'}</strong>
                    <p className="ld-muted">
                        {levelData.has_certificate
                            ? 'Une certification est prévue à l’issue du parcours.'
                            : 'Aucune délivrance de certificat n’est configurée.'}
                    </p>
                </article>
            </div>
        </section>
    );
}
