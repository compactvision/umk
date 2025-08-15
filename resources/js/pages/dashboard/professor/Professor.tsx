import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import Alert from '@/utils/sweetAlert';
import { useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function Professor() {
    const { faculties, levels } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        birth_date: '',
        photo: null,
        hire_date: '',
        biography: '',
        is_active: true,
        faculty_level_courses: [], // Nouveau: tableau d'objets {faculty_id, level_id, course_ids}
    });

    const [dragActive, setDragActive] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Extraction des données paginées
    const facultiesData = faculties?.data || [];
    const levelsData = levels?.data || [];
    const defaultLevels = [
        { id: 'L1', level_name: 'Première Licence' },
        { id: 'L2', level_name: 'Deuxième Licence' },
        { id: 'L3', level_name: 'Troisième Licence' },
        { id: 'M1', level_name: 'Master 1' },
        { id: 'M2', level_name: 'Master 2' },
        { id: 'D1', level_name: 'Doctorat 1' },
        { id: 'D2', level_name: 'Doctorat 2' },
    ];

    const courses = [
        { value: '1', label: 'Mathématiques Appliquées' },
        { value: '2', label: 'Algorithmique Avancée' },
        { value: '3', label: 'Économie Générale' },
        { value: '4', label: 'Microéconomie' },
        { value: '5', label: 'Programmation Web' },
        { value: '6', label: 'Base de Données' },
        { value: '7', label: 'Intelligence Artificielle' },
        { value: '8', label: 'Statistiques' },
    ];

    // Ajouter une nouvelle affectation faculté-niveau-cours
    const addFacultyLevelCourse = () => {
        setData('faculty_level_courses', [
            ...data.faculty_level_courses,
            { faculty_id: '', level_id: '', course_ids: [] }
        ]);
    };

    // Supprimer une affectation
    const removeFacultyLevelCourse = (index) => {
        const updatedAssignments = data.faculty_level_courses.filter((_, i) => i !== index);
        setData('faculty_level_courses', updatedAssignments);
    };

    // Modifier une affectation
    const updateFacultyLevelCourse = (index, field, value) => {
        const updatedAssignments = [...data.faculty_level_courses];
        
        // Si on change la faculté ou le niveau, on réinitialise les courses
        if (field === 'faculty_id' || field === 'level_id') {
            updatedAssignments[index] = {
                ...updatedAssignments[index],
                [field]: value,
                course_ids: field === 'faculty_id' || field === 'level_id' ? [] : updatedAssignments[index].course_ids
            };
        } else {
            updatedAssignments[index] = {
                ...updatedAssignments[index],
                [field]: value
            };
        }
        
        setData('faculty_level_courses', updatedAssignments);
    };

    // Gérer la sélection des cours pour une affectation spécifique
    const handleCourseToggleForAssignment = (assignmentIndex, courseId) => {
        const updatedAssignments = [...data.faculty_level_courses];
        const currentCourses = updatedAssignments[assignmentIndex].course_ids;
        
        updatedAssignments[assignmentIndex].course_ids = currentCourses.includes(courseId)
            ? currentCourses.filter(id => id !== courseId)
            : [...currentCourses, courseId];

        setData('faculty_level_courses', updatedAssignments);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setData('photo', file);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setData('photo', null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Transformer les données pour correspondre à la structure de la base de données
        const transformedData = {
            // Données de base du professeur
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            birth_date: data.birth_date,
            photo: data.photo,
            hire_date: data.hire_date,
            biography: data.biography,
            is_active: data.is_active,
            
            // Relations transformées
            faculties: [...new Set(data.faculty_level_courses.map(assignment => assignment.faculty_id))],
            level_codes: [...new Set(data.faculty_level_courses.map(assignment => assignment.level_id))],
            courses: data.faculty_level_courses.flatMap(assignment => assignment.course_ids)
        };
    
        console.log('Données transformées:', transformedData);
    
        post(route('dashboard.professors.store'), {
            forceFormData: true,
            data: transformedData, // Utiliser les données transformées
            onSuccess: () => {
                Alert.success('Professeur créé avec succès!');
                reset();
                setPhotoPreview(null);
            },
            onError: (errors) => {
                console.log('Erreurs de validation:', errors);
                Alert.error("Une erreur s'est produite");
            },
        });
    };
    
    // Ajoutez également cette fonction pour la validation côté client
    const validateAssignments = () => {
        const errors = {};
        
        data.faculty_level_courses.forEach((assignment, index) => {
            if (!assignment.faculty_id) {
                errors[`faculty_level_courses.${index}.faculty_id`] = 'La faculté est requise';
            }
            if (!assignment.level_id) {
                errors[`faculty_level_courses.${index}.level_id`] = 'Le niveau est requis';
            }
            if (assignment.course_ids.length === 0) {
                errors[`faculty_level_courses.${index}.course_ids`] = 'Au moins un cours est requis';
            }
        });
        
        return errors;
    };
    const getSelectedCourseLabels = () => {
        return courses.filter((course) => data.courses.includes(course.value)).map((course) => course.label);
    };

    // Obtenir le nom de la faculté par son ID
    const getFacultyName = (facultyId) => {
        const faculty = facultiesData.find(f => f.id === facultyId);
        return faculty ? faculty.name : '';
    };

    // Obtenir le nom du niveau par son ID
    const getLevelName = (levelId) => {
        const level = defaultLevels.find(l => l.id === levelId);
        return level ? level.level_name : '';
    };

    // Obtenir les noms des cours sélectionnés pour une affectation
    const getSelectedCourseNamesForAssignment = (courseIds) => {
        return courses.filter(course => courseIds.includes(course.value)).map(course => course.label);
    };

    return (
        <Dashboard>
            <main className="professor-register">
                <div className="professor-register__container">
                    {/* Hero Section */}
                    <div className="professor-register__hero">
                        <div className="professor-register__hero-content">
                            <h1 className="professor-register__title">Inscription Professeur</h1>
                            <p className="professor-register__subtitle">Créez un profil complet pour votre nouveau professeur</p>
                        </div>
                        <div className="professor-register__hero-decoration">
                            <div className="professor-register__decoration-circle professor-register__decoration-circle--large"></div>
                            <div className="professor-register__decoration-circle professor-register__decoration-circle--medium"></div>
                            <div className="professor-register__decoration-circle professor-register__decoration-circle--small"></div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="professor-register__steps">
                        <div className="professor-register__step professor-register__step--completed">
                            <div className="professor-register__step-icon">
                                <svg className="professor-register__step-svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <span className="professor-register__step-text">Informations personnelles</span>
                        </div>
                        <div className="professor-register__step professor-register__step--active">
                            <div className="professor-register__step-icon">2</div>
                            <span className="professor-register__step-text">Détails du professeur</span>
                        </div>
                        <div className="professor-register__step">
                            <div className="professor-register__step-icon">3</div>
                            <span className="professor-register__step-text">Confirmation</span>
                        </div>
                    </div>

                    <div className="professor-register__content">
                        {/* Formulaire */}
                        <form className="professor-register__form" onSubmit={handleSubmit}>
                            <div className="professor-register__form-header">
                                <h2 className="professor-register__form-title">Informations du professeur</h2>
                                <p className="professor-register__form-description">Remplissez tous les champs requis pour créer le profil</p>
                            </div>

                            <div className="professor-register__form-grid">
                                {/* Prénom */}
                                <div className="professor-register__group">
                                    <label htmlFor="first_name" className="professor-register__label">
                                        <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        Prénom *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            className={`professor-register__input ${errors.first_name ? 'professor-register__input--error' : ''}`}
                                            placeholder="Ex: Jean"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                        />
                                        {errors.first_name && <span className="professor-register__error">{errors.first_name}</span>}
                                    </div>
                                </div>

                                {/* Nom */}
                                <div className="professor-register__group">
                                    <label htmlFor="last_name" className="professor-register__label">
                                        <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        Nom *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            className={`professor-register__input ${errors.last_name ? 'professor-register__input--error' : ''}`}
                                            placeholder="Ex: Mbemba"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                        />
                                        {errors.last_name && <span className="professor-register__error">{errors.last_name}</span>}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="professor-register__group">
                                    <label htmlFor="email" className="professor-register__label">
                                        <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Email *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className={`professor-register__input ${errors.email ? 'professor-register__input--error' : ''}`}
                                            placeholder="exemple@email.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        {errors.email && <span className="professor-register__error">{errors.email}</span>}
                                    </div>
                                </div>

                                {/* Téléphone */}
                                <div className="professor-register__group">
                                    <label htmlFor="phone" className="professor-register__label">
                                        <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Téléphone *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="text"
                                            id="phone"
                                            name="phone"
                                            className={`professor-register__input ${errors.phone ? 'professor-register__input--error' : ''}`}
                                            placeholder="+243 XXX XXX XXX"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        {errors.phone && <span className="professor-register__error">{errors.phone}</span>}
                                    </div>
                                </div>

                                <div className="professor-register__group">
                                    <label htmlFor="birth_date" className="professor-register__label">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 22">
                                            <g fill="none">
                                                <path
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeWidth="1.5"
                                                    d="M14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14v-2c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12v2c0 3.771 0 5.657-1.172 6.828c-.653.654-1.528.943-2.828 1.07M7 4V2.5M17 4V2.5M21.5 9H10.75M2 9h3.875"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M18 17a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0"
                                                />
                                            </g>
                                        </svg>
                                        Date de naissance *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="date"
                                            id="birth_date"
                                            name="birth_date"
                                            className={`professor-register__input ${errors.birth_date ? 'professor-register__input--error' : ''}`}
                                            value={data.birth_date}
                                            onChange={(e) => setData('birth_date', e.target.value)}
                                        />
                                        {errors.birth_date && <span className="professor-register__error">{errors.birth_date}</span>}
                                    </div>
                                </div>

                                <div className="professor-register__group">
                                    <label htmlFor="hire_date" className="professor-register__label">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 22 22">
                                            <g fill="none">
                                                <path
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeWidth="1.5"
                                                    d="M14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14v-2c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12v2c0 3.771 0 5.657-1.172 6.828c-.653.654-1.528.943-2.828 1.07M7 4V2.5M17 4V2.5M21.5 9H10.75M2 9h3.875"
                                                />
                                                <path
                                                    fill="currentColor"
                                                    d="M18 17a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-5 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0"
                                                />
                                            </g>
                                        </svg>
                                        Date d'embauche *
                                    </label>
                                    <div className="professor-register__input-wrapper">
                                        <input
                                            type="date"
                                            id="hire_date"
                                            name="hire_date"
                                            className={`professor-register__input ${errors.hire_date ? 'professor-register__input--error' : ''}`}
                                            value={data.hire_date}
                                            onChange={(e) => setData('hire_date', e.target.value)}
                                        />
                                        {errors.hire_date && <span className="professor-register__error">{errors.hire_date}</span>}
                                    </div>
                                </div>

                                <div className="professor-register__group professor-register__group--full">
                                    <label className="professor-register__label">
                                        <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                        </svg>
                                        Biographie *
                                    </label>
                                    <div className="professor-register__courses">
                                        <textarea
                                            id="biography"
                                            name="biography"
                                            className={`professor-register__input ${errors.biography ? 'professor-register__input--error' : ''}`}
                                            value={data.biography}
                                            onChange={(e) => setData('biography', e.target.value)}
                                            rows={8}
                                            placeholder="Entrez votre biographie"
                                            style={{ resize: 'none', width: '100%' }}
                                        />
                                        {errors.biography && <span className="professor-register__error">{errors.biography}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Section Affectations Faculté-Niveau-Cours */}
                            <div className="professor-register__group professor-register__group--full">
                                <div className="professor-register__faculty-assignments">
                                    <div className="professor-register__faculty-assignments-header">
                                        <label className="professor-register__label">
                                            <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z" />
                                            </svg>
                                            Affectations Faculté, Niveau & Cours *
                                        </label>
                                        <button
                                            type="button"
                                            className="professor-register__add-assignment-btn"
                                            onClick={addFacultyLevelCourse}
                                        >
                                            <svg className="professor-register__add-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Ajouter une affectation
                                        </button>
                                    </div>

                                    {data.faculty_level_courses.length === 0 && (
                                        <div className="professor-register__no-assignments">
                                            <svg className="professor-register__no-assignments-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                                            </svg>
                                            <p>Aucune affectation définie. Cliquez sur "Ajouter une affectation" pour commencer.</p>
                                        </div>
                                    )}

                                    {data.faculty_level_courses.map((assignment, index) => (
                                        <div key={index} className="professor-register__assignment-card">
                                            <div className="professor-register__assignment-header">
                                                <h4 className="professor-register__assignment-title">
                                                    Affectation {index + 1}
                                                </h4>
                                                {data.faculty_level_courses.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="professor-register__remove-assignment-btn"
                                                        onClick={() => removeFacultyLevelCourse(index)}
                                                    >
                                                        <svg viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="professor-register__assignment-content">
                                                {/* ÉTAPE 1: Sélection de la faculté */}
                                                <div className="professor-register__assignment-step">
                                                    <div className="professor-register__step-header">
                                                        <div className="professor-register__step-number">1</div>
                                                        <h5 className="professor-register__step-title">Choisir la faculté</h5>
                                                    </div>
                                                    <div className="professor-register__assignment-faculty">
                                                        <select
                                                            className={`professor-register__assignment-select ${errors[`faculty_level_courses.${index}.faculty_id`] ? 'professor-register__assignment-select--error' : ''}`}
                                                            value={assignment.faculty_id}
                                                            onChange={(e) => updateFacultyLevelCourse(index, 'faculty_id', e.target.value)}
                                                        >
                                                            <option value="">Sélectionner une faculté</option>
                                                            {facultiesData.map((faculty) => (
                                                                <option key={faculty.id} value={faculty.id}>
                                                                    {faculty.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors[`faculty_level_courses.${index}.faculty_id`] && (
                                                            <span className="professor-register__error">
                                                                {errors[`faculty_level_courses.${index}.faculty_id`]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ÉTAPE 2: Sélection du niveau (seulement si faculté sélectionnée) */}
                                                {assignment.faculty_id && (
                                                    <div className="professor-register__assignment-step">
                                                        <div className="professor-register__step-header">
                                                            <div className="professor-register__step-number">2</div>
                                                            <h5 className="professor-register__step-title">Choisir le niveau</h5>
                                                        </div>
                                                        <div className="professor-register__assignment-level">
                                                            <select
                                                                className={`professor-register__assignment-select ${errors[`faculty_level_courses.${index}.level_id`] ? 'professor-register__assignment-select--error' : ''}`}
                                                                value={assignment.level_id}
                                                                onChange={(e) => updateFacultyLevelCourse(index, 'level_id', e.target.value)}
                                                            >
                                                                <option value="">Sélectionner un niveau</option>
                                                                {defaultLevels.map((level) => (
                                                                    <option key={level.id} value={level.id}>
                                                                        {level.level_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {errors[`faculty_level_courses.${index}.level_id`] && (
                                                                <span className="professor-register__error">
                                                                    {errors[`faculty_level_courses.${index}.level_id`]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ÉTAPE 3: Sélection des cours (seulement si faculté et niveau sélectionnés) */}
                                                {assignment.faculty_id && assignment.level_id && (
                                                    <div className="professor-register__assignment-step">
                                                        <div className="professor-register__step-header">
                                                            <div className="professor-register__step-number">3</div>
                                                            <h5 className="professor-register__step-title">Choisir les cours</h5>
                                                        </div>
                                                        <div className="professor-register__assignment-courses">
                                                            <div className="professor-register__course-grid">
                                                                {courses.map((course) => (
                                                                    <label key={course.value} className="professor-register__course-option">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="professor-register__course-checkbox"
                                                                            checked={assignment.course_ids.includes(course.value)}
                                                                            onChange={() => handleCourseToggleForAssignment(index, course.value)}
                                                                        />
                                                                        <span className="professor-register__course-checkmark">
                                                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                        </span>
                                                                        <span className="professor-register__course-label">{course.label}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {errors[`faculty_level_courses.${index}.course_ids`] && (
                                                                <span className="professor-register__error">
                                                                    {errors[`faculty_level_courses.${index}.course_ids`]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Résumé de l'affectation */}
                                                {assignment.faculty_id && assignment.level_id && assignment.course_ids.length > 0 && (
                                                    <div className="professor-register__assignment-summary">
                                                        <h5 className="professor-register__assignment-summary-title">
                                                            <svg className="professor-register__summary-icon" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Résumé complet:
                                                        </h5>
                                                        <div className="professor-register__assignment-summary-content">
                                                            <div className="professor-register__assignment-summary-item">
                                                                <strong>Faculté:</strong> {getFacultyName(assignment.faculty_id)}
                                                            </div>
                                                            <div className="professor-register__assignment-summary-item">
                                                                <strong>Niveau:</strong> {getLevelName(assignment.level_id)}
                                                            </div>
                                                            <div className="professor-register__assignment-summary-item">
                                                                <strong>Cours:</strong> {getSelectedCourseNamesForAssignment(assignment.course_ids).join(', ')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {errors.faculty_level_courses && (
                                        <span className="professor-register__error">{errors.faculty_level_courses}</span>
                                    )}
                                </div>
                            </div>                            {/* Photo de profil */}
                            <div className="professor-register__group professor-register__group--full">
                                <label className="professor-register__label">
                                    <svg className="professor-register__label-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Photo de profil
                                </label>

                                {photoPreview ? (
                                    <div className="professor-register__photo-preview">
                                        <img src={photoPreview} alt="Preview" className="professor-register__photo-image" />
                                        <button type="button" className="professor-register__photo-remove" onClick={removePhoto}>
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className={`professor-register__file-upload ${dragActive ? 'professor-register__file-upload--drag-active' : ''}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <svg className="professor-register__upload-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div className="professor-register__upload-text">
                                            <p className="professor-register__upload-primary">Cliquez pour télécharger ou glissez-déposez</p>
                                            <p className="professor-register__upload-secondary">PNG, JPG, GIF jusqu'à 10MB</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            name="photo"
                                            accept="image/*"
                                            className="professor-register__file-input"
                                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                        />
                                    </div>
                                )}
                                {errors.photo && <span className="professor-register__error">{errors.photo}</span>}
                            </div>

                            <button
                                type="submit"
                                className={`professor-register__submit ${processing ? 'professor-register__submit--loading' : ''}`}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <svg className="professor-register__submit-spinner" viewBox="0 0 24 24">
                                            <circle
                                                className="professor-register__spinner-circle"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="professor-register__spinner-path"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Création en cours...
                                    </>
                                ) : (
                                    <>
                                        <svg className="professor-register__submit-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Créer le professeur
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="professor-register__summary">
                            <div className="professor-register__summary-header">
                                <h3 className="professor-register__summary-title">
                                    <svg className="professor-register__summary-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Résumé de l'inscription
                                </h3>
                                <p className="professor-register__summary-subtitle">Étapes pour créer un nouveau professeur</p>
                            </div>

                            <div className="professor-register__summary-content">
                                <div className="professor-register__summary-steps">
                                    <div className="professor-register__summary-step">
                                        <div className="professor-register__summary-step-icon">
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                                            </svg>
                                        </div>
                                        <div className="professor-register__summary-step-content">
                                            <h4 className="professor-register__summary-step-title">Affectation académique</h4>
                                            <p className="professor-register__summary-step-desc">Facultés, niveaux et cours assignés</p>
                                        </div>
                                    </div>

                                    <div className="professor-register__summary-step">
                                        <div className="professor-register__summary-step-icon">
                                            <svg viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="professor-register__summary-step-content">
                                            <h4 className="professor-register__summary-step-title">Photo de profil</h4>
                                            <p className="professor-register__summary-step-desc">Image optionnelle du professeur</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="professor-register__summary-stats">
                                    <div className="professor-register__summary-stat">
                                        <div className="professor-register__summary-stat-number">
                                            {Object.keys(data).filter(
                                                (key) =>
                                                    key !== 'faculty_level_courses' && 
                                                    key !== 'photo' && 
                                                    data[key],
                                            ).length +
                                                (data.faculty_level_courses.length > 0 ? 1 : 0) +
                                                (data.photo ? 1 : 0)}
                                        </div>
                                        <div className="professor-register__summary-stat-label">Champs remplis</div>
                                    </div>
                                    <div className="professor-register__summary-stat">
                                        <div className="professor-register__summary-stat-number">{data.faculty_level_courses.length}</div>
                                        <div className="professor-register__summary-stat-label">Affectations créées</div>
                                    </div>
                                    <div className="professor-register__summary-stat">
                                        <div className="professor-register__summary-stat-number">
                                            {data.faculty_level_courses.filter(assignment => 
                                                assignment.faculty_id && assignment.level_id
                                            ).length}
                                        </div>
                                        <div className="professor-register__summary-stat-label">Affectations complètes</div>
                                    </div>
                                    <div className="professor-register__summary-stat">
                                        <div className="professor-register__summary-stat-number">
                                            {data.faculty_level_courses.reduce((total, assignment) => total + assignment.course_ids.length, 0)}
                                        </div>
                                        <div className="professor-register__summary-stat-label">Cours total</div>
                                    </div>
                                </div>

                                {/* Affichage des affectations dans le résumé */}
                                {data.faculty_level_courses.length > 0 && (
                                    <div className="professor-register__summary-assignments">
                                        <h4 className="professor-register__summary-assignments-title">Affectations actuelles:</h4>
                                        <div className="professor-register__summary-assignments-list">
                                            {data.faculty_level_courses.map((assignment, index) => (
                                                assignment.faculty_id && assignment.level_id && assignment.course_ids.length > 0 && (
                                                    <div key={index} className="professor-register__summary-assignment">
                                                        <div className="professor-register__summary-assignment-header">
                                                            <span className="professor-register__summary-assignment-faculty">
                                                                {getFacultyName(assignment.faculty_id)}
                                                            </span>
                                                            <span className="professor-register__summary-assignment-level">
                                                                {getLevelName(assignment.level_id)}
                                                            </span>
                                                        </div>
                                                        <div className="professor-register__summary-assignment-courses">
                                                            <strong>Cours:</strong> {getSelectedCourseNamesForAssignment(assignment.course_ids).join(', ')}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Dashboard>
    );
}