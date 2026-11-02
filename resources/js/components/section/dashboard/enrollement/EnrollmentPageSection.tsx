import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../../../../css/enrollment.css';
import ProgressHeader from './components/ProgressHeader';
import Step1Faculty from './components/Steps/Step1Faculty';
import Step2Personal from './components/Steps/Step2Personal';
import Step3Academic from './components/Steps/Step3Academic';
import Step4Payment from './components/Steps/Step4Payment';
import { useEnrollmentForm } from './hooks/useEnrollmentForm';
import { useRequirements } from './hooks/useRequirements';
import type { Faculty, FormData, Level, Year } from './types';
import { validateStep } from './utils/validators';
type Draft = { uuid: string; last_step: number; form_snapshot: Partial<FormData> & { isConfirmed?: boolean } };
type PageData = {
    auth: { user: { first_name?: string; post_name?: string; last_name?: string; email: string } };
    draft?: Draft;
    faculties: Faculty[];
    years: { id: string | number; title: string }[];
    levelsByFaculty: Record<string, { id: string | number; title: string }[]>;
};
const titles = ['Choisissez votre formation.', 'Faisons connaissance.', 'Parlez-nous de votre parcours.', 'Un dernier regard avant l’envoi.'];
const descriptions = [
    'Sélectionnez votre faculté, votre niveau et l’année académique souhaitée.',
    'Vérifiez vos coordonnées et ajoutez les pièces demandées pour votre identité.',
    'Précisez votre programme d’études et joignez vos justificatifs académiques.',
    'Relisez chaque information. Vous pouvez encore revenir sur les étapes précédentes.',
];
export default function EnrollmentPageSection() {
    const { props } = usePage<PageData>();
    const user = props.auth.user;
    const [step, setStep] = useState(Math.max(1, Math.min(4, props.draft?.last_step || 1)));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [working, setWorking] = useState(false);
    const heading = useRef<HTMLHeadingElement>(null);
    const errorSummary = useRef<HTMLDivElement>(null);
    const form = useEnrollmentForm({
        name: [user.last_name, user.post_name, user.first_name].filter(Boolean).join(' '),
        email: user.email,
        ...props.draft?.form_snapshot,
        uuid: props.draft?.uuid,
    });
    const { formData, setFormData, isConfirmed, setIsConfirmed, saveProgress, submitEnrollment, saveStatus, saveError, uploadingKeys, uploadErrors } =
        form;
    const faculties = props.faculties.map((f) => ({ ...f, id: String(f.id) }));
    const years: Year[] = props.years.map((y) => ({ id: String(y.id), name: y.title }));
    const availableLevels: Level[] = (props.levelsByFaculty[formData.faculty_id] || []).map((level) => ({ id: String(level.id), name: level.title }));
    const { requirements, loading, error: requirementsError } = useRequirements(formData);
    const busy = working || uploadingKeys.length > 0 || loading;
    const formation = {
        faculty: faculties.find((f) => f.id === formData.faculty_id)?.name || '—',
        level: availableLevels.find((level) => level.id === formData.level_id)?.name || '—',
        year: years.find((y) => y.id === formData.year_id)?.name || '—',
    };
    const noLevels = !!formData.faculty_id && availableLevels.length === 0;
    const documentProps = {
        formData,
        errors: { ...errors, ...uploadErrors },
        handleFieldChange: form.handleFieldChange,
        requirements,
        handleFileChange: form.handleFileChange,
        removeFile: form.removeFile,
        previews: form.previews,
        uploadingKeys,
    };
    const requiredDocs = useMemo(() => [...requirements.personal_info, ...requirements.academic_info].filter((doc) => doc.required), [requirements]);
    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
    }, [step]);
    const goToStep = (next: number) => {
        setErrors({});
        setStep(next);
        requestAnimationFrame(() => heading.current?.scrollIntoView({ block: 'start', behavior: 'auto' }));
    };
    const showErrors = (nextErrors: Record<string, string>) => {
        setErrors(nextErrors);
        requestAnimationFrame(() => {
            errorSummary.current?.focus();
            errorSummary.current?.scrollIntoView({ block: 'center' });
        });
    };
    const next = async () => {
        if (busy) return;
        if (requirementsError) return;
        if (step === 4) {
            for (let current = 1; current <= 4; current++) {
                const nextErrors = validateStep(current, formData, requirements, noLevels, isConfirmed);
                if (Object.keys(nextErrors).length) {
                    setStep(current);
                    showErrors(nextErrors);
                    return;
                }
            }
        }
        const nextErrors = validateStep(step, formData, requirements, noLevels, isConfirmed);
        if (Object.keys(nextErrors).length) {
            showErrors(nextErrors);
            return;
        }
        setWorking(true);
        try {
            if (step < 4) {
                if (await saveProgress(step + 1)) goToStep(step + 1);
            } else await submitEnrollment();
        } finally {
            setWorking(false);
        }
    };
    const saveAndExit = async () => {
        const firstStepErrors = validateStep(1, formData, requirements, noLevels, isConfirmed);
        if (Object.keys(firstStepErrors).length) {
            setStep(1);
            showErrors(firstStepErrors);
            return;
        }
        setWorking(true);
        try {
            if (await saveProgress(step)) router.visit('/dashboard/enrollments');
        } finally {
            setWorking(false);
        }
    };
    return (
        <Dashboard>
            <div className="enrollment-flow">
                <div className="enrollment-page-top">
                    <Link href="/dashboard/enrollments">
                        <ArrowLeft size={16} /> Mes inscriptions
                    </Link>
                    <span>
                        <CheckCircle2 size={15} />
                        {saveStatus === 'saving'
                            ? 'Sauvegarde en cours…'
                            : saveStatus === 'saved'
                              ? 'Brouillon sauvegardé'
                              : 'Sauvegarde à chaque étape'}
                    </span>
                </div>
                <header className="enrollment-page-title">
                    <span>UNIVERSITÉ SIMON KIMBANGU</span>
                    <h1>Votre inscription, pas à pas.</h1>
                    <p>Un parcours guidé pour préparer et transmettre votre dossier en toute clarté.</p>
                </header>
                <ProgressHeader step={step} onStepChange={busy ? undefined : goToStep} />
                <div className="enrollment-layout">
                    <form
                        className="enrollment-form-card"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void next();
                        }}
                        noValidate
                    >
                        <div className="enrollment-form-heading">
                            <span className="enrollment-kicker">ÉTAPE 0{step} / 04</span>
                            <h2 tabIndex={-1} ref={heading}>
                                {titles[step - 1]}
                            </h2>
                            <p>{descriptions[step - 1]}</p>
                            <small>
                                <span className="enrollment-required">*</span> Champs obligatoires
                            </small>
                        </div>
                        {!!Object.values(errors).filter(Boolean).length && (
                            <div className="enrollment-errors" tabIndex={-1} ref={errorSummary} role="alert">
                                <strong>Quelques informations sont à vérifier.</strong>
                                <ul>
                                    {Object.entries(errors)
                                        .filter(([, message]) => message)
                                        .map(([key, message]) => (
                                            <li key={key}>
                                                <a
                                                    href={`#${['faculty_id', 'level_id', 'year_id', 'name', 'email', 'program', 'confirmed'].includes(key) ? key : `document-${key}`}`}
                                                >
                                                    {message}
                                                </a>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}
                        {saveError && (
                            <div className="enrollment-errors" role="alert">
                                {saveError}
                            </div>
                        )}
                        {requirementsError && (
                            <div className="enrollment-errors" role="alert">
                                {requirementsError} Revenez à la première étape pour vérifier votre formation.
                            </div>
                        )}
                        {loading && (
                            <p className="enrollment-info" role="status">
                                <LoaderCircle size={18} className="animate-spin" /> Chargement des pièces demandées…
                            </p>
                        )}
                        {step === 1 && (
                            <Step1Faculty
                                faculties={faculties}
                                years={years}
                                availableLevels={availableLevels}
                                noLevelsForSelectedFaculty={noLevels}
                                formData={formData}
                                setFormData={(update) => {
                                    setIsConfirmed(false);
                                    setFormData(update);
                                }}
                                errors={errors}
                                setErrors={setErrors}
                            />
                        )}
                        {step === 2 && <Step2Personal {...documentProps} />}
                        {step === 3 && <Step3Academic {...documentProps} />}
                        {step === 4 && (
                            <Step4Payment
                                isConfirmed={isConfirmed}
                                setIsConfirmed={setIsConfirmed}
                                errors={errors}
                                requirements={requirements}
                                formData={formData}
                                formation={formation}
                                onEdit={goToStep}
                            />
                        )}
                        <div className="enrollment-form-actions">
                            {step > 1 && (
                                <button type="button" className="enrollment-secondary" disabled={busy} onClick={() => goToStep(step - 1)}>
                                    <ArrowLeft size={16} /> Précédent
                                </button>
                            )}
                            <button type="submit" className="enrollment-primary" disabled={busy || !!requirementsError}>
                                {working ? (
                                    <>
                                        <LoaderCircle size={17} className="animate-spin" /> Enregistrement…
                                    </>
                                ) : step < 4 ? (
                                    <>
                                        Enregistrer et continuer <ArrowRight size={17} />
                                    </>
                                ) : (
                                    <>
                                        Soumettre mon dossier <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </div>
                        <button type="button" className="enrollment-save" disabled={busy} onClick={() => void saveAndExit()}>
                            <Save size={15} /> Sauvegarder et reprendre plus tard
                        </button>
                    </form>
                    <aside className="enrollment-aside">
                        <section className="enrollment-summary">
                            <span className="enrollment-kicker">VOTRE PROJET D’ÉTUDES</span>
                            <h2>Le cap est fixé.</h2>
                            <dl>
                                {[
                                    ['Faculté', formation.faculty],
                                    ['Niveau', formation.level],
                                    ['Année', formation.year],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value === '—' ? 'À sélectionner' : value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="enrollment-save-note">
                                <CheckCircle2 size={18} />
                                <p>Votre progression est enregistrée quand vous passez à l’étape suivante.</p>
                            </div>
                        </section>
                        <section className="enrollment-document-guide">
                            <h3>Préparez vos documents</h3>
                            <p>Des fichiers lisibles, au format demandé. Chaque pièce peut peser jusqu’à 10 Mo.</p>
                            {requiredDocs.length > 0 && (
                                <ul>
                                    {requiredDocs.map((doc) => (
                                        <li key={doc.key} className={formData.documents[doc.key] ? 'is-done' : ''}>
                                            <CheckCircle2 size={15} />
                                            {doc.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <Link href="/contact" className="enrollment-help">
                            <HelpCircle size={20} />
                            <span>
                                Besoin d’un coup de main ?<strong>Contactez le service des inscriptions</strong>
                            </span>
                            <ArrowRight size={15} />
                        </Link>
                    </aside>
                </div>
            </div>
        </Dashboard>
    );
}
