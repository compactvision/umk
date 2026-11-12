import Alert from '@/utils/sweetAlert';
import { router } from '@inertiajs/react';
import { RouteParams } from 'vendor/tightenco/ziggy/src/js';

export function illustrationUrl(path: string | File | null | undefined): string {
    if (typeof path !== 'string' || !path) return '';
    return /^(https?:\/\/|\/)/.test(path) ? path : `/storage/${path}`;
}

export const safeJsonParse = (data: unknown, fallback: string[] = []): string | string[] => {
    if (Array.isArray(data)) return data.filter((value): value is string => typeof value === 'string');
    if (typeof data !== 'string' || !data.trim()) return fallback;
    try {
        const parsed: unknown = JSON.parse(data);
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : data;
    } catch { return data; }
};

export const formatValue = (val: unknown) => {
    if (val === null || val === undefined || val === '') return 'N/A';
    if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
    if (typeof val === 'number') return val.toString();
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Aucun élément';
    return val.toString();
};

export const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
        level_code: 'Code du niveau',
        level_name: 'Nom du niveau',
        description: 'Description',
        illustration_image: "Image d'illustration",
        credit_required: 'Crédits requis',
        duration_years: 'Durée (années)',
        courses_number: 'Nombre de cours',
        student_number: "Nombre d'etudiants",
        price: 'Tarif nationaux',
        price_foreign: 'Tarif étrangers',
        language: 'Langue',
        has_certificate: 'Certificat',
        options: 'Options/Opportunités',
        course_objective: 'Objectifs du cours',
        fees: 'Frais',
        semestres: 'Semestres',
    };
    return labels[field] || field;
};

export const processOptionsValue = (value: unknown) => {
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

export const formatOptionsForDisplay = (options: unknown) => {
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
    { value: 'other', label: 'Autre' },
];

export function saveLevel(levelId: RouteParams<"dashboard.admin.levels.details.update">|undefined, levelDataHook: { data: { [s: string]: unknown; }|ArrayLike<unknown>; }) {
    const formData = new FormData();

    Object.entries(levelDataHook.data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k, v]) => {
                // pour les fichiers
                if (v instanceof File) {
                    formData.append(`${key}[${k}]`, v);
                } else {
                    formData.append(`${key}[${k}]`, String(v ?? ''));
                }
            });
        } else {
            formData.append(key, value instanceof Blob ? value : String(value ?? ''));
        }
    });

    router.post(route('dashboard.admin.levels.details.update', levelId), formData, {
        forceFormData: true,
        onSuccess: () => Alert.success('Mise à jour réussie'),
        onError: () => Alert.error('Erreur lors de la mise à jour'),
    });
}
