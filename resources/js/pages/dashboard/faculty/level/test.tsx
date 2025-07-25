import { useState, useEffect } from 'react';
import { Edit3, Plus, Trash2, Users, BookOpen, Award, Clock, MapPin, Mail, CheckCircle, X, Save, User, GraduationCap, Building } from 'lucide-react';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editField, setEditField] = useState('');
    const [modalValue, setModalValue] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [conditionMode, setConditionMode] = useState('add');
    const [conditionValue, setConditionValue] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const faculty = {
        name: "Faculté des Sciences Informatiques",
        professors: [
            {
                id: 1,
                name: "Dr. Jean Mbala",
                role: "Professeur principal",
                contact: "jean.mbala@univ.cd",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                specialty: "Intelligence Artificielle"
            },
            {
                id: 2,
                name: "Mme. Alice Kanza",
                role: "Enseignante",
                contact: "alice.kanza@univ.cd",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
                specialty: "Développement Web"
            },
            {
                id: 3,
                name: "Pr. Michel Ngoyi",
                role: "Coordonnateur académique",
                contact: "michel.ngoyi@univ.cd",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                specialty: "Bases de Données"
            }
        ]
    };

    const [level, setLevel] = useState({
        name: "Première Licence",
        code: "L1",
        credits: 60,
        hours: 1200,
        language: "Français",
        certificate: true,
        duration: "1 an",
        opportunities: "Développeur junior, Analyste, Support IT",
        courses_count: 12,
        banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop",
        description: "Ce programme forme des étudiants en informatique avec un accent sur le développement logiciel et la gestion de projets technologiques."
    });

    const [conditions, setConditions] = useState([
        "Avoir un diplôme d'État",
        "Avoir au moins 12/20 en mathématiques",
        "Passer un test d'entrée"
    ]);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const openEditModal = (field, value) => {
        setEditField(field);
        setModalValue(value.toString());
        setIsEditModalOpen(true);
    };

    const saveEdit = () => {
        let processedValue = modalValue;
        if (editField === 'credits' || editField === 'hours' || editField === 'courses_count') {
            processedValue = parseInt(modalValue) || 0;
        } else if (editField === 'certificate') {
            processedValue = modalValue.toLowerCase() === 'true' || modalValue.toLowerCase() === 'oui';
        }

        setLevel({ ...level, [editField]: processedValue });
        setIsEditModalOpen(false);
    };

    const openConditionModal = (mode, index = null, value = '') => {
        setConditionMode(mode);
        setEditIndex(index);
        setConditionValue(value);
        setIsConditionModalOpen(true);
    };

    const saveCondition = () => {
        if (conditionMode === 'add') {
            setConditions([...conditions, conditionValue]);
        } else if (conditionMode === 'edit' && editIndex !== null) {
            const updated = [...conditions];
            updated[editIndex] = conditionValue;
            setConditions(updated);
        }
        setIsConditionModalOpen(false);
        setConditionValue('');
    };

    const deleteCondition = (index) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const getFieldLabel = (field) => {
        const labels = {
            code: "Code du niveau",
            credits: "Crédits",
            hours: "Heures",
            duration: "Durée",
            courses_count: "Nombre de cours",
            language: "Langue",
            certificate: "Certificat",
            opportunities: "Opportunités",
            description: "Description"
        };
        return labels[field] || field;
    };

    const stats = [
        { field: 'code', value: level.code, icon: <Award size={24} />, color: 'purple' },
        { field: 'credits', value: level.credits, icon: <BookOpen size={24} />, color: 'blue' },
        { field: 'hours', value: level.hours, icon: <Clock size={24} />, color: 'green' },
        { field: 'duration', value: level.duration, icon: <Clock size={24} />, color: 'orange' },
        { field: 'courses_count', value: level.courses_count, icon: <GraduationCap size={24} />, color: 'red' }
    ];

    return (
        <div className="level-page">


            {/* Hero Section */}
            <div className="level-hero">
                <div className="level-hero__overlay"></div>
                <img
                    src={level.banner}
                    alt={level.name}
                    className="level-hero__banner"
                />
                <div className="level-hero__content">
                    <div className="level-hero__info">
                        <div className="level-hero__faculty">
                            <Building size={20} />
                            <span>{faculty.name}</span>
                        </div>
                        <h1 className="level-hero__title">{level.name}</h1>
                        <p className="level-hero__description">{level.description}</p>
                        <button
                            onClick={() => openEditModal('description', level.description)}
                            className="level-hero__edit-btn"
                        >
                            <Edit3 size={18} />
                            Modifier la description
                        </button>
                    </div>
                </div>
            </div>

            <div className="level-container">
                {/* Navigation Tabs */}
                <nav className="level-nav">
                    <ul className="level-nav__list">
                        {[
                            { id: 'infos', label: 'Informations', icon: <BookOpen size={20} /> },
                            { id: 'prof', label: 'Professeurs', icon: <Users size={20} /> },
                            { id: 'conditions', label: 'Conditions', icon: <CheckCircle size={20} /> },
                            { id: 'cours', label: 'Cours', icon: <GraduationCap size={20} /> }
                        ].map((tab) => (
                            <li key={tab.id} className="level-nav__item">
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`level-nav__btn ${
                                        activeTab === tab.id ? 'level-nav__btn--active' : 'level-nav__btn--inactive'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content */}
                <div className={`level-content ${isAnimating ? 'level-content--animating' : 'level-content--visible'}`}>
                    {activeTab === 'infos' && (
                        <div>
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                {stats.map((stat, index) => (
                                    <div
                                        key={stat.field}
                                        className={`stat-card stat-card--${stat.color}`}
                                        onClick={() => openEditModal(stat.field, stat.value)}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className={`stat-card__icon stat-card__icon--${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                        <div className="stat-card__label">{getFieldLabel(stat.field)}</div>
                                        <div className="stat-card__value">{stat.value}</div>
                                        <button className="stat-card__edit">
                                            <Edit3 size={16} />
                                            Modifier
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Details Section */}
                            <div className="details-section">
                                <h3 className="details-section__title">Détails du programme</h3>
                                <div className="details-list">
                                    {[
                                        { field: 'language', label: 'Langue d\'enseignement', value: level.language, icon: <Building size={20} /> },
                                        { field: 'certificate', label: 'Délivrance de certificat', value: level.certificate ? 'Oui' : 'Non', icon: <Award size={20} /> },
                                        { field: 'opportunities', label: 'Opportunités professionnelles', value: level.opportunities, icon: <User size={20} /> }
                                    ].map((item) => (
                                        <div key={item.field} className="detail-item">
                                            <div className="detail-item__content">
                                                <div className="detail-item__icon">
                                                    {item.icon}
                                                </div>
                                                <div className="detail-item__info">
                                                    <div className="detail-item__label">{item.label}</div>
                                                    <div className="detail-item__value">{item.value}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openEditModal(item.field, item.field === 'certificate' ? level.certificate : item.value)}
                                                className="detail-item__edit"
                                            >
                                                <Edit3 size={16} />
                                                Modifier
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prof' && (
                        <div className="professors-grid">
                            {faculty.professors.map((prof) => (
                                <div className="professor-card" key={prof.id}>
                                    <div className="professor-card__header">
                                        <img
                                            src={prof.avatar}
                                            alt={prof.name}
                                            className="professor-card__avatar"
                                        />
                                        <div className="professor-card__info">
                                            <h3 className="professor-card__name">{prof.name}</h3>
                                            <p className="professor-card__role">{prof.role}</p>
                                            <span className="professor-card__specialty">{prof.specialty}</span>
                                        </div>
                                    </div>
                                    <div className="professor-card__contact">
                                        <Mail size={16} />
                                        {prof.contact}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'conditions' && (
                        <div className="conditions-section">
                            <div className="conditions-section__header">
                                <h3 className="conditions-section__title">Conditions d'admission</h3>
                                <button
                                    className="conditions-section__add-btn"
                                    onClick={() => openConditionModal('add')}
                                >
                                    <Plus size={20} />
                                    Ajouter une condition
                                </button>
                            </div>
                            <ul className="conditions-list">
                                {conditions.map((condition, index) => (
                                    <li key={index} className="condition-item">
                                        <div className="condition-item__content">
                                            <div className="condition-item__icon"></div>
                                            <span className="condition-item__text">{condition}</span>
                                        </div>
                                        <div className="condition-item__actions">
                                            <button
                                                className="condition-item__btn condition-item__btn--edit"
                                                onClick={() => openConditionModal('edit', index, condition)}
                                            >
                                                <Edit3 size={14} />
                                                Modifier
                                            </button>
                                            <button
                                                className="condition-item__btn condition-item__btn--delete"
                                                onClick={() => deleteCondition(index)}
                                            >
                                                <Trash2 size={14} />
                                                Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === 'cours' && (
                        <div className="details-section">
                            <h3 className="details-section__title">Cours disponibles</h3>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', textAlign: 'center', padding: '3rem' }}>
                                Cette section sera bientôt disponible avec la liste complète des cours du programme.
                            </p>
                        </div>
                    )}
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal__header">
                                <h2 className="modal__title">Modifier {getFieldLabel(editField)}</h2>
                                <button
                                    className="modal__close"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal__body">
                                <div className="modal__field">
                                    <label className="modal__label">
                                        {getFieldLabel(editField)}
                                    </label>
                                    {editField === 'description' || editField === 'opportunities' ? (
                                        <textarea
                                            className="modal__textarea"
                                            value={modalValue}
                                            onChange={(e) => setModalValue(e.target.value)}
                                            placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                        />
                                    ) : (
                                        <input
                                            type={editField === 'certificate' ? 'text' : editField.includes('count') || editField === 'credits' || editField === 'hours' ? 'number' : 'text'}
                                            className="modal__input"
                                            value={modalValue}
                                            onChange={(e) => setModalValue(e.target.value)}
                                            placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                        />
                                    )}
                                    {editField === 'certificate' && (
                                        <div className="modal__hint">
                                            💡 Entrez "true", "oui" ou "1" pour Oui, ou "false", "non" ou "0" pour Non
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal__actions">
                                <button
                                    className="modal__btn modal__btn--secondary"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className="modal__btn modal__btn--primary"
                                    onClick={saveEdit}
                                >
                                    <Save size={16} />
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Condition Modal */}
                {isConditionModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsConditionModalOpen(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal__header">
                                <h2 className="modal__title">
                                    {conditionMode === 'add' ? 'Ajouter' : 'Modifier'} une condition
                                </h2>
                                <button
                                    className="modal__close"
                                    onClick={() => setIsConditionModalOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal__body">
                                <div className="modal__field">
                                    <label className="modal__label">
                                        Condition d'admission
                                    </label>
                                    <textarea
                                        className="modal__textarea"
                                        value={conditionValue}
                                        onChange={(e) => setConditionValue(e.target.value)}
                                        placeholder="Exemple : Avoir un diplôme d'État avec mention"
                                    />
                                    <div className="modal__hint">
                                        💡 Décrivez clairement la condition requise pour l'admission au programme
                                    </div>
                                </div>
                            </div>
                            <div className="modal__actions">
                                <button
                                    className="modal__btn modal__btn--secondary"
                                    onClick={() => setIsConditionModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className="modal__btn modal__btn--primary"
                                    onClick={saveCondition}
                                    disabled={!conditionValue.trim()}
                                >
                                    <Save size={16} />
                                    {conditionMode === 'add' ? 'Ajouter' : 'Modifier'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
