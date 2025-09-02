import { useState, useEffect } from "react";
import Dashboard from '@/components/layouts/Dashboard/Dashboard';

export default function Enrollment() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        0: true, // Première section ouverte par défaut
        1: false,
        2: false,
        3: false
    });
    const [formData, setFormData] = useState({
        faculty: "",
        academicLevel: "",
        enrollmentYear: "",
        name: "",
        email: "",
        program: "",
        level: "",
        cardNumber: "",
        cvv: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep = () => {
        if (step === 1) {
            return formData.faculty !== "" && formData.academicLevel !== "" && formData.enrollmentYear !== "";
        }
        if (step === 2) {
            return formData.name.trim() !== "" && formData.email.trim() !== "";
        }
        if (step === 3) {
            return formData.program !== "" && formData.level !== "";
        }
        if (step === 4) {
            return formData.cardNumber.trim() !== "" && formData.cvv.trim() !== "";
        }
        return false;
    };

    const nextStep = async () => {
        if (!validateStep()) return;

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setStep(step + 1);
        setIsLoading(false);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        alert("Inscription validée ✅");
    };

    const getStepTitle = () => {
        const titles = {
            1: "Choix de la Faculté",
            2: "Informations Personnelles",
            3: "Parcours Académique",
            4: "Finalisation du Paiement"
        };
        return titles[step];
    };

    // Fonction pour vérifier si un champ est rempli
    const isFieldCompleted = (fieldName) => {
        return formData[fieldName] && formData[fieldName].trim() !== "";
    };

    // Fonction pour basculer l'état d'une section
    const toggleSection = (sectionIndex) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionIndex]: !prev[sectionIndex]
        }));
    };

    // Fonction pour compter les champs complétés dans une section
    const getCompletedFieldsCount = (fields) => {
        return fields.filter(field => isFieldCompleted(field.key)).length;
    };

    // Configuration des sections pour la sidebar
    const sidebarSections = [
        {
            title: "Choix de la Faculté",
            fields: [
                { key: "faculty", label: "Faculté", icon: "🏛️" },
                { key: "academicLevel", label: "Niveau académique", icon: "📚" },
                { key: "enrollmentYear", label: "Année d'inscription", icon: "📅" }
            ]
        },
        {
            title: "Informations Personnelles",
            fields: [
                { key: "name", label: "Nom complet", icon: "👤" },
                { key: "email", label: "Adresse email", icon: "📧" }
            ]
        },
        {
            title: "Parcours Académique",
            fields: [
                { key: "program", label: "Programme d'études", icon: "📚" },
                { key: "level", label: "Niveau d'études", icon: "🎓" }
            ]
        },
        {
            title: "Informations de Paiement",
            fields: [
                { key: "cardNumber", label: "Numéro de carte", icon: "💳" },
                { key: "cvv", label: "Code CVV", icon: "🔒" }
            ]
        }
    ];

    return (
        <Dashboard>
            <div className="subscription">
            {/* Header avec stepper */}
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
                            <div key={s} className={`stepper__step ${step >= s ? 'stepper__step--active' : ''} ${step > s ? 'stepper__step--completed' : ''}`}>
                                <div className="stepper__circle">
                                    {step > s ? (
                                        <svg className="stepper__check" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                    ) : (
                                        <span className="stepper__number">{s}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Labels du stepper */}
                    <div className="stepper__labels">
                        {['Faculté', 'Infos', 'Académique', 'Paiement'].map((label, index) => (
                            <span key={index} className={`stepper__label ${step >= index + 1 ? 'stepper__label--active' : ''}`}>
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <main className="subscription__main">
                <div className="container">
                    <div className="content-wrapper">
                        {/* Formulaire principal */}
                        <div className="form-container">
                            <h2 className="form__title">{getStepTitle()}</h2>

                            <form onSubmit={handleSubmit} className="form">
                                {/* Étape 1 - Choix de la faculté */}
                                {step === 1 && (
                                    <div className="form__step">
                                        <div className="form__fields">
                                            <div className="form-field">
                                                <label className="form-field__label">Faculté</label>
                                                <select
                                                    name="faculty"
                                                    value={formData.faculty}
                                                    onChange={handleChange}
                                                    className="form-field__input"
                                                    required
                                                >
                                                    <option value="">Sélectionnez une faculté</option>
                                                    <option value="sciences">🧪 Faculté des Sciences</option>
                                                    <option value="lettres">📚 Faculté des Lettres et Sciences Humaines</option>
                                                    <option value="droit">⚖️ Faculté de Droit</option>
                                                    <option value="economie">💼 Faculté d'Économie et Gestion</option>
                                                    <option value="medecine">⚕️ Faculté de Médecine</option>
                                                    <option value="ingenierie">🔧 Faculté d'Ingénierie</option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label className="form-field__label">Niveau académique</label>
                                                <select
                                                    name="academicLevel"
                                                    value={formData.academicLevel}
                                                    onChange={handleChange}
                                                    className="form-field__input"
                                                    required
                                                >
                                                    <option value="">Sélectionnez un niveau</option>
                                                    <option value="licence">🎓 Licence (L1, L2, L3)</option>
                                                    <option value="master">🎖️ Master (M1, M2)</option>
                                                    <option value="doctorat">👨‍🎓 Doctorat (PhD)</option>
                                                    <option value="formation">📋 Formation Continue</option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label className="form-field__label">Année d'inscription</label>
                                                <select
                                                    name="enrollmentYear"
                                                    value={formData.enrollmentYear}
                                                    onChange={handleChange}
                                                    className="form-field__input"
                                                    required
                                                >
                                                    <option value="">Sélectionnez une année</option>
                                                    <option value="2024-2025">📅 2024-2025</option>
                                                    <option value="2025-2026">📅 2025-2026</option>
                                                    <option value="2026-2027">📅 2026-2027</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Étape 2 - Informations personnelles */}
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
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Étape 3 - Parcours académique */}
                                {step === 3 && (
                                    <div className="form__step">
                                        <div className="form__fields">
                                            <div className="form-field">
                                                <label className="form-field__label">Programme d'études</label>
                                                <select
                                                    name="program"
                                                    value={formData.program}
                                                    onChange={handleChange}
                                                    className="form-field__input"
                                                    required
                                                >
                                                    <option value="">Sélectionnez un programme</option>
                                                    <option value="informatique">💻 Informatique</option>
                                                    <option value="gestion">📊 Gestion</option>
                                                    <option value="droit">⚖️ Droit</option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label className="form-field__label">Niveau d'études</label>
                                                <select
                                                    name="level"
                                                    value={formData.level}
                                                    onChange={handleChange}
                                                    className="form-field__input"
                                                    required
                                                >
                                                    <option value="">Sélectionnez un niveau</option>
                                                    <option value="l1">🎓 Licence 1</option>
                                                    <option value="l2">🎓 Licence 2</option>
                                                    <option value="m1">🎖️ Master 1</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Étape 4 - Paiement */}
                                {step === 4 && (
                                    <div className="form__step">
                                        <div className="form__fields">
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
                                                    maxLength="3"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="form__actions">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="btn btn--secondary"
                                            disabled={isLoading}
                                        >
                                            Précédent
                                        </button>
                                    )}

                                    {step < 4 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className={`btn btn--primary ${!validateStep() ? 'btn--disabled' : ''}`}
                                            disabled={isLoading || !validateStep()}
                                        >
                                            {isLoading ? 'Chargement...' : 'Suivant'}
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            className={`btn btn--success ${!validateStep() ? 'btn--disabled' : ''}`}
                                            disabled={isLoading || !validateStep()}
                                        >
                                            {isLoading ? 'Traitement...' : '✨ Valider'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Sidebar de progression avec accordion */}
                        <div className="progress-sidebar">
                            <div className="progress-sidebar__header">
                                <h3 className="progress-sidebar__title">📋 Progression</h3>
                                <div className="progress-sidebar__stats">
                                    <span className="progress-stats">
                                        {Object.values(formData).filter(value => value && value.trim() !== "").length}/9 complétés
                                    </span>
                                </div>
                            </div>

                            <div className="progress-sidebar__content">
                                {sidebarSections.map((section, sectionIndex) => (
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
                                                        {getCompletedFieldsCount(section.fields)}/{section.fields.length}
                                                    </span>
                                                    <svg
                                                        className={`accordion-icon ${expandedSections[sectionIndex] ? 'accordion-icon--expanded' : ''}`}
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M7 10l5 5 5-5z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        </button>

                                        <div className={`accordion-content ${expandedSections[sectionIndex] ? 'accordion-content--expanded' : ''}`}>
                                            <div className="accordion-content__inner">
                                                {section.fields.map((field, fieldIndex) => (
                                                    <div key={fieldIndex} className={`progress-item ${isFieldCompleted(field.key) ? 'progress-item--completed' : ''}`}>
                                                        <div className="progress-item__icon">
                                                            {isFieldCompleted(field.key) ? (
                                                                <div className="progress-item__check">
                                                                    <svg viewBox="0 0 24 24" className="check-icon">
                                                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <span className="progress-item__emoji">{field.icon}</span>
                                                            )}
                                                        </div>
                                                        <div className="progress-item__content">
                                                            <span className="progress-item__label">{field.label}</span>
                                                            {isFieldCompleted(field.key) && (
                                                                <span className="progress-item__value">
                                                                    {field.key === 'faculty' ? (
                                                                        formData[field.key] === 'sciences' ? '🧪 Faculté des Sciences' :
                                                                        formData[field.key] === 'lettres' ? '📚 Faculté des Lettres' :
                                                                        formData[field.key] === 'droit' ? '⚖️ Faculté de Droit' :
                                                                        formData[field.key] === 'economie' ? '💼 Faculté d\'Économie' :
                                                                        formData[field.key] === 'medecine' ? '⚕️ Faculté de Médecine' :
                                                                        formData[field.key] === 'ingenierie' ? '🔧 Faculté d\'Ingénierie' : formData[field.key]
                                                                    ) : field.key === 'academicLevel' ? (
                                                                        formData[field.key] === 'licence' ? '🎓 Licence' :
                                                                        formData[field.key] === 'master' ? '🎖️ Master' :
                                                                        formData[field.key] === 'doctorat' ? '👨‍🎓 Doctorat' :
                                                                        formData[field.key] === 'formation' ? '📋 Formation Continue' : formData[field.key]
                                                                    ) : field.key === 'enrollmentYear' ? (
                                                                        '📅 ' + formData[field.key]
                                                                    ) : field.key === 'program' ? (
                                                                        formData[field.key] === 'informatique' ? '💻 Informatique' :
                                                                        formData[field.key] === 'gestion' ? '📊 Gestion' :
                                                                        formData[field.key] === 'droit' ? '⚖️ Droit' : formData[field.key]
                                                                    ) : field.key === 'level' ? (
                                                                        formData[field.key] === 'l1' ? '🎓 Licence 1' :
                                                                        formData[field.key] === 'l2' ? '🎓 Licence 2' :
                                                                        formData[field.key] === 'm1' ? '🎖️ Master 1' : formData[field.key]
                                                                    ) : field.key === 'cardNumber' ?
                                                                        '**** **** **** ' + formData[field.key].slice(-4) :
                                                                        field.key === 'cvv' ? '***' :
                                                                            formData[field.key]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Barre de progression globale */}
                            <div className="progress-sidebar__footer">
                                <div className="global-progress">
                                    <div className="global-progress__label">Progression globale</div>
                                    <div className="global-progress__bar">
                                        <div
                                            className="global-progress__fill"
                                            style={{
                                                width: `${(Object.values(formData).filter(value => value && value.trim() !== "").length / 9) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="global-progress__percentage">
                                        {Math.round((Object.values(formData).filter(value => value && value.trim() !== "").length / 9) * 100)}%
                                    </div>
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
