import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Building,
    CheckCircle,
    Clock,
    DollarSign,
    Edit3,
    Eye,
    GraduationCap,
    Image as ImageIcon,
    Mail,
    MapPin,
    Plus,
    Save,
    Target,
    Trash2,
    Upload,
    User,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import './test.css';

export default function LevelShow() {
    const [activeTab, setActiveTab] = useState('infos');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editField, setEditField] = useState('');
    const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
    const [conditionMode, setConditionMode] = useState('add');
    const [editIndex, setEditIndex] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const { level } = usePage().props;

    console.log(level)

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

    // ✅ Utilisation de useForm pour la gestion des données du niveau
    const {
        data: levelData,
        setData: setLevelData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
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
            student_number: level?.details?.student_number || 0,
            has_certificate: level?.details?.has_certificate || false,
            illustration_image: level?.details?.illustration_image || '',
            course_objective: level?.details?.course_objective || '',
            options: safeJsonParse(level?.details?.options, []),
            fees: level?.details?.fees || 0,
        },
    });

    // Formulaire séparé pour les conditions
    const {
        data: conditionData,
        setData: setConditionData,
        post: postCondition,
        put: putCondition,
        processing: conditionProcessing,
        reset: resetCondition,
    } = useForm({
        faculty_id: level?.faculty?.id || '',
        level_id: level?.id || '',
        title: '',
        description: '',
        section: '',
        id: null,
    });

    // Données statiques pour les professeurs
    const faculty = {
        name: 'Faculté des Sciences Informatiques',
        professors: [
            {
                id: 1,
                name: 'Dr. Jean Mbala',
                role: 'Professeur principal',
                contact: 'jean.mbala@univ.cd',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                specialty: 'Intelligence Artificielle',
            },
            {
                id: 2,
                name: 'Mme. Alice Kanza',
                role: 'Enseignante',
                contact: 'alice.kanza@univ.cd',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                specialty: 'Développement Web',
            },
            {
                id: 3,
                name: 'Pr. Michel Ngoyi',
                role: 'Coordonnateur académique',
                contact: 'michel.ngoyi@univ.cd',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                specialty: 'Bases de Données',
            },
        ],
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

    // ✅ Fonction pour sauvegarder les modifications 
    const saveEdit = (e) => {
        e.preventDefault();
    
        const isImageField = editField === 'details.illustration_image' || editField === 'image';
        const isFileUpload = isImageField && levelData.details.illustration_image instanceof File;
    
        console.log(isImageField);
    
        setIsEditModalOpen(false);
    
        // ✅ Traiter les options seulement au moment de l'envoi
        const processedOptions =
            editField === 'details.options' ? processOptionsValue(levelData.details.options) : safeJsonParse(levelData.details.options, []);
    
        const formData = new FormData();
        formData.append('_method', 'PUT');
    
        // ✅ TOUJOURS envoyer tous les champs requis, même pour l'upload d'image
        formData.append('level_name', levelData.level_name || '');
        formData.append('level_code', levelData.level_code || '');
        formData.append('description', levelData.description || '');
    
        // ✅ Champs details obligatoires
        formData.append('details[credit_required]', levelData.details.credit_required || 0);
        formData.append('details[duration_years]', levelData.details.duration_years || 0);
        formData.append('details[courses_number]', levelData.details.courses_number || 0);
        formData.append('details[price]', levelData.details.price || 0);
        formData.append('details[language]', levelData.details.language || '');
        formData.append('details[has_certificate]', levelData.details.has_certificate ? '1' : '0');
        formData.append('details[student_number]', levelData.details.student_number || 0);
        formData.append('details[course_objective]', levelData.details.course_objective || '');
        formData.append('details[fees]', levelData.details.fees || 0);
    
        // ✅ Traiter les options correctement
        processedOptions.forEach((option, index) => {
            formData.append(`details[options][${index}]`, option);
        });
    
        // ✅ Si c'est un upload d'image, ajouter le fichier
        if (isFileUpload) {
            formData.append('details[illustration_image]', levelData.details.illustration_image);
        }
    
        // ✅ Une seule requête pour tous les cas
        router.post(route('dashboard.levels.update.details', level.id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onSuccess: () => {
                Alert.success(isFileUpload ? 'Image mise à jour avec succès' : 'Niveau mis à jour avec succès');
                
                // ✅ SOLUTION SIMPLE ET EFFICACE : Juste recharger les données
                // Cela va automatiquement mettre à jour les props et re-initialiser le useForm
                router.reload({ only: ['level'] });
            },
            onError: (errors) => {
                Alert.error(isFileUpload ? "Erreur lors de la mise à jour de l'image" : 'Erreur lors de la mise à jour');
                console.error('Erreur:', errors);
                setIsEditModalOpen(true);
            },
        });
    };

    // Gestion des conditions
    const openConditionModal = (mode, conditionId = null, condition = null) => {
        setConditionMode(mode);
        setEditIndex(conditionId);

        if (mode === 'edit' && condition) {
            setConditionData({
                faculty_id: level?.faculty?.id || '',
                level_id: level?.id || '',
                title: condition.title || '',
                description: condition.description || '',
                section: condition.section || '',
                id: condition.id,
            });
        } else {
            resetCondition();
            setConditionData({
                faculty_id: level?.faculty?.id || '',
                level_id: level?.id || '',
                title: '',
                description: '',
                section: '',
                id: null,
            });
        }

        setIsConditionModalOpen(true);
    };

    const saveCondition = (e) => {
        e.preventDefault();

        if (conditionMode === 'add') {
            postCondition(route('dashboard.admission.store'), {
                onSuccess: () => {
                    Alert.success("Condition d'admission ajoutée avec succès");
                    setIsConditionModalOpen(false);
                    resetCondition();
                },
                onError: (errors) => {
                    Alert.error("Erreur lors de l'ajout de la condition d'admission");
                    console.error("Erreur lors de l'ajout de la condition d'admission:", errors);
                },
            });
        } else if (conditionMode === 'edit' && conditionData.id) {
            putCondition(route('dashboard.admission.update', conditionData.id), {
                onSuccess: () => {
                    Alert.success("Condition d'admission mise à jour avec succès");
                    setIsConditionModalOpen(false);
                    resetCondition();
                },
                onError: (errors) => {
                    Alert.error("Erreur lors de la mise à jour de la condition d'admission");
                    console.error("Erreur lors de la mise à jour de la condition d'admission:", errors);
                },
            });
        }
    };

    const deleteCondition = async (conditionId) => {
        const confirmed = await Alert.deleteConfirm('cette condition');
        if (!confirmed) return;

        Alert.loading('Suppression en cours...');
        router.delete(route('dashboard.admission.destroy', conditionId), {
            onSuccess: () => {
                Alert.success("Condition d'admission supprimée avec succès");
            },
            onError: (errors) => {
                Alert.error("Erreur lors de la suppression de la condition d'admission");
                console.error("Erreur lors de la suppression de la condition d'admission:", errors);
            },
        });
    };

    // Fonctions utilitaires
    const getFieldLabel = (field) => {
        const labels = {
            level_code: 'Code du niveau',
            level_name: 'Nom du niveau',
            description: 'Description',
            'details.illustration_image': "Image d'illustration",
            'details.credit_required': 'Crédits requis',
            'details.duration_years': 'Durée (années)',
            'details.courses_number': 'Nombre de cours',
            'details.student_number': "Nombre d'etudiants",
            'details.price': 'Prix',
            'details.language': 'Langue',
            'details.has_certificate': 'Certificat',
            'details.options': 'Options/Opportunités',
            'details.course_objective': 'Objectifs du cours',
            'details.fees': 'Frais',
        };
        return labels[field] || field;
    };

    // ✅ Fonction pour mettre à jour les champs imbriqués (CORRIGÉE)
    const updateNestedField = (field, value) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');

            // ✅ Pour les options, ne pas traiter immédiatement - garder la valeur brute
            if (detailField === 'options') {
                setLevelData('details', {
                    ...levelData.details,
                    [detailField]: value, // Garder la valeur telle quelle dans le state
                });
            } else {
                setLevelData('details', {
                    ...levelData.details,
                    [detailField]: value,
                });
            }
        } else {
            setLevelData(field, value);
        }
    };

    // Fonction utilitaire pour traiter les options
    const processOptionsValue = (value) => {
        if (!value) return [];

        if (Array.isArray(value)) {
            return value.map((item) => item.toString().trim()).filter((item) => item !== '');
        }

        if (typeof value === 'string') {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item !== '');
        }

        return [];
    };

    // Fonction utilitaire pour convertir tableau en chaîne pour l'affichage
    const formatOptionsForDisplay = (options) => {
        if (!options) return '';

        // Si c'est déjà une chaîne, la retourner directement
        if (typeof options === 'string') {
            return options;
        }

        // Si c'est un tableau, le joindre avec des virgules
        if (Array.isArray(options)) {
            return options.join(', ');
        }

        return '';
    };

    // Configuration des statistiques
    const stats = [
        {
            field: 'level_code',
            value: formatValue(levelData.level_code.code),
            icon: <Award size={24} />,
            color: 'purple',
        },
        {
            field: 'details.credit_required',
            value: formatValue(levelData.details.credit_required),
            icon: <BookOpen size={24} />,
            color: 'blue',
        },
        {
            field: 'semestres',
            value: levelData.details.duration_years && levelData.details.duration_years > 0 ? levelData.details.duration_years * 2 : 'Non défini',
            icon: <Clock size={24} />,
            color: 'green',
        },
        {
            field: 'details.duration_years',
            value: formatValue(levelData.details.duration_years),
            icon: <Clock size={24} />,
            color: 'orange',
        },
        {
            field: 'details.courses_number',
            value: formatValue(levelData.details.courses_number),
            icon: <GraduationCap size={24} />,
            color: 'red',
        },
        {
            field: 'details.price',
            value: levelData.details.price && levelData.details.price > 0 ? `${levelData.details.price} $` : 'Prix non fixé',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
        {
            field: 'details.student_number',
            value: formatValue(levelData.details.student_number),
            icon: <MapPin size={24} />,
            color: 'blue',
        },
        {
            field: 'details.fees',
            value: levelData.details.fees && levelData.details.fees > 0 ? `${levelData.details.fees} $` : 'Frais non fixé',
            icon: <DollarSign size={24} />,
            color: 'green',
        },
    ];

    // Fonction pour obtenir la valeur d'un champ
    const getFieldValue = (field) => {
        if (field.startsWith('details.')) {
            const detailField = field.replace('details.', '');
            const value = levelData.details[detailField];

            if (detailField === 'options') {
                return formatOptionsForDisplay(value);
            }

            return value;
        }
        return levelData[field];
    };

    // Fonction pour formater les options/opportunités
    const formatOptions = () => {
        try {
            const options = levelData.details.options;

            if (!options) {
                return 'Aucune opportunité définie';
            }

            // Si c'est une chaîne, vérifier si elle contient des données
            if (typeof options === 'string') {
                if (!options.trim()) {
                    return 'Aucune opportunité définie';
                }

                // Si c'est du JSON, essayer de le parser
                if (options.startsWith('[') || options.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(options);
                        if (Array.isArray(parsed)) {
                            return parsed.length > 0 ? parsed.join(', ') : 'Aucune opportunité définie';
                        }
                        return parsed.toString() || 'Aucune opportunité définie';
                    } catch (error) {
                        // Si le parsing échoue, traiter comme une chaîne normale
                        return options;
                    }
                }

                // Retourner la chaîne telle quelle (peut contenir des virgules)
                return options;
            }

            // Si c'est un tableau
            if (Array.isArray(options)) {
                return options.length > 0 ? options.join(', ') : 'Aucune opportunité définie';
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
                                { id: 'cours', label: 'Cours', icon: <GraduationCap size={20} /> },
                            ].map((tab) => (
                                <li key={tab.id} className="level-nav__item">
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`level-nav__btn ${activeTab === tab.id ? 'level-nav__btn--active' : 'level-nav__btn--inactive'}`}
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
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className={`stat-card__icon stat-card__icon--${stat.color}`}>{stat.icon}</div>
                                            <div className="stat-card__label">{getFieldLabel(stat.field)}</div>
                                            <div className="stat-card__value">{stat.value}</div>
                                            <button className="detail-item__edit" onClick={() => openEditModal(stat.field, stat.value)}>
                                                <Edit3 size={16} />
                                                Modifier
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Illustration Image Section */}
                                {levelData.details.illustration_image && (
                                    <div className="illustration-section">
                                        <div className="illustration-section__header">
                                            <h3 className="illustration-section__title">
                                                <ImageIcon size={24} />
                                                Illustration du programme
                                            </h3>
                                            <div className="illustration-section__actions">
                                                <button
                                                    onClick={() => setIsImagePreviewOpen(true)}
                                                    className="illustration-section__btn illustration-section__btn--view"
                                                >
                                                    <Eye size={16} />
                                                    Aperçu complet
                                                </button>
                                                <button
                                                    onClick={() => openEditModal('details.illustration_image', levelData.details.illustration_image)}
                                                    className="illustration-section__btn illustration-section__btn--edit"
                                                >
                                                    <Edit3 size={16} />
                                                    Modifier
                                                </button>
                                            </div>
                                        </div>
                                        <div className="illustration-container">
                                            <div className="illustration-wrapper">
                                                <img
                                                    src={`/storage/${levelData.details.illustration_image}`}
                                                    alt="Illustration du programme"
                                                    className="illustration-image"
                                                />
                                                <div className="illustration-overlay">
                                                    <div className="illustration-overlay__content">
                                                        <ImageIcon size={32} />
                                                        <span>Cliquez pour voir en grand</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* No Illustration Placeholder */}
                                {!levelData.details.illustration_image && (
                                    <div className="illustration-placeholder">
                                        <div className="illustration-placeholder__content">
                                            <div className="illustration-placeholder__icon">
                                                <ImageIcon size={48} />
                                            </div>
                                            <h3 className="illustration-placeholder__title">Aucune illustration</h3>
                                            <p className="illustration-placeholder__description">
                                                Ajoutez une image d'illustration pour enrichir la présentation de votre programme
                                            </p>
                                            <button
                                                onClick={() => openEditModal('details.illustration_image', '')}
                                                className="illustration-placeholder__btn"
                                            >
                                                <Upload size={18} />
                                                Ajouter une illustration
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Details Section */}
                                <div className="details-section">
                                    <h3 className="details-section__title">Détails du programme</h3>
                                    <div className="details-list">
                                        {[
                                            {
                                                field: 'details.language',
                                                label: "Langue d'enseignement",
                                                value: levelData.details.language || 'Non spécifiée',
                                                icon: <Building size={20} />,
                                            },
                                            {
                                                field: 'details.has_certificate',
                                                label: 'Délivrance de certificat',
                                                value: levelData.details.has_certificate ? 'Oui' : 'Non',
                                                icon: <Award size={20} />,
                                            },
                                            {
                                                field: 'details.options',
                                                label: 'Opportunités professionnelles',
                                                value: formatOptions(),
                                                icon: <User size={20} />,
                                            },
                                            {
                                                field: 'details.course_objective',
                                                label: 'Objectifs du cours',
                                                value: levelData.details.course_objective || 'Aucun objectif défini',
                                                icon: <Target size={20} />,
                                            },
                                        ].map((item) => (
                                            <div key={item.field} className="detail-item">
                                                <div className="detail-item__content">
                                                    <div className="detail-item__icon">{item.icon}</div>
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
                                            <img src={prof.avatar} alt={prof.name} className="professor-card__avatar" />
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
                                    <button className="conditions-section__add-btn" onClick={() => openConditionModal('add')}>
                                        <Plus size={20} />
                                        Ajouter une condition
                                    </button>
                                </div>
                                <ul className="conditions-list">
                                    {level.admission_conditions && level.admission_conditions.length > 0 ? (
                                        level.admission_conditions.map((condition) => (
                                            <li key={condition.id} className="condition-item">
                                                <div className="condition-item__content">
                                                    <div className="condition-item__icon"></div>
                                                    <div className="condition-item__details">
                                                        <span className="condition-item__title" style={{ fontWeight: 'bold' }}>
                                                            {condition.title}
                                                        </span>
                                                        <p className="condition-item__description">{condition.description}</p>
                                                    </div>
                                                </div>
                                                <div className="condition-item__actions">
                                                    <button
                                                        className="condition-item__btn condition-item__btn--edit"
                                                        onClick={() => openConditionModal('edit', condition.id, condition)}
                                                    >
                                                        <Edit3 size={14} />
                                                        Modifier
                                                    </button>
                                                    <button
                                                        className="condition-item__btn condition-item__btn--delete"
                                                        onClick={() => deleteCondition(condition.id)}
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

                    {/* Image Preview Modal */}
                    {isImagePreviewOpen && levelData.details.illustration_image && (
                        <div className="image-preview-overlay" onClick={() => setIsImagePreviewOpen(false)}>
                            <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="image-preview-header">
                                    <h3 className="image-preview-title">Illustration du programme</h3>
                                    <button className="image-preview-close" onClick={() => setIsImagePreviewOpen(false)}>
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="image-preview-content">
                                    <img
                                        src={`/storage/${levelData.details.illustration_image}`}
                                        alt="Illustration du programme"
                                        className="image-preview-img"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {isEditModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <form onSubmit={saveEdit}>
                                    <div className="modal__header">
                                        <h2 className="modal__title">Modifier {getFieldLabel(editField)}</h2>
                                        <button type="button" className="modal__close" onClick={() => setIsEditModalOpen(false)}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="modal__body">
                                        <div className="modal__field">
                                            <label className="modal__label">{getFieldLabel(editField)}</label>
                                            {editField === 'description' ||
                                            editField === 'details.options' ||
                                            editField === 'details.course_objective' ? (
                                                <>
                                                    {editField === 'details.options' && (
                                                        <div className="modal__hint">
                                                            💡 <strong>Exemples d'opportunités :</strong>
                                                            <br />
                                                            • Ingénieur logiciel, DevOps, Consultant IT
                                                            <br />
                                                            • Développeur web, Architecte système, Chef de projet
                                                            <br />
                                                            • Data Scientist, Cybersécurité, IA/Machine Learning
                                                            <br />
                                                            <em>Séparez chaque opportunité par une virgule</em>
                                                        </div>
                                                    )}

                                                    <textarea
                                                        className="modal__textarea"
                                                        value={getFieldValue(editField) || ''}
                                                        onChange={(e) => updateNestedField(editField, e.target.value)}
                                                        placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                                        rows={editField === 'details.course_objective' ? 6 : 4}
                                                    />
                                                </>
                                            ) : editField === 'details.illustration_image' ? (
                                                <div className="modal__file-field">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="modal__file-input"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                updateNestedField(editField, file);
                                                            }
                                                        }}
                                                    />
                                                    <div className="modal__file-info">
                                                        <ImageIcon size={20} />
                                                        <span>Sélectionnez une nouvelle image d'illustration</span>
                                                    </div>
                                                    {levelData.details.illustration_image &&
                                                        typeof levelData.details.illustration_image === 'string' && (
                                                            <div className="modal__current-image">
                                                                <img
                                                                    src={`/storage/${levelData.details.illustration_image}`}
                                                                    alt="Image actuelle"
                                                                    className="modal__preview-img"
                                                                />
                                                            </div>
                                                        )}
                                                </div>
                                            ) : (
                                                <input
                                                    type={
                                                        editField === 'details.has_certificate'
                                                            ? 'checkbox'
                                                            : [
                                                                    'details.credit_required',
                                                                    'details.duration_years',
                                                                    'details.courses_number',
                                                                    'details.price',
                                                                    'details.fees',
                                                                    'details.student_number',
                                                                ].includes(editField)
                                                              ? 'number'
                                                              : 'text'
                                                    }
                                                    className="modal__input"
                                                    value={editField === 'details.has_certificate' ? undefined : getFieldValue(editField) || ''}
                                                    checked={editField === 'details.has_certificate' ? getFieldValue(editField) : undefined}
                                                    onChange={(e) => {
                                                        const value =
                                                            editField === 'details.has_certificate'
                                                                ? e.target.checked
                                                                : [
                                                                        'details.credit_required',
                                                                        'details.duration_years',
                                                                        'details.courses_number',
                                                                        'details.price',
                                                                        'details.fees',
                                                                        'details.student_number',
                                                                    ].includes(editField)
                                                                  ? parseInt(e.target.value) || 0
                                                                  : e.target.value;
                                                        updateNestedField(editField, value);
                                                    }}
                                                    placeholder={`Entrez la nouvelle valeur pour ${getFieldLabel(editField)}`}
                                                    min={
                                                        [
                                                            'details.credit_required',
                                                            'details.duration_years',
                                                            'details.courses_number',
                                                            'details.price',
                                                            'details.fees',
                                                            'details.student_number',
                                                        ].includes(editField)
                                                            ? '0'
                                                            : undefined
                                                    }
                                                />
                                            )}
                                            {errors[editField] && <div className="modal__error">{errors[editField]}</div>}
                                        </div>
                                    </div>
                                    <div className="modal__actions">
                                        <button type="button" className="modal__btn modal__btn--secondary" onClick={() => setIsEditModalOpen(false)}>
                                            Annuler
                                        </button>
                                        <button type="submit" className="modal__btn modal__btn--primary" disabled={processing}>
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
                                        <h2 className="modal__title">{conditionMode === 'add' ? 'Ajouter' : 'Modifier'} une condition</h2>
                                        <button type="button" className="modal__close" onClick={() => setIsConditionModalOpen(false)}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="modal__body">
                                        {/* Titre */}
                                        <div className="modal__field">
                                            <label className="modal__label">Titre</label>
                                            <input
                                                type="text"
                                                className="modal__input"
                                                value={conditionData.title || ''}
                                                onChange={(e) => setConditionData('title', e.target.value)}
                                                placeholder="Exemple : Diplôme requis"
                                                required
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="modal__field">
                                            <label className="modal__label">Description</label>
                                            <textarea
                                                className="modal__textarea"
                                                value={conditionData.description || ''}
                                                onChange={(e) => setConditionData('description', e.target.value)}
                                                placeholder="Exemple : Avoir un diplôme d'État avec mention"
                                                required
                                            />
                                            <div className="modal__hint">
                                                💡 Décrivez clairement la condition requise pour l'admission au programme
                                            </div>
                                        </div>
                                        <div className="modal__field">
                                            <label className="modal__label">Type</label>
                                            <select
                                                className="modal__select"
                                                value={conditionData.section || ''}
                                                onChange={(e) => setConditionData('section', e.target.value)}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '8px',
                                                    fontSize: '1rem',
                                                    color: '#333',
                                                    backgroundColor: '#fff',
                                                    appearance: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <option value="">Sélectionnez un type</option>
                                                <option value="personal_info">Informations personnelles</option>
                                                <option value="academic_info">Informations académiques</option>
                                                <option value="other">Autre</option>
                                            </select>
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
                                            disabled={!conditionData.title?.trim() || !conditionData.description?.trim() || conditionProcessing}
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
