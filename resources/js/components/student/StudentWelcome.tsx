import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, GraduationCap, LifeBuoy, Wallet, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Academic } from './types';

const steps = [
    {
        icon: GraduationCap,
        eyebrow: 'Votre nouvelle aventure',
        title: 'Bienvenue dans votre espace étudiant.',
        text: 'Votre inscription a été validée. Un nouvel espace vous accompagne désormais tout au long de votre parcours à l’Université Simon Kimbangu.',
        detail: 'Votre compte et votre matricule restent les mêmes. Tout commence ici.',
    },
    {
        icon: Compass,
        eyebrow: 'Votre parcours, en un regard',
        title: 'Vos repères académiques, réunis.',
        text: 'Retrouvez votre faculté, votre niveau, votre année académique et votre matricule en haut de la page. Si vous avez plusieurs inscriptions, le sélecteur vous permet de passer de l’une à l’autre.',
        detail: 'Ces informations vous indiquent toujours le parcours actuellement affiché.',
    },
    {
        icon: BookOpen,
        eyebrow: 'Apprendre et progresser',
        title: 'Gardez le fil de votre formation.',
        text: 'Mes cours et Emploi du temps présentent les enseignements publiés pour vous. Les rubriques Supports, Travaux, Évaluations et Résultats vous permettent de suivre vos activités et votre progression au fil de leur publication.',
        detail: 'Une rubrique encore vide se complétera lorsque l’équipe pédagogique publiera son contenu.',
    },
    {
        icon: Wallet,
        eyebrow: 'Un suivi transparent',
        title: 'Comprenez vos frais et vos accès.',
        text: 'Consultez vos frais, les échéances, vos transactions et vos reçus. Les services soumis à une condition affichent une explication claire et les démarches à suivre.',
        detail: 'La validation de votre dossier est distincte du paiement. Seuls les versements confirmés sont comptabilisés.',
    },
    {
        icon: LifeBuoy,
        eyebrow: 'Vous êtes accompagné',
        title: 'Un point de contact, à chaque étape.',
        text: 'Consultez les annonces et les notifications pour rester informé. Dans Mes demandes, contactez l’administration et retrouvez les réponses à vos questions.',
        detail: 'Vous pourrez relancer ce guide à tout moment avec le bouton « Guide de mon espace ».',
    },
];

export default function StudentWelcome({
    academic,
    pending,
    openRequest = 0,
    desktopInline = false,
}: {
    academic: Academic;
    pending: boolean;
    openRequest?: number;
    desktopInline?: boolean;
}) {
    const [open, setOpen] = useState(pending);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    const dialog = useRef<HTMLDivElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (openRequest > 0) {
            setStep(0);
            setOpen(true);
        }
    }, [openRequest]);
    const current = steps[step];
    const Icon = current.icon;
    const finish = () => {
        if (saving) return;
        if (!pending) {
            setOpen(false);
            return;
        }
        setSaving(true);
        setError(false);
        router.post(
            `/dashboard/student/welcome/acknowledge?academic=${academic.id}`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setOpen(false),
                onError: () => setError(true),
                onFinish: () => setSaving(false),
            },
        );
    };
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButton.current?.focus();
        const trap = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeButton.current?.click();
            }
            if (event.key !== 'Tab') return;
            const nodes = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
            if (!nodes?.length) return;
            const first = nodes[0],
                last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', trap);
        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener('keydown', trap);
            previous?.focus();
        };
    }, [open]);
    return (
        <>
            {typeof document !== 'undefined' &&
                createPortal(
                    <button
                        type="button"
                        className={`portal-welcome-trigger ${desktopInline ? 'is-inline-on-desktop' : ''}`}
                        aria-label="Ouvrir le guide de mon espace"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        title="Guide de mon espace"
                        onClick={() => {
                            setStep(0);
                            setOpen(true);
                        }}
                    >
                        <Compass size={22} aria-hidden="true" />
                        <span aria-hidden="true">Guide de mon espace</span>
                    </button>,
                    document.body,
                )}
            {open &&
                createPortal(
                    <div className="student-welcome-backdrop">
                        {step === 0 && (
                            <div className="student-welcome-confetti" aria-hidden="true">
                                {Array.from({ length: 42 }, (_, index) => (
                                    <i
                                        key={index}
                                        style={{
                                            left: `${(index * 37) % 100}%`,
                                            animationDelay: `${(index % 8) * 0.17}s`,
                                            background: ['#d8b56d', '#83bca5', '#f5e7bc', '#fff'][index % 4],
                                            transform: `rotate(${index * 27}deg)`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <div
                            className="student-welcome-dialog"
                            ref={dialog}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="student-welcome-title"
                            aria-describedby="student-welcome-description"
                        >
                            <button
                                ref={closeButton}
                                className="student-welcome-close"
                                aria-label="Fermer le guide de bienvenue"
                                onClick={finish}
                                disabled={saving}
                            >
                                <X size={20} />
                            </button>
                            <div className="student-welcome-art" aria-hidden="true">
                                <div className="student-welcome-orbit" />
                                <span>
                                    <Icon size={42} strokeWidth={1.4} />
                                </span>
                                <Compass className="student-welcome-sparkle" size={23} />
                            </div>
                            <div className="student-welcome-copy" key={step}>
                                <p className="student-welcome-eyebrow">{current.eyebrow}</p>
                                <h2 id="student-welcome-title">{current.title}</h2>
                                {step === 0 && <p className="student-welcome-name">{academic.name}</p>}
                                <p id="student-welcome-description">{current.text}</p>
                                {step === 0 && (
                                    <div className="student-welcome-context">
                                        <span>{academic.faculty}</span>
                                        <strong>
                                            {academic.level} · {academic.year}
                                        </strong>
                                        <small>Matricule {academic.matricule || 'en cours d’affectation'}</small>
                                    </div>
                                )}
                                <p className="student-welcome-note">
                                    <Check size={16} />
                                    {current.detail}
                                </p>
                            </div>
                            {error && (
                                <p role="alert" className="portal-error">
                                    Le guide n’a pas pu être enregistré. Veuillez réessayer.
                                </p>
                            )}
                            <div className="student-welcome-footer">
                                <div className="student-welcome-progress" aria-label={`Étape ${step + 1} sur ${steps.length}`}>
                                    {steps.map((_, index) => (
                                        <span key={index} className={index === step ? 'is-active' : index < step ? 'is-done' : ''} />
                                    ))}
                                    <small>
                                        {step + 1} / {steps.length}
                                    </small>
                                </div>
                                <div className="student-welcome-actions">
                                    {step > 0 && (
                                        <button className="student-welcome-back" disabled={saving} onClick={() => setStep(step - 1)}>
                                            <ArrowLeft size={16} />
                                            Retour
                                        </button>
                                    )}
                                    <button
                                        className="student-welcome-next"
                                        disabled={saving}
                                        onClick={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}
                                    >
                                        {saving
                                            ? 'Ouverture…'
                                            : step === steps.length - 1
                                              ? 'Découvrir mon espace'
                                              : step === 0
                                                ? 'Faites-moi visiter'
                                                : 'Continuer'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                            <span className="sr-only" role="status" aria-live="polite">
                                Étape {step + 1} sur {steps.length} : {current.title}
                            </span>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
