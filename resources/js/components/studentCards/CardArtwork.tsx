import { GraduationCap, Nfc } from 'lucide-react';
import type { CSSProperties } from 'react';
import '../../../css/dashboard/card-templates.css';

export type CardDesign = { name: string; institution: string; heading: string; color: string; back_text: string | null };
export type CardIdentity = { student_name: string; matricule: string; academic_year: string; faculty: string | null; photo: string };

export const defaultCardDesign: CardDesign = {
    name: 'Modèle USK',
    institution: 'Université Simon Kimbangu',
    heading: 'Carte étudiante',
    color: '#16463a',
    back_text: 'En cas de perte, merci de rapporter cette carte au secrétariat de l’université.',
};
export const specimenIdentity: CardIdentity = {
    student_name: 'Grâce Mbuyi',
    matricule: 'EX-26-000184',
    academic_year: '2026–2027',
    faculty: 'Faculté des sciences',
    photo: '/assets/usk/card-specimen-portrait.jpg',
};

function textColor(background: string) {
    const rgb = [1, 3, 5].map((offset) => Number.parseInt(background.slice(offset, offset + 2), 16) / 255);
    const [red, green, blue] = rgb.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue > 0.179 ? '#000' : '#fff';
}

const waves = Array.from({ length: 25 }, (_, i) => {
    const y = i * 12 - 24;
    return `M -40 ${y} C 140 ${y - 155}, 220 ${y + 160}, 385 ${y + 34} S 580 ${y - 63}, 690 ${y + 37}`;
});

function SecurityPattern() {
    return (
        <svg aria-hidden="true" className="ct-guilloche" viewBox="0 0 640 404" preserveAspectRatio="none">
            <g fill="none" stroke="currentColor" strokeWidth="0.65">
                {waves.map((path) => (
                    <path key={path} d={path} />
                ))}
                {Array.from({ length: 19 }, (_, i) => (
                    <ellipse key={i} cx="512" cy="269" rx="104" ry="38" transform={`rotate(${(i * 180) / 19} 512 269)`} />
                ))}
            </g>
        </svg>
    );
}

export function cardInk(color: string): CSSProperties {
    return { '--ct-ink': color, '--ct-on-ink': textColor(color) } as CSSProperties;
}

export function CardFace({
    design,
    identity,
    reverse,
    specimen = false,
}: {
    design: CardDesign;
    identity: CardIdentity;
    reverse: boolean;
    specimen?: boolean;
}) {
    const institution = design.institution || defaultCardDesign.institution;
    const usk = institution.trim().toLocaleLowerCase('fr') === defaultCardDesign.institution.toLocaleLowerCase('fr');
    return (
        <>
            <SecurityPattern />
            <header className="ct-card-header">
                <span className="ct-crest" aria-hidden="true">
                    {usk ? <img src="/assets/usk/logo.png" alt="" /> : <GraduationCap />}
                </span>
                <div>
                    <span className="ct-card-institution">{institution}</span>
                    <strong>{design.heading || defaultCardDesign.heading}</strong>
                </div>
                <span className="ct-card-index" aria-hidden="true">
                    {reverse ? '02' : '01'}
                </span>
            </header>
            {reverse ? (
                <div className="ct-card-back">
                    <div className="ct-back-copy">
                        <strong>Avis au détenteur</strong>
                        <span>{design.back_text || (specimen ? 'Aucun texte renseigné.' : null)}</span>
                    </div>
                    <div className="ct-back-reference">
                        <Nfc aria-hidden="true" />
                        <span>
                            <strong>Pointage en auditoire</strong>
                            <span>Approchez le badge du lecteur à l’entrée.</span>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="ct-card-front">
                    <div className="ct-photo">
                        <img src={identity.photo} alt={`Portrait de ${identity.student_name}`} />
                    </div>
                    <div className="ct-card-identity">
                        <span className="ct-card-label">Nom et prénom</span>
                        <strong data-size={identity.student_name.length > 55 ? 'compact' : identity.student_name.length > 26 ? 'small' : undefined}>
                            {identity.student_name}
                        </strong>
                        <span className="ct-card-program">{identity.faculty}</span>
                        <dl>
                            <div>
                                <dt>Matricule</dt>
                                <dd>{identity.matricule}</dd>
                            </div>
                            <div>
                                <dt>Année académique</dt>
                                <dd>{identity.academic_year}</dd>
                            </div>
                        </dl>
                    </div>
                    <span className="ct-foil" aria-label="Badge sans contact" role="img">
                        <Nfc aria-hidden="true" />
                    </span>
                </div>
            )}
            <footer className="ct-card-footer">
                <span>IDENTIFICATION · NFC</span>
                {specimen && <strong>SPÉCIMEN</strong>}
            </footer>
        </>
    );
}

export function FlatCard({ design, identity, reverse }: { design: CardDesign; identity: CardIdentity; reverse: boolean }) {
    return (
        <div className="ct-card-scene ci-flat" style={cardInk(design.color)}>
            <div className="ct-card-face">
                <CardFace design={design} identity={identity} reverse={reverse} />
            </div>
        </div>
    );
}
