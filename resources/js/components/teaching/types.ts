export type Professor = {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string | null;
    speciality?: string | null;
    biography?: string | null;
    is_active: boolean;
    offerings_count?: number;
};
export type TeachingCourse = {
    id: number;
    title: string;
    code: string | null;
    semester: number | null;
    level?: { id: number; title: string; faculty: { id: number; name: string } };
};
export type Year = { id: number; title: string; start_date?: string; end_date?: string };
export type Assignment = {
    id: number;
    course_id: number;
    academic_year_id: number;
    professor_id: number | null;
    is_published: boolean;
    is_optional: boolean;
    class_id: number | null;
    assistant_professor_id?: number | null; assistant?: Professor | null; group_leader_name?: string | null; delivery_mode?: string;
    professor?: Professor | null;
    academic_year: Year;
    course?: TeachingCourse;
    level?: { id: number; title: string; faculty: { name: string } };
    group?: { intake?: { name: string } } | null;
};
export const professorName = (professor: Professor) => `${professor.first_name} ${professor.last_name}`;
