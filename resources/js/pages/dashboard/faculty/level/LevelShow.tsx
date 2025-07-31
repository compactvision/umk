import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import './test.css';
import { useState, useEffect } from 'react';
import {
    Edit3,
    Plus,
    Trash2,
    Users,
    BookOpen,
    Award,
    Clock,
    MapPin,
    Mail,
    CheckCircle,
    X,
    Save,
    User,
    GraduationCap,
    Building,
    DollarSign
} from 'lucide-react';
import { usePage, useForm } from '@inertiajs/react';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editField, setEditField] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [conditionMode, setConditionMode] = useState('add');
    const [editIndex, setEditIndex] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const { level } = usePage().props;

    // Fonction utilitaire pour parser les données JSON de manière sécurisée
    const safeJsonParse = (data, fallback = []) => {
        if (!data) return fallback;

        if (Array.isArray(data)) return data;

        if (typeof data === 'string') {
            if (!data.trim()) return fallback;

            try {
                if (data.startsWith('[') || data.startsWith('{')) {
                    return JSON.parse(data);
                }
                return data;
            } catch (error) {
                console.warn('Erreur JSON parse:', error);
                return data;
            }
        }

        return data || fallback;
    };

    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return 'N/A';
        if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
        if (typeof val === 'number') return val.toString();
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Aucun élément';
        return val.toString();
    };

    // Utilisation de useForm pour la gestion des données du niveau
    const { data: levelData, setData: setLevelData, put, processing, errors, reset } = useForm({
        level_name: level?.level_name || '',
        level_code: level?.level_code || '',
        description: level?.description || '',
        image: level?.image || '',
        details: {
            credit_required: level?.details?.credit_required || 0,
            duration_years: level?.details?.duration_years || 0,
            courses_number: level?.details?.courses_number || 0,
            price: level?.details?.price || 0,
            language: level?.details?.language || 'Non spécifiée',
            certificate: level?.details?.certificate || false,
            options: safeJsonParse(level?.details?.options, [])
        }
    });

    // Formulaire séparé pour les conditions
    const {
        data: conditionData,
        setData: setConditionData,
        post: postCondition,
        processing: conditionProcessing,
        reset: resetCondition
    } = useForm({
        condition: '',
        conditions: (level?.conditions && Array.isArray(level.conditions) && level.conditions.length > 0)
            ? level.conditions
            : [
                "Avoir un diplôme d'État",
                "Avoir au moins 12/20 en mathématiques",
                "Passer un test d'entrée"
            ]
    });

    // Données statiques pour les professeurs
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

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // Fonction pour ouvrir le modal d'édition
    const openEditModal = (field, value) => {
        setEditField(field);
        setIsEditModalOpen(true);
    };

    // Fonction pour sauvegarder les modifications
    const saveEdit = (e) => {
        e.preventDefault();

        // Préparer les données selon la structure attendue par le serveur
        const dataToSend = {
            image: levelData.image,
            // Aplatir la structure details
            credit_required: levelData.details.credit_required,
            duration_years: levelData.details.duration_years,
            courses_number: levelData.details.courses_number,
            price: levelData.details.price,
            language: levelData.details.language,
            certificate: levelData.details.certificate,
            options: Array.isArray(levelData.details.options)
                ? JSON.stringify(levelData.details.options)
                : levelData.details.options
        };

        console.log('Données envoyées:', dataToSend);

        put(route('dashboard.levels.update.details', level.id), dataToSend, {
            onSuccess: (response) => {
                setIsEditModalOpen(false);
                console.log('Niveau mis à jour avec succès', response);
            },
            onError: (errors) => {
                console.error('Erreur lors de la mise à jour:', errors);
            }
        });
    };

    // Gestion des conditions
    const openConditionModal = (mode, index = null, value = '') => {
        setConditionMode(mode);
        setEditIndex(index);
        setConditionData('condition', value);
        setIsConditionModalOpen(true);
    };

    const saveCondition = (e) => {
        e.preventDefault();

        let updatedConditions = [...conditionData.conditions];

        if (conditionMode === 'add') {
            updatedConditions.push(conditionData.condition);
        } else if (conditionMode === 'edit' && editIndex !== null) {
            updatedConditions[editIndex] = conditionData.condition;
        }

        setConditionData('conditions', updatedConditions);
        setIsConditionModalOpen(false);
        resetCondition('condition');
    };

    const deleteCondition = (index) => {
        const updatedConditions = conditionData.conditions.filter((_, i) => i !== index);
        setConditionData('conditions', updatedConditions);
    };

    // Fonctions utilitaires
    const getFieldLabel = (field) => {
        const labels = {
            level_code: "Code du niveau",
            level_name: "Nom du niveau",
            description: "Description",
            'details.credit_required': "Crédits requis",
            'details.duration_years': "Durée (années)",
            'details.courses_number': "Nombre de cours",
            'details.price': "Prix",
            'details.language': "Langue",
            'details.certificate': "Certificat",
            'details.options': "Options/Opportunités"
        };
        return labels[field] || field;
    };

    // Fonction pour mettre à jour les champs imbriqués
    const updateNestedField = (field, value) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');
            setLevelData('details', {
                ...levelData.details,
                [detailField]: value
            });
        } else {
            setLevelData(field, value);
        }
    };

    // Configuration des statistiques
    const stats = [
        {
            field: 'level_code',
            value: formatValue(levelData.level_code),
            icon: <Award size={24} />,
            color: 'purple'
        },
        {
            field: 'details.credit_required',
            value: formatValue(levelData.details.credit_required),
            icon: <BookOpen size={24} />,
            color: 'blue'
        },
        {
            field: 'semestres',
            value: (levelData.details.duration_years && levelData.details.duration_years > 0)
                ? levelData.details.duration_years * 2
                : 'Non défini',
            icon: <Clock size={24} />,
            color: 'green'
        },
        {
            field: 'details.duration_years',
            value: formatValue(levelData.details.duration_years),
            icon: <Clock size={24} />,
            color: 'orange'
        },
        {
            field: 'details.courses_number',
            value: formatValue(levelData.details.courses_number),
            icon: <GraduationCap size={24} />,
            color: 'red'
        },
        {
            field: 'details.price',
            value: (levelData.details.price && levelData.details.price > 0)
                ? `${levelData.details.price} $`
                : 'Prix non fixé',
            icon: <DollarSign size={24} />,
            color: 'green'
        }
    ];

    // Fonction pour obtenir la valeur d'un champ
    const getFieldValue = (field) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');
            return levelData.details[detailField];
        }
        return levelData[field];
    };

    // Fonction pour formater les options/opportunités
    const formatOptions = () => {
        try {
            const options = levelData.details.options;

            if (Array.isArray(options)) {
                return options.length > 0 ? options.join(', ') : 'Aucune opportunité définie';
            }

            if (typeof options === 'string') {
                if (!options.trim()) {
                    return 'Aucune opportunité définie';
                }

                if (options.startsWith('[') || options.startsWith('{')) {
                    const parsed = JSON.parse(options);
                    if (Array.isArray(parsed)) {
                        return parsed.length > 0 ? parsed.join(', ') : 'Aucune opportunité définie';
                    }
                    return parsed.toString() || 'Aucune opportunité définie';
                }

                return options;
            }

            return 'Aucune opportunité définie';
        } catch (error) {
            console.warn('Erreur lors du parsing des options:', error);
            return levelData.details.options?.toString() || 'Aucune opportunité définie';
        }
    };

    return (
        <Dashboard>
            <div className="level-page">
                {/* Hero Section */}
                <div className="level-hero">
                    <div className="level-hero__overlay"></div>
                    <img
                        src={levelData.image ? `/storage/${levelData.image}` : '/default-hero.jpg'}
                        alt={levelData.level_name || 'Niveau'}
                        className="level-hero__banner"
                    />
                    <div className="level-hero__content">
                        <div className="level-hero__info">
                            <div className="level-hero__faculty">
                                <Building size={20} />
                                <span>{level?.faculty?.name || faculty.name}</span>
                            </div>
                            <h1 className="level-hero__title">{levelData.level_name || 'Nom du niveau non défini'}</h1>
                            <p className="level-hero__description">{levelData.description || 'Description non disponible'}</p>
                            <button
                                onClick={() => openEditModal('description', levelData.description)}
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
                                            {
                                                field: 'details.language',
                                                label: 'Langue d\'enseignement',
                                                value: levelData.details.language || 'Non spécifiée',
                                                icon: <Building size={20} />
                                            },
                                            {
                                                field: 'details.certificate',
                                                label: 'Délivrance de certificat',
                                                value: levelData.details.certificate ? 'Oui' : 'Non',
                                                icon: <Award size={20} />
                                            },
                                            {
                                                field: 'details.options',
                                                label: 'Opportunités professionnelles',
                                                value: formatOptions(),
                                                icon: <User size={20} />
                                            }
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
                                                    onClick={() => openEditModal(item.field, getFieldValue(item.field))}
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
                                    {conditionData.conditions && conditionData.conditions.length > 0 ? (
                                        conditionData.conditions.map((condition, index) => (
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
                                        ))
                                    ) : (
                                        <li className="condition-item condition-item--empty">
                                            <div className="condition-item__content">
                                                <span className="condition-item__text" style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                    Aucune condition d'admission définie pour le moment.
                                                </span>
                                            </div>
                                        </li>
                                    )}
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
                                <form onSubmit={saveEdit}>
                                    <div className="modal__header">
                                        <h2 className="modal__title">Modifier {getFieldLabel(editField)}</h2>
                                        <button
                                            type="button"
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
                                            {editField === 'description' || editField === 'details.options' ? (
                                                <textarea
                                                    className="modal__textarea"
                                                    value={getFieldValue(editField) || ''}
                                                    onChange={(e) => updateNestedField(editField, e.target.value)}
                                                    placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                                />
                                            ) : (
                                                <input
                                                    type={
                                                        editField === 'details.certificate' ? 'checkbox' :
                                                            ['details.credit_required', 'details.duration_years', 'details.courses_number', 'details.price'].includes(editField) ? 'number' :
                                                                'text'
                                                    }
                                                    className="modal__input"
                                                    value={getFieldValue(editField) || ''}
                                                    checked={editField === 'details.certificate' ? getFieldValue(editField) : undefined}
                                                    onChange={(e) => {
                                                        const value = editField === 'details.certificate'
                                                            ? e.target.checked
                                                            : ['details.credit_required', 'details.duration_years', 'details.courses_number', 'details.price'].includes(editField)
                                                                ? parseInt(e.target.value) || 0
                                                                : e.target.value;
                                                        updateNestedField(editField, value);
                                                    }}
                                                    placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                                />
                                            )}
                                            {errors[editField] && (
                                                <div className="modal__error">
                                                    {errors[editField]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal__actions">
                                        <button
                                            type="button"
                                            className="modal__btn modal__btn--secondary"
                                            onClick={() => setIsEditModalOpen(false)}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="modal__btn modal__btn--primary"
                                            disabled={processing}
                                        >
                                            <Save size={16} />
                                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Condition Modal */}
                    {isConditionModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsConditionModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <form onSubmit={saveCondition}>
                                    <div className="modal__header">
                                        <h2 className="modal__title">
                                            {conditionMode === 'add' ? 'Ajouter' : 'Modifier'} une condition
                                        </h2>
                                        <button
                                            type="button"
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
                                                value={conditionData.condition || ''}
                                                onChange={(e) => setConditionData('condition', e.target.value)}
                                                placeholder="Exemple : Avoir un diplôme d'État avec mention"
                                                required
                                            />
                                            <div className="modal__hint">
                                                💡 Décrivez clairement la condition requise pour l'admission au programme
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal__actions">
                                        <button
                                            type="button"
                                            className="modal__btn modal__btn--secondary"
                                            onClick={() => setIsConditionModalOpen(false)}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="modal__btn modal__btn--primary"
                                            disabled={!conditionData.condition?.trim() || conditionProcessing}
                                        >
                                            <Save size={16} />
                                            {conditionProcessing ? 'Traitement...' : conditionMode === 'add' ? 'Ajouter' : 'Modifier'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}
