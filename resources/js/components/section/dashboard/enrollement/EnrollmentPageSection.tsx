// resources/js/pages/enrollment/EnrollmentPage.tsx
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import BackButton from '@/components/UI/dashboard/BackButton';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProgressHeader from './components/ProgressHeader';
import Sidebar from './components/Sidebar';
import Step1Faculty from './components/Steps/Step1Faculty';
import Step2Personal from './components/Steps/Step2Personal';
import Step3Academic from './components/Steps/Step3Academic';
import Step4Payment from './components/Steps/Step4Payment';
import { useEnrollmentForm } from './hooks/useEnrollmentForm';
import { useRequirements } from './hooks/useRequirements';
import { Faculty, Level, PaymentStage, Year } from './types';
import { buildSidebarSections } from './utils/buildSidebarSections';
import { computeProgress, makeIsFieldCompleted } from './utils/progress';
import { validateStep } from './utils/validators';

export default function EnrollmentPageSection() {
    const [step, setStep] = useState(1);
    const [paymentStage, setPaymentStage] = useState<PaymentStage>('confirm');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [animateProgress, setAnimateProgress] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });

    const { props } = usePage();
    const user = props?.auth?.user ?? {};
    const fullNameFromUser =
        [user.first_name ?? '', user.post_name ?? '', user.last_name ?? ''].filter(Boolean).join(' ').trim() || (user.name ?? '');

    const {
        formData,
        setFormData,
        isConfirmed,
        setIsConfirmed,
        fileInputRefs,
        previews,
        handleFileChange,
        removeFile,
        setCardNumber,
        handleFieldChange,
        saveProgress,
        saveStatus,
    } = useEnrollmentForm({
        name: fullNameFromUser,
        email: user.email ?? '',
    });

    const faculties: Faculty[] = (props.faculties ?? []).map((f: any) => ({ id: String(f.id), name: f.name ?? f.title ?? f.label ?? '—' }));
    const years: Year[] = (props.years ?? []).map((y: any) => ({ id: String(y.id), name: y.name ?? y.title ?? '—' }));

    const levelsByFaculty: Record<string, Level[]> = useMemo(() => {
        const raw = (props.levelsByFaculty ?? {}) as Record<string | number, any[]>;
        return Object.fromEntries(
            Object.entries(raw).map(([fid, arr]) => [
                String(fid),
                (arr ?? []).map((l: any) => ({
                    id: String(l.id),
                    name: l.name ?? l.title ?? '—',
                    // ⬇️ on garde les détails si fournis par le backend
                    detail: l.detail ? { fees: l.detail.fees ?? 0 } : null,
                })),
            ]),
        );
    }, [props.levelsByFaculty]);

    const selectedLevel = useMemo(() => {
        const fid = String(formData.faculty_id || '');
        const lid = String(formData.level_id || '');
        if (!fid || !lid) return null;
        const list = levelsByFaculty[fid] ?? [];
        return list.find((l) => l.id === lid) ?? null;
    }, [formData.faculty_id, formData.level_id, levelsByFaculty]);


    const availableLevels: Level[] = useMemo(() => {
        const fid = String(formData.faculty_id || '');
        if (!fid) return [];
        return levelsByFaculty[fid] ?? [];
    }, [formData.faculty_id, levelsByFaculty]);

    const noLevelsForSelectedFaculty = !!formData.faculty_id && availableLevels.length === 0;

    // animation barre step
    useEffect(() => {
        setAnimateProgress(true);
        const t = setTimeout(() => setAnimateProgress(false), 800);
        return () => clearTimeout(t);
    }, [step]);

    // fetch requirements
    const {
        requirements,
        loading: reqLoading,
        error: reqError,
    } = useRequirements({
        faculty_id: formData.faculty_id,
        level_id: formData.level_id,
        year_id: formData.year_id,
    });

    // sections & progression
    const sidebarSections = useMemo(() => buildSidebarSections(requirements, paymentStage), [requirements, paymentStage]);
    const isFieldCompleted = useMemo(() => makeIsFieldCompleted(formData, isConfirmed), [formData, isConfirmed]);
    const { totalFields, completedFields, percentage } = useMemo(
        () => computeProgress(sidebarSections, isFieldCompleted),
        [sidebarSections, isFieldCompleted],
    );

    useEffect(() => {
        setExpandedSections((prev) => {
            const next: Record<number, boolean> = {};
            sidebarSections.forEach((_, idx) => {
                next[idx] = prev[idx] ?? idx === 0;
            });
            return next;
        });
    }, [sidebarSections]);

    // nav
    const runValidationAndSetErrors = useCallback(() => {
        const newErrors = validateStep(step, formData, requirements, noLevelsForSelectedFaculty, isConfirmed, paymentStage);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [step, formData, requirements, noLevelsForSelectedFaculty, isConfirmed, paymentStage]);

    const nextStep = useCallback(() => {
        if (!runValidationAndSetErrors()) return;
        if (step === 4) {
            if (paymentStage === 'confirm') setPaymentStage('pay');
            else handleSubmit();
            return;
        }
        setStep((s) => s + 1);
    }, [runValidationAndSetErrors, step, paymentStage]);

    const prevStep = useCallback(() => {
        if (step === 4 && paymentStage === 'pay') {
            setPaymentStage('confirm');
            return;
        }
        if (step > 1) setStep((s) => s - 1);
    }, [step, paymentStage]);

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        await new Promise((r) => setTimeout(r, 1200)); // TODO: call API ici
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => {
            // @ts-ignore
            window.location.href = route('dashboard');
        }, 2000);
    }, []);

    return (
        <Dashboard>
            <div className="subscription">
                <BackButton />
            </div>

            <ProgressHeader step={step} />

            <div className="relative z-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                    {/* Col gauche: steps */}
                    <div className="lg:col-span-2">
                        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-purple-100/30 backdrop-blur-sm sm:p-8 lg:p-10">
                            {/* TITRE */}
                            <div className="relative z-10 mb-8">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
                                    <span className="text-sm font-semibold text-indigo-700">En cours</span>
                                </div>
                                <h2 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                                    {step === 1 && 'Choix de la Faculté'}
                                    {step === 2 && 'Informations Personnelles'}
                                    {step === 3 && 'Parcours Académique'}
                                    {step === 4 && (paymentStage === 'confirm' ? 'Confirmation' : 'Paiement')}
                                </h2>
                                {!!reqError && <p className="mt-2 text-sm text-rose-600">{reqError}</p>}
                            </div>

                            {/* FORMS */}
                            {step === 1 && (
                                <Step1Faculty
                                    faculties={faculties}
                                    years={years}
                                    availableLevels={availableLevels}
                                    noLevelsForSelectedFaculty={noLevelsForSelectedFaculty}
                                    formData={formData}
                                    setFormData={setFormData}
                                    errors={errors}
                                    setErrors={setErrors}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                />
                            )}

                            {step === 2 && (
                                <Step2Personal
                                    formData={formData}
                                    errors={errors}
                                    handleFieldChange={handleFieldChange}
                                    requirements={requirements}
                                    fileInputRefs={fileInputRefs}
                                    handleFileChange={handleFileChange}
                                    removeFile={removeFile}
                                    previews={previews}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                />
                            )}

                            {step === 3 && (
                                <Step3Academic
                                    formData={formData}
                                    errors={errors}
                                    handleFieldChange={handleFieldChange}
                                    requirements={requirements}
                                    fileInputRefs={fileInputRefs}
                                    handleFileChange={handleFileChange}
                                    removeFile={removeFile}
                                    previews={previews}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                />
                            )}

                            {step === 4 && (
                                <Step4Payment
                                    isConfirmed={isConfirmed}
                                    setIsConfirmed={setIsConfirmed}
                                    errors={errors}
                                    requirements={requirements}
                                    paymentStage={paymentStage}
                                    formData={formData}
                                    setCardNumber={setCardNumber}
                                    setFormData={setFormData}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                    levelDetailFee={selectedLevel?.detail?.fees ?? 0} // ✅ level_id sélectionné → selectedLevel → fees
                                    defaultCurrency="USD"
                                />
                            )}

                            {/* Nav buttons */}
                            <div className="flex gap-4 pt-6">
                                {(step > 1 || (step === 4 && paymentStage === 'pay')) && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
                                    >
                                        ← Précédent
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={saveProgress}
                                    disabled={saveStatus === 'saving'}
                                    className="flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-6 py-3 font-semibold text-blue-700 transition-all duration-300 hover:border-blue-400 hover:bg-blue-100 hover:shadow-md disabled:opacity-60"
                                >
                                    {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'saved' ? 'Sauvegardé' : 'Sauvegarder'}
                                </button>

                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isSubmitting}
                                    className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-300/50 transition-all duration-300 hover:scale-105"
                                >
                                    {step < 4
                                        ? 'Suivant →'
                                        : paymentStage === 'confirm'
                                          ? 'Continuer vers le paiement →'
                                          : isSubmitting
                                            ? 'Traitement…'
                                            : 'Payer & Valider'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Col droite: sidebar */}
                    <Sidebar
                        sections={sidebarSections}
                        expandedSections={expandedSections}
                        setExpandedSections={setExpandedSections}
                        isFieldCompleted={isFieldCompleted}
                        percentage={percentage}
                        totalFields={totalFields}
                        completedFields={completedFields}
                        animateProgress={animateProgress}
                    />
                </div>
            </div>
        </Dashboard>
    );
}
