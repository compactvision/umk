import { useState, useEffect } from "react";
import Dashboard from '@/components/layouts/Dashboard/Dashboard';

export default function Subscription() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        0: true, // Première section ouverte par défaut
        1: false,
        2: false
    });
    const [formData, setFormData] = useState({
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
            return formData.name.trim() !== "" && formData.email.trim() !== "";
        }
        if (step === 2) {
            return formData.program !== "" && formData.level !== "";
        }
        if (step === 3) {
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
            1: "Informations Personnelles",
            2: "Parcours Académique",
            3: "Finalisation du Paiement"
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
                                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                                />
                            </div>

                            {[1, 2, 3].map((s) => (
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
                            {['Informations', 'Académiques', 'Paiement'].map((label, index) => (
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
                                    {/* Étape 1 */}
                                    {step === 1 && (
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

                                    {/* Étape 2 */}
                                    {step === 2 && (
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

                                    {/* Étape 3 */}
                                    {step === 3 && (
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

                                        {step < 3 ? (
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
                                            {Object.values(formData).filter(value => value && value.trim() !== "").length}/6 complétés
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
                                                                        {field.key === 'program' ? (
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
                                                    width: `${(Object.values(formData).filter(value => value && value.trim() !== "").length / 6) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <div className="global-progress__percentage">
                                            {Math.round((Object.values(formData).filter(value => value && value.trim() !== "").length / 6) * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <style jsx>{`
                    .subscription {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: #1f2937;
                    }

                    .container {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 0 20px;
                    }

                    /* Header */
                    .subscription__header {
                        background-color: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 40px 0;
                    }

                    /* Stepper */
                    .stepper {
                        position: relative;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        max-width: 600px;
                        margin: 0 auto 30px auto;
                    }

                    .stepper__track {
                        position: absolute;
                        top: 50%;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: #e2e8f0;
                        border-radius: 1px;
                        transform: translateY(-50%);
                    }

                    .stepper__progress {
                        height: 100%;
                        background: #3b82f6;
                        border-radius: 1px;
                        transition: width 0.5s ease;
                    }

                    .stepper__step {
                        position: relative;
                        z-index: 2;
                    }

                    .stepper__circle {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: #ffffff;
                        border: 2px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    }

                    .stepper__step--active .stepper__circle {
                        border-color: #3b82f6;
                        background: #3b82f6;
                    }

                    .stepper__step--completed .stepper__circle {
                        border-color: #10b981;
                        background: #10b981;
                    }

                    .stepper__number {
                        font-size: 14px;
                        font-weight: 600;
                        color: #64748b;
                    }

                    .stepper__step--active .stepper__number {
                        color: white;
                    }

                    .stepper__check {
                        width: 16px;
                        height: 16px;
                        fill: white;
                    }

                    /* Labels du stepper */
                    .stepper__labels {
                        display: flex;
                        justify-content: space-between;
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    .stepper__label {
                        font-size: 14px;
                        color: #64748b;
                        font-weight: 500;
                        text-align: center;
                        transition: color 0.3s ease;
                    }

                    .stepper__label--active {
                        color: #1e293b;
                        font-weight: 600;
                    }

                    /* Main content */
                    .subscription__main {
                        padding: 60px 0;
                        min-height: calc(100vh - 200px);
                    }

                    .content-wrapper {
                        display: grid;
                        grid-template-columns: 1fr 350px;
                        gap: 40px;
                        align-items: start;
                    }

                    .form-container {
                        width: 100%;
                    }

                    .form__title {
                        font-size: 1.8rem;
                        font-weight: 600;
                        text-align: center;
                        margin-bottom: 40px;
                        color: #1e293b;
                    }

                    /* Formulaire */
                    .form {
                        background: #ffffff;
                        border-radius: 16px;
                        padding: 50px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        border: 1px solid #e2e8f0;
                        min-height: 500px;
                    }

                    .form__step {
                        animation: fadeIn 0.5s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .form__fields {
                        display: flex;
                        flex-direction: column;
                        gap: 35px;
                        margin-bottom: 50px;
                    }

                    /* Champs de formulaire */
                    .form-field {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form-field__label {
                        font-size: 15px;
                        font-weight: 500;
                        color: #374151;
                    }

                    .form-field__input {
                        padding: 16px 20px;
                        border: 1px solid #d1d5db;
                        border-radius: 10px;
                        font-size: 16px;
                        transition: all 0.3s ease;
                        background: #ffffff;
                        min-height: 56px;
                    }

                    .form-field__input:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .form-field__input::placeholder {
                        color: #9ca3af;
                    }

                    /* Boutons */
                    .form__actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 16px;
                        margin-top: auto;
                    }

                    .btn {
                        padding: 16px 32px;
                        border: none;
                        border-radius: 10px;
                        font-size: 15px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 140px;
                    }

                    .btn:disabled {
                        cursor: not-allowed;
                    }

                    .btn--primary {
                        background: #3b82f6;
                        color: white;
                    }

                    .btn--primary:hover:not(:disabled) {
                        background: #2563eb;
                    }

                    .btn--secondary {
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                    }

                    .btn--secondary:hover:not(:disabled) {
                        background: #e5e7eb;
                    }

                    .btn--success {
                        background: #10b981;
                        color: white;
                    }

                    .btn--success:hover:not(:disabled) {
                        background: #059669;
                    }

                    .btn--disabled {
                        background: #f3f4f6 !important;
                        color: #9ca3af !important;
                        cursor: not-allowed !important;
                    }

                    /* Sidebar de progression */
                    .progress-sidebar {
                        background: #ffffff;
                        border-radius: 16px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        overflow: hidden;
                        position: sticky;
                        top: 20px;
                    }

                    .progress-sidebar__header {
                        padding: 24px;
                        border-bottom: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }

                    .progress-sidebar__title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1e293b;
                        margin: 0 0 8px 0;
                    }

                    .progress-stats {
                        font-size: 14px;
                        color: #64748b;
                        font-weight: 500;
                    }

                    .progress-sidebar__content {
                        padding: 0;
                        max-height: 600px;
                        overflow-y: auto;
                    }

                    /* Accordion Styles */
                    .accordion-section {
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .accordion-section:last-child {
                        border-bottom: none;
                    }

                    .accordion-header {
                        width: 100%;
                        padding: 20px 24px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: left;
                    }

                    .accordion-header:hover {
                        background: #f8fafc;
                    }

                    .accordion-header__content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 100%;
                    }

                    .accordion-header__title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #374151;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .accordion-header__count {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .field-count {
                        font-size: 12px;
                        font-weight: 600;
                        color: #3b82f6;
                        background: #eff6ff;
                        padding: 4px 8px;
                        border-radius: 12px;
                        min-width: 35px;
                        text-align: center;
                    }

                    .accordion-icon {
                        width: 20px;
                        height: 20px;
                        fill: #64748b;
                        transition: transform 0.2s ease;
                    }

                    .accordion-icon--expanded {
                        transform: rotate(180deg);
                    }

                    .accordion-content {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.3s ease;
                    }

                    .accordion-content--expanded {
                        max-height: 400px;
                    }

                    .accordion-content__inner {
                        padding: 0 24px 20px 24px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .progress-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 12px;
                        border-radius: 8px;
                        transition: all 0.3s ease;
                        border: 1px solid transparent;
                    }

                    .progress-item--completed {
                        background: #f0fdf4;
                        border-color: #bbf7d0;
                    }

                    .progress-item__icon {
                        flex-shrink: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .progress-item__check {
                        width: 20px;
                        height: 20px;
                        background: #10b981;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .check-icon {
                        width: 12px;
                        height: 12px;
                        fill: white;
                    }

                    .progress-item__emoji {
                        font-size: 16px;
                    }

                    .progress-item__content {
                        flex: 1;
                        min-width: 0;
                    }

                    .progress-item__label {
                        display: block;
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 2px;
                    }

                    .progress-item__value {
                        display: block;
                        font-size: 12px;
                        color: #10b981;
                        font-weight: 500;
                        word-break: break-all;
                    }

                    /* Barre de progression globale */
                    .progress-sidebar__footer {
                        padding: 24px;
                        border-top: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }

                    .global-progress__label {
                        font-size: 14px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 8px;
                    }

                    .global-progress__bar {
                        height: 8px;
                        background: #e2e8f0;
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 8px;
                    }

                    .global-progress__fill {
                        height: 100%;
                        background: linear-gradient(90deg, #3b82f6, #10b981);
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    }

                    .global-progress__percentage {
                        text-align: center;
                        font-size: 14px;
                        font-weight: 600;
                        color: #1e293b;
                    }

                    /* Responsive */
                    @media (max-width: 1024px) {
                        .content-wrapper {
                            grid-template-columns: 1fr;
                            gap: 40px;
                        }

                        .progress-sidebar {
                            order: -1;
                            position: static;
                        }
                    }

                    @media (max-width: 768px) {
                        .form {
                            padding: 30px 20px;
                            margin: 0 10px;
                        }

                        .form__actions {
                            flex-direction: column;
                            gap: 12px;
                        }

                        .btn {
                            width: 100%;
                        }

                        .progress-sidebar__content {
                            max-height: none;
                        }

                        .accordion-content--expanded {
                            max-height: none;
                        }
                    }
                `}</style>
            </div>
        </Dashboard>
    );
}
