// Type de base pour les timestamps Laravel
export interface Timestamps {
    created_at: string;
    updated_at: string;
}

// Interface pour le modèle Faculty
export interface Faculty extends Timestamps {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;

    // Relations (optionnelles car pas toujours chargées)
    levels?: Level[];
    levels_count?: number;
}

// Interface pour Level (mise à jour des relations)
export interface Level extends Timestamps {
    id: number;
    name: string;
    code: string;
    description?: string;
    faculty_id: number;
    duration: number;
    credits_required?: number;
    is_active: boolean;
    level_type: 'undergraduate' | 'graduate' | 'postgraduate' | 'doctorate';

    // Relations (optionnelles car pas toujours chargées)
    faculty?: Faculty;
    students?: User[]; // Users avec role 'student'
    courses?: Course[];
    students_count?: number;
    courses_count?: number;
}

// Type alias pour les étudiants (Users avec role 'student')
export type Student = User & {
    role: 'student';
    student_number: string;
    first_name: string;
    last_name: string;
    faculty_id: number;
    level_id: number;
};

// Interface pour Course (si vous en avez besoin)
export interface Course extends Timestamps {
    id: number;
    name: string;
    code: string;
    credits: number;
    level_id: number;

    // Relation
    level?: Level;
}

// Types pour les formulaires
export interface FacultyFormData {
    name: string;
    code: string;
    description?: string;
    dean?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    is_active: boolean;
    established_year?: number;
}

export interface LevelFormData {
    name: string;
    code: string;
    description?: string;
    faculty_id: number;
    duration: number;
    credits_required?: number;
    is_active: boolean;
    level_type: 'undergraduate' | 'graduate' | 'postgraduate' | 'doctorate';
}

// Types pour les props de pages
export interface FacultiesIndexProps extends PageProps {
    faculties: {
        data: Faculty[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    filters?: {
        search?: string;
        is_active?: boolean;
    };
}

export interface FacultyShowProps extends PageProps {
    faculty: Faculty & {
        levels: Level[];
    };
}

export interface LevelsIndexProps extends PageProps {
    levels: {
        data: Level[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    faculties: Faculty[];
    filters?: {
        search?: string;
        faculty_id?: number;
        level_type?: string;
        is_active?: boolean;
    };
}

export interface LevelShowProps extends PageProps {
    level: Level & {
        faculty: Faculty;
        students?: Student[];
        courses?: Course[];
    };
}

// Types pour la pagination Laravel
export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
}

// Type de base pour les props de page (à adapter selon votre structure)
export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User;
    };
    ziggy: {
        location: string;
        query: Record<string, unknown>;
    };
    flash: {
        message?: string;
        error?: string;
        success?: string;
    };
    errors: Record<string, string>;
} & T

// Interface User avec données étudiants intégrées
export interface User extends Timestamps {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'student' | 'admin' | 'teacher' | 'staff';

    // Champs spécifiques aux étudiants (optionnels selon le rôle)
    student_number?: string;
    first_name?: string;
    last_name?: string;
    faculty_id?: number;
    level_id?: number;
    birth_date?: string;
    phone?: string;
    address?: string;

    // Relations (pour les étudiants)
    faculty?: Faculty;
    level?: Level;

    // Nom complet calculé
    full_name?: string;
}

// Types pour les sélecteurs/options
export interface SelectOption {
    value: number | string;
    label: string;
}

// Types utilitaires
export type FacultyWithLevels = Faculty & {
    levels: Level[];
};

export type LevelWithFaculty = Level & {
    faculty: Faculty;
};

// Types pour les statistiques (si nécessaire)
export interface FacultyStats {
    total_faculties: number;
    active_faculties: number;
    total_students: number;
    total_levels: number;
}

export interface LevelStats {
    total_levels: number;
    active_levels: number;
    total_students: number;
    levels_by_type: Record<string, number>;
}
