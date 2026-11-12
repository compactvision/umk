export type AdmissionCondition = { id: number; title: string; description: string; section: string; is_required: boolean };
export type LevelDetails = {
    id: number; level_id: number; faculty_id: number; faculty_name: string; level_title: string; level_name: string; level_description: string; level_code: string;
    credit_required: number | null; duration_years: number; courses_number: number | null; student_number: number | null;
    price: number | string | null; price_foreign: number | string | null; price_national_first: number | string | null; price_national_second: number | string | null;
    price_foreign_first: number | string | null; price_foreign_second: number | string | null;
    language: string | null; has_certificate: boolean; illustration_image: string | null; course_objective: string | null; options: string | string[]; fees: number | null;
    description: string; image: string;
};
export type AcademicLevel = { id: number; faculty_id: number; title: string; code: string; level_name: string; level_code: string; description: string; image: string; is_active: boolean; details: LevelDetails; admission_conditions: AdmissionCondition[] };
export type Faculty = { id: number; name: string; code: string; description: string; image: string; duration_years: string; is_active: boolean; levels: AcademicLevel[]; student_count: number; levels_count: number };
export type LevelPageProps = { initialTab?: 'infos' | 'conditions'; canManageAdmissionCampaigns?: boolean; levelDetail: LevelDetails; level: AcademicLevel; admissionConditions: AdmissionCondition[]; faculties: { data: Faculty[] } };
