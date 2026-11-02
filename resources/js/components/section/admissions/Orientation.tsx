import { admissionFaculties, type CandidateCategory } from '@/lib/admissions';
import { ArrowRight, ArrowUpRight, Compass, HeartPulse, Landmark, MessageCircle, Scale, ShieldPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
const interests = [
    { id: 'medicine', name: 'Soigner et comprendre le vivant', icon: HeartPulse },
    { id: 'public-health', name: 'Prévenir et agir pour les communautés', icon: ShieldPlus },
    { id: 'law', name: 'Défendre et faire vivre la justice', icon: Scale },
    { id: 'social-sciences', name: 'Comprendre et transformer la société', icon: Landmark },
    { id: 'theology', name: 'Transmettre et approfondir le sens', icon: Compass },
];
type Props = { facultyId: string; setFacultyId: (id: string) => void; category: CandidateCategory };
export default function Orientation({ facultyId, setFacultyId, category }: Props) {
    const [interest, setInterest] = useState('');
    const [name, setName] = useState('');
    const [question, setQuestion] = useState('');
    const [handoff, setHandoff] = useState(false);
    const [validationError, setValidationError] = useState('');
    const suggested = admissionFaculties.find((f) => f.id === interest);
    const selected = admissionFaculties.find((f) => f.id === facultyId)!;
    function prepareMessage(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!name.trim() || !question.trim()) {
            setValidationError('Précisez votre nom et votre question pour préparer le message.');
            return;
        }
        setValidationError('');
        const message = `Bonjour, je souhaite être accompagné(e) pour les admissions USK 2026–2027.\nNom : ${name.trim()}\nFaculté : ${selected.name}\nCatégorie : ${category === 'national' ? 'National' : 'Étranger'}\nMa question : ${question.trim()}`;
        window.open(`https://wa.me/243894465813?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
        setHandoff(true);
    }
    return (
        <section id="orientation" className="adm-section adm-orientation" data-admission-section>
            <div className="usk-container">
                <div className="adm-section-top">
                    <span className="usk-eyebrow">Vous n’avez pas à tout décider seul</span>
                    <span>06 / ORIENTATION</span>
                </div>
                <div className="adm-orientation-heading">
                    <h2>
                        Votre vocation mérite
                        <br />
                        <em>une conversation.</em>
                    </h2>
                    <p>Une première piste pour réfléchir à votre choix, puis un échange avec l’équipe pour préciser votre projet.</p>
                </div>
                <div className="adm-orientation-grid">
                    <div className="adm-interests">
                        <span className="usk-eyebrow">01 · Qu’est-ce qui vous anime ?</span>
                        <div className="adm-interest-list" role="group" aria-label="Votre centre d’intérêt">
                            {interests.map(({ id, name: label, icon: Icon }) => (
                                <button type="button" key={id} aria-pressed={interest === id} onClick={() => setInterest(id)}>
                                    <Icon size={19} strokeWidth={1.5} />
                                    <span>{label}</span>
                                    <ArrowRight size={16} />
                                </button>
                            ))}
                        </div>
                        <div className="adm-orientation-result" aria-live="polite">
                            {suggested ? (
                                <>
                                    <span>UNE PISTE À EXPLORER</span>
                                    <h3>{suggested.name}</h3>
                                    <p>{suggested.interests} Cette suggestion ouvre une réflexion ; elle ne détermine pas votre admissibilité.</p>
                                    <button
                                        type="button"
                                        className="usk-link"
                                        onClick={() => {
                                            setFacultyId(suggested.id);
                                            document.getElementById('facultes')?.scrollIntoView({
                                                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                                            });
                                        }}
                                    >
                                        Explorer cette faculté <ArrowUpRight size={16} />
                                    </button>
                                </>
                            ) : (
                                <p>Choisissez un centre d’intérêt pour découvrir une faculté à explorer.</p>
                            )}
                        </div>
                    </div>
                    <form className="adm-advisor-form" onSubmit={prepareMessage}>
                        {validationError && (
                            <p role="alert" className="adm-form-feedback">
                                {validationError}
                            </p>
                        )}
                        <span className="usk-eyebrow">02 · Parlons de votre projet</span>
                        <h3>
                            L’équipe des admissions
                            <br />
                            <em>vous accompagne.</em>
                        </h3>
                        <label htmlFor="orientation-name">
                            Votre nom
                            <input
                                id="orientation-name"
                                name="name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={100}
                                required
                                placeholder="Prénom et nom"
                            />
                        </label>
                        <label htmlFor="orientation-faculty">
                            Faculté envisagée
                            <select id="orientation-faculty" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                                {admissionFaculties.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label htmlFor="orientation-question">
                            Votre question
                            <textarea
                                id="orientation-question"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={1500}
                                required
                                placeholder="Conditions d’accès, équivalence, choix de filière…"
                                rows={3}
                            />
                        </label>
                        <button type="submit" className="usk-button usk-button-green">
                            <MessageCircle size={17} />
                            Préparer mon message WhatsApp <ArrowUpRight size={16} />
                        </button>
                        <p>
                            WhatsApp s’ouvre avec votre message préparé. Vous le relisez et choisissez de l’envoyer. Aucun paiement sur ce formulaire.
                        </p>
                        {handoff && (
                            <div className="adm-form-feedback" role="status">
                                Relisez votre message dans WhatsApp avant de l’envoyer. Si l’ouverture est bloquée, appelez le{' '}
                                <a href="tel:+243894465813">+243 894 465 813</a>.
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
}
