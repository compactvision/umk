import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import BackButton from '@/components/UI/dashboard/BackButton';
import { useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { route } from 'ziggy-js';

// ====================== TYPES ======================
type PageMode = 'create' | 'view' | 'edit';
type Id = number | string;
type PaymentStage = 'confirm' | 'pay';

interface Faculty {
    id: Id;
    name: string;
}

interface Level {
    id: Id;
    name?: string;
    title?: string;
    code?: string;
}

interface Year {
    id: Id;
    label?: string;
    title?: string;
    is_active?: boolean;
    status?: string;
}

interface RequirementItem {
    key: string;
    label: string;
    required: boolean;
    mimes?: string[];
    hint?: string | null;
}

interface Requirements {
    personal_info: RequirementItem[];
    academic_info: RequirementItem[];
    payment: { required: boolean; amount: number; currency: string };
}

interface ServerDoc {
    id: number;
    key: string;
    filename: string;
    url: string;
}

interface EnrollmentFormData {
    faculty_id: Id | '';
    level_id: Id | '';
    year_id: Id | '';
    name: string;
    email: string;
    program: string;
    documents: Record<string, File | undefined>;
    cardNumber: string;
    cvv: string;
}

interface ViewEnrollment {
    id: Id;
    uuid: string;
    status: 'draft' | 'submitted' | string;
    level_id: Id;
    academic_year_id: Id;
    form_snapshot?: Partial<EnrollmentFormData>;
    meta?: Record<string, any>;
    last_step?: number;
    documents?: { key: string; filename: string; uuid: string; mime: string; size: number; url: string }[];
}

interface EnrollmentBootstrapProps {
    faculties: Faculty[];
    levelsByFaculty: Record<Id, Level[]>;
    years: Year[];
}

interface PageProps extends EnrollmentBootstrapProps {
    mode?: PageMode;
    startFromDraft?: boolean;
    enrollment?: ViewEnrollment | null;
}

interface SidebarField {
    key: string;
    label: string;
    icon: string;
    type?: 'doc' | 'confirm' | 'payment';
    docKey?: string;
}

// ====================== HELPERS ======================
const getCsrf = (): string => 
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

const isYearActive = (year: Year): boolean => 
    year.is_active !== undefined ? !!year.is_active : year.status === 'open';

const getYearText = (year: Year): string => year.label || year.title || '';
const getLevelLabel = (level?: Level): string => level?.name || level?.title || '';

// ====================== COMPONENT ======================
export default function Enrollment(): JSX.Element {
    const { props } = usePage<PageProps>();
    const {
        faculties = [],
        levelsByFaculty = {},
        years = [],
        mode = 'create',
        enrollment: currentEnrollment = null,
        startFromDraft = true
    } = props;

    // ====================== STATE ======================
    const [step, setStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [paymentStage, setPaymentStage] = useState<PaymentStage>('confirm');
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverDocs, setServerDocs] = useState<Record<string, ServerDoc>>({});
    const [draftBlocked, setDraftBlocked] = useState<boolean>(false);
    const [draftBlockMsg, setDraftBlockMsg] = useState<string>('');
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
        0: true, 1: false, 2: false, 3: false
    });

    const [requirements, setRequirements] = useState<Requirements>({
        personal_info: [],
        academic_info: [],
        payment: { required: false, amount: 0, currency: 'USD' }
    });

    // ====================== DERIVED STATE ======================
    const isView = mode === 'view';
    const canEdit = isView && currentEnrollment?.status === 'draft';
    
    const search = useMemo(() => 
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams(),
        []
    );
    
    const forceNew = search.get('new') === '1';
    const allowDraftResume = mode === 'create' && !forceNew && startFromDraft && !currentEnrollment;

    // ====================== FORM ======================
    const {
        data: formData,
        setData,
        post,
        processing,
    } = useForm<EnrollmentFormData>({
        faculty_id: '',
        level_id: '',
        year_id: '',
        name: '',
        email: '',
        program: '',
        documents: {},
        cardNumber: '',
        cvv: '',
    });

    // ====================== CALLBACKS ======================
    const resetFormToEmpty = useCallback(() => {
        setData({
            faculty_id: '',
            level_id: '',
            year_id: '',
            name: '',
            email: '',
            program: '',
            documents: {},
            cardNumber: '',
            cvv: '',
        });
        setServerDocs({});
        setErrors({});
        setRequirements({
            personal_info: [],
            academic_info: [],
            payment: { required: false, amount: 0, currency: 'USD' }
        });
        setStep(1);
        setPaymentStage('confirm');
        setIsConfirmed(false);
    }, [setData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(name as keyof EnrollmentFormData, value as any);
    }, [setData]);

    const handleFileChange = useCallback((key: string, file?: File | null) => {
        setData('documents', { ...formData.documents, [key]: file || undefined });
    }, [formData.documents, setData]);

    const uploadDraftDoc = useCallback(async (docKey: string, file: File) => {
        const formData = new FormData();
        formData.append('key', docKey);
        formData.append('file', file);

        try {
            const response = await fetch(route('dashboard.enrollment.draft.upload'), {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                credentials: 'same-origin',
                body: formData,
            });
            
            const result = await response.json();
            if (result?.ok && result?.document) {
                setServerDocs(prev => ({ ...prev, [docKey]: result.document }));
            }
        } catch (error) {
            console.warn('Failed to upload draft document:', error);
        }
    }, []);

    const toggleSection = useCallback((sectionIndex: number) => {
        setExpandedSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }));
    }, []);

    // ====================== VALIDATION ======================
    const validateStep = useCallback((): boolean => {
        switch (step) {
            case 1:
                return !!(formData.faculty_id && formData.level_id && formData.year_id) && !errors.year_id;
            case 2:
                const hasPersonalInfo = formData.name.trim() && formData.email.trim();
                const hasRequiredPersonalDocs = requirements.personal_info.every(item => {
                    if (!item.required) return true;
                    return !!(formData.documents?.[item.key] || serverDocs[item.key]);
                });
                return hasPersonalInfo && hasRequiredPersonalDocs;
            case 3:
                const hasProgram = formData.program.trim();
                const hasRequiredAcademicDocs = requirements.academic_info.every(item => {
                    if (!item.required) return true;
                    return !!(formData.documents?.[item.key] || serverDocs[item.key]);
                });
                return hasProgram && hasRequiredAcademicDocs;
            case 4:
                if (!isConfirmed) return false;
                if (!requirements.payment.required) return true;
                if (paymentStage === 'pay') {
                    return formData.cardNumber.trim() !== '' && formData.cvv.trim() !== '';
                }
                return true;
            default:
                return false;
        }
    }, [step, formData, errors, requirements, isConfirmed, paymentStage, serverDocs]);

    // ====================== LABELS ======================
    const labels = useMemo(() => ({
        faculty: (id: Id | '') => faculties.find(f => String(f.id) === String(id))?.name || '',
        level: (fid: Id | '', lid: Id | '') => {
            const levels = levelsByFaculty[fid as Id] || [];
            const level = levels.find(l => String(l.id) === String(lid));
            return getLevelLabel(level);
        },
        year: (id: Id | '') => {
            const year = years.find(y => String(y.id) === String(id));
            return year ? getYearText(year) : '';
        }
    }), [faculties, levelsByFaculty, years]);

    // ====================== EFFECTS ======================
    
    // Draft Resume Effect
    useEffect(() => {
        if (mode !== 'create' || forceNew || !allowDraftResume) {
            if (forceNew) resetFormToEmpty();
            return;
        }

        const loadDraft = async () => {
            try {
                const response = await fetch(route('dashboard.enrollment.draft.show'), {
                    headers: { Accept: 'application/json' }
                });
                const result = await response.json();
                
                if (!result.ok || !result.draft) return;

                const snapshot = result.draft.form_snapshot || {};
                setData(prev => ({
                    ...prev,
                    faculty_id: snapshot.faculty_id ?? '',
                    level_id: snapshot.level_id ?? '',
                    year_id: (snapshot as any).academic_year_id ?? snapshot.year_id ?? '',
                    name: snapshot.name ?? '',
                    email: snapshot.email ?? '',
                    program: snapshot.program ?? '',
                    documents: {},
                    cardNumber: '',
                    cvv: '',
                }));

                if (result.draft.last_step) setStep(result.draft.last_step);
                
                const docs = result.draft.documents || [];
                setServerDocs(Object.fromEntries(docs.map(d => [d.key, d])));
            } catch (error) {
                console.warn('Failed to load draft:', error);
            }
        };

        loadDraft();
    }, [mode, allowDraftResume, forceNew, resetFormToEmpty, setData]);

    // Current Enrollment Effect
    useEffect(() => {
        if (!currentEnrollment) return;

        const snapshot = currentEnrollment.form_snapshot ?? currentEnrollment.meta ?? {};
        setData({
            faculty_id: String(snapshot.faculty_id ?? (currentEnrollment as any).level_faculty_id ?? ''),
            level_id: String(currentEnrollment.level_id ?? snapshot.level_id ?? ''),
            year_id: String((snapshot as any).academic_year_id ?? snapshot.year_id ?? currentEnrollment.academic_year_id ?? ''),
            name: snapshot.name ?? '',
            email: snapshot.email ?? '',
            program: snapshot.program ?? '',
            documents: {},
            cardNumber: '',
            cvv: '',
        });

        const docs = currentEnrollment.documents ?? [];
        setServerDocs(Object.fromEntries(docs.map(d => [d.key, {
            id: 0 as any,
            key: d.key,
            filename: d.filename,
            url: d.url || ''
        }])));

        setStep(currentEnrollment.last_step ? Math.min(currentEnrollment.last_step, 4) : 4);
        setPaymentStage('confirm');
        setIsConfirmed(true);
    }, [currentEnrollment, setData]);

    // Autosave Effect
    useEffect(() => {
        if (draftBlocked || (isView && !canEdit)) return;

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            const snapshot = {
                faculty_id: formData.faculty_id,
                level_id: formData.level_id,
                year_id: formData.year_id,
                name: formData.name,
                email: formData.email,
                program: formData.program,
            };

            try {
                const response = await fetch(route('dashboard.enrollment.draft.save'), {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrf(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ form_snapshot: snapshot, last_step: step }),
                    signal: controller.signal,
                });

                if (response.status === 409) {
                    let message = 'Une inscription sur ce niveau est déjà disponible pour cette année.';
                    try {
                        const result = await response.json();
                        if (result?.error) message = result.error;
                    } catch {}
                    
                    setDraftBlocked(true);
                    setDraftBlockMsg(message);
                    setErrors(prev => ({ ...prev, year_id: message }));
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.warn('Autosave failed:', error);
                }
            }
        }, 800);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [draftBlocked, isView, canEdit, formData.faculty_id, formData.level_id, formData.year_id, formData.name, formData.email, formData.program, step]);

    // Requirements Loading Effect
    useEffect(() => {
        const loadRequirements = async () => {
            if (!formData.level_id || !formData.year_id) {
                setRequirements({
                    personal_info: [],
                    academic_info: [],
                    payment: { required: false, amount: 0, currency: 'USD' }
                });
                setErrors({});
                return;
            }

            try {
                setIsLoading(true);
                setErrors({});
                setPaymentStage('confirm');
                setIsConfirmed(false);

                const params = new URLSearchParams({
                    level_id: String(formData.level_id),
                    year_id: String(formData.year_id),
                    faculty_id: String(formData.faculty_id || ''),
                });

                const response = await fetch(`${route('dashboard.enrollment.requirements')}?${params}`, {
                    headers: { Accept: 'application/json' }
                });
                const result = await response.json();

                if (!result.ok) {
                    setErrors({ year_id: result.message || 'Cette année académique n\'est pas active.' });
                    setRequirements({
                        personal_info: [],
                        academic_info: [],
                        payment: { required: false, amount: 0, currency: 'USD' }
                    });
                    return;
                }

                setRequirements(result.payload || {
                    personal_info: [],
                    academic_info: [],
                    payment: { required: false, amount: 0, currency: 'USD' }
                });
            } catch (error) {
                setErrors({ global: 'Impossible de charger les conditions.' });
                setRequirements({
                    personal_info: [],
                    academic_info: [],
                    payment: { required: false, amount: 0, currency: 'USD' }
                });
            } finally {
                setIsLoading(false);
            }
        };

        setDraftBlocked(false);
        setDraftBlockMsg('');
        loadRequirements();
    }, [formData.level_id, formData.year_id, formData.faculty_id]);

    // ====================== NAVIGATION ======================
    const nextStep = async () => {
        if (!validateStep()) return;
        
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));

        if (step === 4) {
            if (!requirements.payment.required) {
                setIsLoading(false);
                handleSubmit();
                return;
            }
            if (paymentStage === 'confirm') {
                setPaymentStage('pay');
                setIsLoading(false);
                return;
            }
            if (paymentStage === 'pay') {
                setIsLoading(false);
                handleSubmit();
                return;
            }
        }

        setStep(prev => Math.min(prev + 1, 4));
        setIsLoading(false);
    };

    const prevStep = () => {
        if (step === 4 && paymentStage === 'pay') {
            setPaymentStage('confirm');
            return;
        }
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e?: Event) => {
        e?.preventDefault?.();
        if (!validateStep()) return;

        post(route('dashboard.enrollment.store'), {
            forceFormData: true,
            onError: (errors) => setErrors(errors as any || {}),
            onSuccess: () => {
                // TODO: toast/redirect
            },
        });
    };

    // ====================== SIDEBAR LOGIC ======================
    const sidebarSections = useMemo(() => {
        const personalDocFields = requirements.personal_info.map(item => ({
            key: `doc_personal_${item.key}`,
            type: 'doc' as const,
            docKey: item.key,
            label: item.label,
            icon: '📄',
        }));

        const academicDocFields = requirements.academic_info.map(item => ({
            key: `doc_academic_${item.key}`,
            type: 'doc' as const,
            docKey: item.key,
            label: item.label,
            icon: '📎',
        }));

        const confirmFields = [{
            key: 'confirmed',
            type: 'confirm' as const,
            label: "Je certifie l'exactitude des informations fournies",
            icon: '✅'
        }];

        const paymentFields = requirements.payment.required ? [
            { key: 'cardNumber', label: 'Numéro de carte', icon: '💳', type: 'payment' as const },
            { key: 'cvv', label: 'Code CVV', icon: '🔒', type: 'payment' as const },
        ] : [];

        return [
            {
                title: 'Choix de la Faculté',
                fields: [
                    { key: 'faculty_id', label: 'Faculté', icon: '🏛️' },
                    { key: 'level_id', label: 'Niveau académique', icon: '📚' },
                    { key: 'year_id', label: "Année d'inscription", icon: '📅' },
                ],
            },
            {
                title: 'Informations Personnelles',
                fields: [
                    { key: 'name', label: 'Nom complet', icon: '👤' },
                    { key: 'email', label: 'Adresse email', icon: '📧' },
                    ...personalDocFields
                ],
            },
            {
                title: 'Parcours Académique',
                fields: [
                    { key: 'program', label: "Programme d'études", icon: '📚' },
                    ...academicDocFields
                ],
            },
            {
                title: requirements.payment.required ? 'Paiement & Confirmation' : 'Confirmation',
                fields: [...confirmFields, ...paymentFields],
            },
        ];
    }, [requirements]);

    const isSidebarFieldCompleted = useCallback((field: SidebarField): boolean => {
        if (field.type === 'doc' && field.docKey) {
            return !!(formData.documents?.[field.docKey] || serverDocs[field.docKey]);
        }
        if (field.type === 'confirm') {
            return isConfirmed;
        }
        if (field.type === 'payment') {
            if (field.key === 'cardNumber') return formData.cardNumber.trim().length > 0;
            if (field.key === 'cvv') return formData.cvv.trim().length > 0;
            return false;
        }
        
        const value = (formData as any)[field.key];
        return value != null && (typeof value !== 'string' || value.trim() !== '');
    }, [formData, serverDocs, isConfirmed]);

    const progressStats = useMemo(() => {
        const totalFields = sidebarSections.reduce((acc, section) => acc + section.fields.length, 0);
        const completedFields = sidebarSections.reduce((acc, section) => {
            return acc + section.fields.filter(field => isSidebarFieldCompleted(field as SidebarField)).length;
        }, 0);
        
        return {
            total: totalFields,
            completed: completedFields,
            percentage: totalFields ? Math.round((completedFields / totalFields) * 100) : 0
        };
    }, [sidebarSections, isSidebarFieldCompleted]);

    // ====================== UI HELPERS ======================
    const stepperLabels = useMemo(() => [
        'Faculté',
        'Infos',
        'Académique',
        requirements.payment.required ? 'Paiement' : 'Confirmation'
    ], [requirements.payment.required]);

    const getStepTitle = () => {
        if (step === 4 && requirements.payment.required && paymentStage === 'confirm') {
            return 'Confirmation';
        }
        const titles = {
            1: 'Choix de la Faculté',
            2: 'Informations Personnelles',
            3: 'Parcours Académique',
            4: requirements.payment.required ? 'Paiement' : 'Confirmation',
        };
        return titles[step as keyof typeof titles];
    };

    const getSidebarFieldValue = (field: SidebarField): string => {
        if (field.type === 'doc') return 'Fichier ajouté';
        if (field.type === 'confirm') return 'Confirmé';
        if (field.type === 'payment') {
            if (field.key === 'cardNumber') return '**** **** **** ' + formData.cardNumber.slice(-4);
            if (field.key === 'cvv') return '***';
        }

        switch (field.key) {
            case 'faculty_id': return `🏛️ ${labels.faculty(formData.faculty_id)}`;
            case 'level_id': return `🎓 ${labels.level(formData.faculty_id, formData.level_id)}`;
            case 'year_id': return `📅 ${labels.year(formData.year_id)}`;
            default: return String((formData as any)[field.key] || '');
        }
    };

    // ====================== COMPONENTS ======================
    const DocPreview: React.FC<{
        docKey: string;
        label: string;
        canEdit: boolean;
        mimes?: string[];
    }> = ({ docKey, label, canEdit, mimes }) => {
        const doc = serverDocs[docKey];
        if (!doc) return null;

        const filename = doc.filename || '';
        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(filename);
        const isPdf = filename.toLowerCase().endsWith('.pdf');

        return (
            <div className="doc-preview" style={{ marginTop: 8 }}>
                {isImage && (
                    <img 
                        src={doc.url} 
                        alt={label} 
                        style={{ maxHeight: 120, borderRadius: 8 }} 
                    />
                )}
                {isPdf && (
                    <iframe
                        src={doc.url}
                        title={label}
                        style={{ width: '100%', height: 320, border: '1px solid #eee', borderRadius: 8 }}
                    />
                )}
                <div style={{ marginTop: 6 }}>
                    <a href={doc.url} target="_blank" rel="noreferrer">
                        Ouvrir le document
                    </a>
                </div>

                {canEdit && (
                    <div style={{ marginTop: 6 }}>
                        <label className="btn btn--secondary" style={{ cursor: 'pointer' }}>
                            Remplacer
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file) {
                                        handleFileChange(docKey, file);
                                        uploadDraftDoc(docKey, file);
                                    }
                                }}
                                accept={Array.isArray(mimes) ? mimes.join(',') : undefined}
                            />
                        </label>
                    </div>
                )}
            </div>
        );
    };

    const FileInput: React.FC<{
        item: RequirementItem;
        disabled: boolean;
    }> = ({ item, disabled }) => (
        <div className="form-field" key={item.key}>
            <label className="form-field__label">
                {item.label} {item.required && '*'}
            </label>
            <input
                type="file"
                className="form-field__input"
                onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    handleFileChange(item.key, file);
                    if (file) uploadDraftDoc(item.key, file);
                }}
                accept={Array.isArray(item.mimes) ? item.mimes.join(',') : undefined}
                required={item.required}
                disabled={disabled}
            />
            <DocPreview
                docKey={item.key}
                label={item.label}
                canEdit={canEdit}
                mimes={item.mimes}
            />
        </div>
    );

    // ====================== RENDER ======================
    return (
        <Dashboard>
            <div className="subscription">
                <BackButton />

                {/* Header */}
                <div className="subscription__header">
                    <div className="container">
                        {/* Stepper */}
                        <div className="stepper">
                            <div className="stepper__track">
                                <div 
                                    className="stepper__progress" 
                                    style={{ width: `${((step - 1) / 3) * 100}%` }} 
                                />
                            </div>

                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`stepper__step ${
                                        step >= s ? 'stepper__step--active' : ''
                                    } ${step > s ? 'stepper__step--completed' : ''}`}
                                >
                                    <div className="stepper__circle">
                                        {step > s ? (
                                            <svg className="stepper__check" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        ) : (
                                            <span className="stepper__number">{s}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stepper Labels */}
                        <div className="stepper__labels">
                            {stepperLabels.map((label, index) => (
                                <span 
                                    key={index} 
                                    className={`stepper__label ${
                                        step >= index + 1 ? 'stepper__label--active' : ''
                                    }`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* View Mode Status */}
                {isView && (
                    <div style={{
                        display: 'flex',
                        margin: "0 auto",
                        justifyContent: 'space-between',
                        marginTop: 24,
                        marginBottom: 12,
                        padding: "15px",
                        background: "lightgreen",
                        borderRadius: "16px",
                        width: "60%"
                    }}>
                        <div>
                            Statut : <strong>{currentEnrollment?.status}</strong>
                            {currentEnrollment?.status !== 'draft' && ' (lecture seule)'}
                        </div>
                        {canEdit && (
                            <button type="button" className="btn btn--secondary">
                                Mode édition (brouillon)
                            </button>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <main className="subscription__main">
                    <div className="container">
                        <div className="content-wrapper">
                            {/* Form */}
                            <div className="form-container">
                                <h2 className="form__title">{getStepTitle()}</h2>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e.nativeEvent);
                                }} className="form">
                                    
                                    {/* Step 1 - Faculty Selection */}
                                    {step === 1 && (
                                        <div className="form__step">
                                            <div className="form__fields">
                                                <div className="form-field">
                                                    <label className="form-field__label">Faculté</label>
                                                    <select
                                                        name="faculty_id"
                                                        value={formData.faculty_id}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                            setData('level_id', '');
                                                        }}
                                                        className="form-field__input"
                                                        required
                                                        disabled={(isView && !canEdit) || processing}
                                                    >
                                                        <option value="">Sélectionnez une faculté</option>
                                                        {faculties.map((faculty) => (
                                                            <option key={faculty.id} value={String(faculty.id)}>
                                                                🏛️ {faculty.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-field">
                                                    <label className="form-field__label">Niveau académique</label>
                                                    <select
                                                        name="level_id"
                                                        value={formData.level_id}
                                                        onChange={handleChange}
                                                        className="form-field__input"
                                                        required
                                                        disabled={(isView && !canEdit) || processing || !formData.faculty_id}
                                                    >
                                                        <option value="">Sélectionnez un niveau</option>
                                                        {(levelsByFaculty[formData.faculty_id as Id] || []).map((level) => (
                                                            <option key={level.id} value={String(level.id)}>
                                                                🎓 {getLevelLabel(level)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-field">
                                                    <label className="form-field__label">Année d'inscription</label>
                                                    <select
                                                        name="year_id"
                                                        value={formData.year_id}
                                                        onChange={handleChange}
                                                        className="form-field__input"
                                                        required
                                                        disabled={(isView && !canEdit) || processing}
                                                    >
                                                        <option value="">Sélectionnez une année</option>
                                                        {years.filter(isYearActive).map((year) => (
                                                            <option key={year.id} value={String(year.id)}>
                                                                📅 {getYearText(year)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.year_id && (
                                                        <p className="form-field__error">{errors.year_id}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2 - Personal Information */}
                                    {step === 2 && (
                                        <div className="form__step">
                                            <div className="form__fields">
                                                <div className="form-field">
                                                    <label className="form-field__label">Nom complet</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="form-field__input"
                                                        placeholder="Entrez votre nom complet"
                                                        required
                                                        disabled={(isView && !canEdit) || processing}
                                                    />
                                                </div>

                                                <div className="form-field">
                                                    <label className="form-field__label">Adresse email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="form-field__input"
                                                        placeholder="votre@email.com"
                                                        required
                                                        disabled={(isView && !canEdit) || processing}
                                                    />
                                                </div>

                                                {/* Personal Documents */}
                                                {requirements.personal_info.map((item) => (
                                                    <FileInput
                                                        key={item.key}
                                                        item={item}
                                                        disabled={(isView && !canEdit) || processing}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3 - Academic Information */}
                                    {step === 3 && (
                                        <div className="form__step">
                                            <div className="form__fields">
                                                <div className="form-field">
                                                    <label className="form-field__label">Programme d'études</label>
                                                    <input
                                                        type="text"
                                                        name="program"
                                                        value={formData.program}
                                                        onChange={handleChange}
                                                        className="form-field__input"
                                                        placeholder="Ex: Informatique"
                                                        required
                                                        disabled={(isView && !canEdit) || processing}
                                                    />
                                                </div>

                                                {/* Academic Documents */}
                                                {requirements.academic_info.map((item) => (
                                                    <FileInput
                                                        key={item.key}
                                                        item={item}
                                                        disabled={(isView && !canEdit) || processing}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4 - Confirmation & Payment */}
                                    {step === 4 && (
                                        <div className="form__step">
                                            <div className="form__fields">
                                                {/* Confirmation */}
                                                <div className="form-field">
                                                    <label className="form-field__label">Confirmation</label>
                                                    <div className="form-field__input" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <input
                                                            id="confirmAccuracy"
                                                            type="checkbox"
                                                            checked={isConfirmed}
                                                            onChange={(e) => setIsConfirmed(e.target.checked)}
                                                            style={{ width: 18, height: 18 }}
                                                            required
                                                            disabled={(isView && !canEdit) || processing}
                                                        />
                                                        <label htmlFor="confirmAccuracy" style={{ cursor: 'pointer' }}>
                                                            Je certifie que les informations fournies sont exactes et complètes.
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Payment Section */}
                                                {requirements.payment.required && paymentStage === 'pay' && (
                                                    <>
                                                        <div className="form-field">
                                                            <label className="form-field__label">Montant à régler</label>
                                                            <div className="form-field__input" style={{ opacity: 0.85 }}>
                                                                {requirements.payment.amount} {requirements.payment.currency}
                                                            </div>
                                                        </div>

                                                        <div className="form-field">
                                                            <label className="form-field__label">💳 Numéro de carte</label>
                                                            <input
                                                                type="text"
                                                                name="cardNumber"
                                                                value={formData.cardNumber}
                                                                onChange={handleChange}
                                                                className="form-field__input"
                                                                placeholder="1234 5678 9012 3456"
                                                                required
                                                                disabled={processing}
                                                            />
                                                        </div>

                                                        <div className="form-field">
                                                            <label className="form-field__label">🔒 Code CVV</label>
                                                            <input
                                                                type="text"
                                                                name="cvv"
                                                                value={formData.cvv}
                                                                onChange={handleChange}
                                                                className="form-field__input"
                                                                placeholder="123"
                                                                maxLength={3}
                                                                required
                                                                disabled={processing}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Actions */}
                                    <div className="form__actions">
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                onClick={prevStep}
                                                className="btn btn--secondary"
                                                disabled={isLoading || processing}
                                            >
                                                Précédent
                                            </button>
                                        )}

                                        {step < 4 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className={`btn btn--primary ${!validateStep() ? 'btn--disabled' : ''}`}
                                                disabled={isLoading || processing || !validateStep()}
                                            >
                                                {isLoading ? 'Chargement...' : 'Suivant'}
                                            </button>
                                        ) : (
                                            <button
                                                type={!requirements.payment.required || paymentStage === 'pay' ? 'submit' : 'button'}
                                                onClick={!requirements.payment.required || paymentStage === 'pay' ? undefined : nextStep}
                                                className={`btn ${
                                                    !requirements.payment.required || paymentStage === 'pay' ? 'btn--success' : 'btn--primary'
                                                } ${!validateStep() ? 'btn--disabled' : ''}`}
                                                disabled={isLoading || processing || !validateStep() || (isView && !canEdit)}
                                            >
                                                {isLoading
                                                    ? (paymentStage === 'pay' || !requirements.payment.required)
                                                        ? 'Traitement...'
                                                        : 'Chargement...'
                                                    : !requirements.payment.required
                                                      ? '✨ Valider'
                                                      : paymentStage === 'confirm'
                                                        ? 'Continuer vers le paiement'
                                                        : '✨ Payer & Valider'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Progress Sidebar */}
                            <div className="progress-sidebar">
                                <div className="progress-sidebar__header">
                                    <h3 className="progress-sidebar__title">📋 Progression</h3>
                                    <div className="progress-sidebar__stats">
                                        <span className="progress-stats">
                                            {progressStats.completed}/{progressStats.total} complétés
                                        </span>
                                    </div>
                                </div>

                                <div className="progress-sidebar__content">
                                    {sidebarSections.map((section, sectionIndex) => {
                                        const completedCount = section.fields.filter(field => 
                                            isSidebarFieldCompleted(field as SidebarField)
                                        ).length;

                                        return (
                                            <div key={sectionIndex} className="accordion-section">
                                                <button 
                                                    type="button" 
                                                    className="accordion-header" 
                                                    onClick={() => toggleSection(sectionIndex)}
                                                >
                                                    <div className="accordion-header__content">
                                                        <h4 className="accordion-header__title">{section.title}</h4>
                                                        <div className="accordion-header__count">
                                                            <span className="field-count">
                                                                {completedCount}/{section.fields.length}
                                                            </span>
                                                            <svg
                                                                className={`accordion-icon ${
                                                                    expandedSections[sectionIndex] ? 'accordion-icon--expanded' : ''
                                                                }`}
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path d="M7 10l5 5 5-5z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </button>

                                                <div className={`accordion-content ${
                                                    expandedSections[sectionIndex] ? 'accordion-content--expanded' : ''
                                                }`}>
                                                    <div className="accordion-content__inner">
                                                        {section.fields.map((field, fieldIndex) => {
                                                            const typedField = field as SidebarField;
                                                            const isCompleted = isSidebarFieldCompleted(typedField);

                                                            return (
                                                                <div
                                                                    key={fieldIndex}
                                                                    className={`progress-item ${
                                                                        isCompleted ? 'progress-item--completed' : ''
                                                                    }`}
                                                                >
                                                                    <div className="progress-item__icon">
                                                                        {isCompleted ? (
                                                                            <div className="progress-item__check">
                                                                                <svg viewBox="0 0 24 24" className="check-icon">
                                                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                                </svg>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="progress-item__emoji">{typedField.icon}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="progress-item__content">
                                                                        <span className="progress-item__label">{typedField.label}</span>
                                                                        {isCompleted && (
                                                                            <span className="progress-item__value">
                                                                                {getSidebarFieldValue(typedField)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Global Progress Bar */}
                                <div className="progress-sidebar__footer">
                                    <div className="global-progress">
                                        <div className="global-progress__label">Progression globale</div>
                                        <div className="global-progress__bar">
                                            <div 
                                                className="global-progress__fill" 
                                                style={{ width: `${progressStats.percentage}%` }} 
                                            />
                                        </div>
                                        <div className="global-progress__percentage">{progressStats.percentage}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Dashboard>
    );
}