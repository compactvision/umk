import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import BackButton from '@/components/UI/dashboard/BackButton';
import {
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FileText,
    GraduationCap,
    Lock,
    Mail,
    Upload,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Enrollment() {
    const [step, setStep] = useState(1);
    const [paymentStage, setPaymentStage] = useState('confirm');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ 0: true, 1: false, 2: false, 3: false });

    const [formData, setFormData] = useState({
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

    const faculties = [
        { id: 1, name: 'Sciences et Technologies' },
        { id: 2, name: 'Lettres et Sciences Humaines' },
        { id: 3, name: 'Médecine et Sciences de la Santé' },
    ];

    const requirements = {
        personal_info: [
            { key: 'photo', label: "Photo d'identité", required: true },
            { key: 'id_card', label: "Carte d'identité", required: true },
        ],
        academic_info: [
            { key: 'diploma', label: 'Diplôme', required: true },
            { key: 'transcript', label: 'Relevé de notes', required: true },
        ],
        payment: { required: true, amount: 500, currency: 'EUR' },
    };

    const stepperLabels = ['Faculté', 'Infos', 'Académique', 'Paiement'];

    const validateStep = () => {
        switch (step) {
            case 1:
                return !!(formData.faculty_id && formData.level_id && formData.year_id);
            case 2:
                return !!(formData.name && formData.email);
            case 3:
                return !!formData.program;
            case 4:
                if (!isConfirmed) return false;
                if (paymentStage === 'pay') return !!(formData.cardNumber && formData.cvv);
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (step === 4) {
            if (paymentStage === 'confirm') {
                setPaymentStage('pay');
                return;
            }
        }
        if (step < 4) setStep((s) => s + 1);
    };

    const prevStep = () => {
        if (step === 4 && paymentStage === 'pay') {
            setPaymentStage('confirm');
            return;
        }
        if (step > 1) setStep((s) => s - 1);
    };

    const sidebarSections = useMemo(
        () => [
            {
                title: 'Choix de la Faculté',
                fields: [
                    { key: 'faculty_id', label: 'Faculté', icon: Building2 },
                    { key: 'level_id', label: 'Niveau académique', icon: GraduationCap },
                    { key: 'year_id', label: "Année d'inscription", icon: Calendar },
                ],
            },
            {
                title: 'Informations Personnelles',
                fields: [
                    { key: 'name', label: 'Nom complet', icon: User },
                    { key: 'email', label: 'Adresse email', icon: Mail },
                    { key: 'photo', label: "Photo d'identité", icon: FileText, type: 'doc' },
                    { key: 'id_card', label: "Carte d'identité", icon: FileText, type: 'doc' },
                ],
            },
            {
                title: 'Parcours Académique',
                fields: [
                    { key: 'program', label: "Programme d'études", icon: BookOpen },
                    { key: 'diploma', label: 'Diplôme', icon: FileText, type: 'doc' },
                    { key: 'transcript', label: 'Relevé de notes', icon: FileText, type: 'doc' },
                ],
            },
            {
                title: 'Paiement & Confirmation',
                fields: [
                    { key: 'confirmed', label: 'Certification', icon: CheckCircle2, type: 'confirm' },
                    { key: 'cardNumber', label: 'Numéro de carte', icon: CreditCard, type: 'payment' },
                    { key: 'cvv', label: 'Code CVV', icon: Lock, type: 'payment' },
                ],
            },
        ],
        [],
    );

    const isFieldCompleted = (field) => {
        if (field.type === 'confirm') return isConfirmed;
        if (field.type === 'payment') return !!formData[field.key];
        return !!formData[field.key];
    };

    const totalFields = sidebarSections.reduce((acc, s) => acc + s.fields.length, 0);
    const completedFields = sidebarSections.reduce((acc, s) => acc + s.fields.filter(isFieldCompleted).length, 0);
    const percentage = Math.round((completedFields / totalFields) * 100);

    return (
        <Dashboard>
            <div className="subscription">
                <BackButton />
            </div>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                {/* Header avec stepper flottant */}
                <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/80 shadow-lg shadow-purple-100/20 backdrop-blur-xl">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {/* Barre de progression */}
                        <div className="mb-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-600">Étape {step} sur 4</span>
                                <span className="text-sm font-bold text-indigo-600">{Math.round((step / 4) * 100)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-700 ease-out"
                                    style={{ width: `${(step / 4) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Stepper */}
                        <div className="relative flex items-center justify-between">
                            <div className="absolute top-5 right-0 left-0 h-0.5 bg-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                                />
                            </div>

                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="relative z-10 flex flex-col items-center">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 sm:h-12 sm:w-12 ${
                                            step >= s
                                                ? 'scale-110 bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-300/50'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        {step > s ? (
                                            <Check className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                                        ) : (
                                            <span className={`text-sm font-bold sm:text-base ${step >= s ? 'text-white' : 'text-gray-400'}`}>
                                                {s}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 hidden text-xs font-medium transition-colors sm:block sm:text-sm ${
                                            step >= s ? 'text-indigo-600' : 'text-gray-400'
                                        }`}
                                    >
                                        {stepperLabels[s - 1]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                        {/* Formulaire principal */}
                        <div className="lg:col-span-2">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-purple-100/30 backdrop-blur-sm sm:p-8 lg:p-10">
                                <div className="mb-8">
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
                                    <p className="mt-2 text-gray-600">Remplissez les informations ci-dessous avec précision</p>
                                </div>

                                <form className="space-y-6">
                                    {/* Step 1 */}
                                    {step === 1 && (
                                        <div className="animate-fadeIn space-y-6">
                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <Building2 className="mr-2 inline h-4 w-4 text-indigo-600" />
                                                    Faculté
                                                </label>
                                                <select
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                                                    value={formData.faculty_id}
                                                    onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                                >
                                                    <option value="">Sélectionnez une faculté</option>
                                                    {faculties.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <GraduationCap className="mr-2 inline h-4 w-4 text-purple-600" />
                                                    Niveau académique
                                                </label>
                                                <select
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all duration-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                                                    value={formData.level_id}
                                                    onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                                                    disabled={!formData.faculty_id}
                                                >
                                                    <option value="">Sélectionnez un niveau</option>
                                                    <option value="1">Licence 1</option>
                                                    <option value="2">Licence 2</option>
                                                    <option value="3">Master 1</option>
                                                </select>
                                            </div>

                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <Calendar className="mr-2 inline h-4 w-4 text-pink-600" />
                                                    Année d'inscription
                                                </label>
                                                <select
                                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all duration-300 focus:border-pink-600 focus:ring-4 focus:ring-pink-100"
                                                    value={formData.year_id}
                                                    onChange={(e) => setFormData({ ...formData, year_id: e.target.value })}
                                                >
                                                    <option value="">Sélectionnez une année</option>
                                                    <option value="2024">2024-2025</option>
                                                    <option value="2025">2025-2026</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2 */}
                                    {step === 2 && (
                                        <div className="animate-fadeIn space-y-6">
                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <User className="mr-2 inline h-4 w-4 text-indigo-600" />
                                                    Nom complet
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                                                    placeholder="Jean Dupont"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <Mail className="mr-2 inline h-4 w-4 text-purple-600" />
                                                    Adresse email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                                                    placeholder="jean.dupont@email.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>

                                            {requirements.personal_info.map((doc) => (
                                                <div key={doc.key} className="group">
                                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                        <FileText className="mr-2 inline h-4 w-4 text-pink-600" />
                                                        {doc.label}
                                                    </label>
                                                    <div className="relative">
                                                        <input type="file" className="hidden" id={doc.key} />
                                                        <label
                                                            htmlFor={doc.key}
                                                            className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50"
                                                        >
                                                            <Upload className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600" />
                                                            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">
                                                                Cliquez pour télécharger
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Step 3 */}
                                    {step === 3 && (
                                        <div className="animate-fadeIn space-y-6">
                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    <BookOpen className="mr-2 inline h-4 w-4 text-indigo-600" />
                                                    Programme d'études
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                                                    placeholder="Ex: Informatique"
                                                    value={formData.program}
                                                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                                                />
                                            </div>

                                            {requirements.academic_info.map((doc) => (
                                                <div key={doc.key} className="group">
                                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                        <FileText className="mr-2 inline h-4 w-4 text-purple-600" />
                                                        {doc.label}
                                                    </label>
                                                    <div className="relative">
                                                        <input type="file" className="hidden" id={doc.key} />
                                                        <label
                                                            htmlFor={doc.key}
                                                            className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-all duration-300 hover:border-purple-400 hover:bg-purple-50"
                                                        >
                                                            <Upload className="h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-600" />
                                                            <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                                                                Cliquez pour télécharger
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Step 4 */}
                                    {step === 4 && (
                                        <div className="animate-fadeIn space-y-6">
                                            <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
                                                <label className="group flex cursor-pointer items-start gap-3">
                                                    <div className="relative mt-1 flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isConfirmed}
                                                            onChange={(e) => setIsConfirmed(e.target.checked)}
                                                            className="h-6 w-6 cursor-pointer rounded-lg border-2 border-indigo-300 transition-all duration-300 checked:border-indigo-600 checked:bg-indigo-600"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-semibold text-gray-800 transition-colors group-hover:text-indigo-600">
                                                            Je certifie l'exactitude des informations
                                                        </span>
                                                        <span className="mt-1 block text-xs text-gray-600">
                                                            En cochant cette case, vous confirmez que toutes les informations fournies sont vraies et
                                                            complètes
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>

                                            {paymentStage === 'pay' && (
                                                <div className="space-y-6">
                                                    <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-gray-700">Montant à régler</span>
                                                            <span className="text-2xl font-bold text-green-600">
                                                                {requirements.payment.amount} {requirements.payment.currency}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="group">
                                                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                            <CreditCard className="mr-2 inline h-4 w-4 text-indigo-600" />
                                                            Numéro de carte
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                                                            placeholder="1234 5678 9012 3456"
                                                            value={formData.cardNumber}
                                                            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="group">
                                                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                            <Lock className="mr-2 inline h-4 w-4 text-purple-600" />
                                                            Code CVV
                                                        </label>
                                                        <input
                                                            type="text"
                                                            maxLength={3}
                                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
                                                            placeholder="123"
                                                            value={formData.cvv}
                                                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Boutons de navigation */}
                                    <div className="flex gap-4 pt-6">
                                        {(step > 1 || (step === 4 && paymentStage === 'pay')) && (
                                            <button
                                                type="button"
                                                onClick={prevStep}
                                                className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                                Précédent
                                            </button>
                                        )}

                                        {step < 4 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={!validateStep()}
                                                className={`ml-auto flex items-center gap-2 rounded-xl px-8 py-3 font-semibold transition-all duration-300 ${
                                                    validateStep()
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-300/50 hover:scale-105 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-400/50'
                                                        : 'cursor-not-allowed bg-gray-200 text-gray-400'
                                                }`}
                                            >
                                                Suivant
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={!validateStep()}
                                                className={`ml-auto flex items-center gap-2 rounded-xl px-8 py-3 font-semibold transition-all duration-300 ${
                                                    validateStep()
                                                        ? paymentStage === 'pay'
                                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-300/50 hover:scale-105 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-400/50'
                                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-300/50 hover:scale-105 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-400/50'
                                                        : 'cursor-not-allowed bg-gray-200 text-gray-400'
                                                }`}
                                            >
                                                {paymentStage === 'confirm' ? (
                                                    <>
                                                        Continuer vers le paiement <ChevronRight className="h-5 w-5" />
                                                    </>
                                                ) : (
                                                    <>✨ Payer & Valider</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sidebar de progression */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32">
                                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-purple-100/30 backdrop-blur-sm">
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-xl font-bold text-gray-800">📋 Progression</h3>
                                        <p className="text-sm text-gray-600">
                                            {completedFields}/{totalFields} champs complétés
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-right text-sm font-bold text-indigo-600">{percentage}%</p>
                                    </div>

                                    <div className="space-y-3">
                                        {sidebarSections.map((section, idx) => {
                                            const completed = section.fields.filter(isFieldCompleted).length;
                                            const Icon = section.fields[0]?.icon;

                                            return (
                                                <div key={idx} className="overflow-hidden rounded-2xl border border-gray-200">
                                                    <button
                                                        onClick={() => setExpandedSections({ ...expandedSections, [idx]: !expandedSections[idx] })}
                                                        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {Icon && <Icon className="h-5 w-5 text-indigo-600" />}
                                                            <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-indigo-600">
                                                                {completed}/{section.fields.length}
                                                            </span>
                                                            <ChevronDown
                                                                className={`h-4 w-4 text-gray-400 transition-transform ${expandedSections[idx] ? 'rotate-180' : ''}`}
                                                            />
                                                        </div>
                                                    </button>

                                                    {expandedSections[idx] && (
                                                        <div className="space-y-2 px-4 pb-4">
                                                            {section.fields.map((field, fidx) => {
                                                                const FieldIcon = field.icon;
                                                                const completed = isFieldCompleted(field);

                                                                return (
                                                                    <div
                                                                        key={fidx}
                                                                        className={`flex items-center gap-3 rounded-lg p-2 ${completed ? 'bg-green-50' : 'bg-gray-50'}`}
                                                                    >
                                                                        <div
                                                                            className={`flex h-6 w-6 items-center justify-center rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`}
                                                                        >
                                                                            {completed ? (
                                                                                <Check className="h-4 w-4 text-white" />
                                                                            ) : (
                                                                                <FieldIcon className="h-3 w-3 text-gray-500" />
                                                                            )}
                                                                        </div>
                                                                        <span
                                                                            className={`text-xs font-medium ${completed ? 'text-green-700' : 'text-gray-600'}`}
                                                                        >
                                                                            {field.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .animate-fadeIn {
                        animation: fadeIn 0.5s ease-out;
                    }

                    @media (max-width: 640px) {
                        .stepper__labels {
                            font-size: 0.75rem;
                        }
                    }
                `}</style>
            </div>
        </Dashboard>
    );
}
