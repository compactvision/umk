import Alert from "@/utils/sweetAlert";
import { router } from "@inertiajs/react";

export const safeJsonParse = (data, fallback = []) => {
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

export const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return 'N/A';
    if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
    if (typeof val === 'number') return val.toString();
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Aucun élément';
    return val.toString();
};

export const getFieldLabel = (field) => {
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
        'semestres': 'Semestres'
    };
    return labels[field] || field;
};

export const processOptionsValue = (value) => {
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

export const formatOptionsForDisplay = (options) => {
    if (!options) return '';
    if (typeof options === 'string') return options;
    if (Array.isArray(options)) return options.join(', ');
    return '';
};

// Constantes pour éviter la répétition
export const PROFESSOR_DATA = {
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

export const NAVIGATION_ITEMS = [
    { id: 'infos', label: 'Informations', icon: 'BookOpen' },
    { id: 'prof', label: 'Professeurs', icon: 'Users' },
    { id: 'conditions', label: 'Conditions', icon: 'CheckCircle' },
    { id: 'cours', label: 'Cours', icon: 'GraduationCap' },
];

export const CONDITION_TYPES = [
    { value: 'personal_info', label: 'Informations personnelles' },
    { value: 'academic_info', label: 'Informations académiques' },
    { value: 'other', label: 'Autre' }
];

export function saveLevel(levelId, levelDataHook) {
    const formData = new FormData();
  
    Object.entries(levelDataHook.data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([k, v]) => {
          // pour les fichiers
          if (v instanceof File) {
            formData.append(`${key}[${k}]`, v);
          } else {
            formData.append(`${key}[${k}]`, v ?? '');
          }
        });
      } else {
        formData.append(key, value ?? '');
      }
    });
  
    router.post(route('dashboard.admin.levels.details.update', levelId), formData, {
      forceFormData: true,
      onSuccess: () => Alert.success('Mise à jour réussie'),
      onError: () => Alert.error('Erreur lors de la mise à jour'),
    });
  }