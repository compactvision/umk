export type Period = { code: string; name: string };
export type Row = {
    id: number;
    code: string;
    name: string;
    revision: number;
    is_active: boolean;
    university_id?: number | null;
    faculty_id?: number;
    academic_cycle_id?: number;
    academic_department_id?: number | null;
    academic_program_id?: number;
    academic_year_id?: number;
    level_id?: number;
    normal_duration?: number | null;
    degree?: string | null;
    progression_mode?: string;
    weighting_mode?: string;
    periods?: Period[];
    acronym?: string | null;
    site_id?: number | null;
};
export type Level = { id: number; faculty_id: number; title: string; code: string };
export type Program = Row & { levels: Level[]; faculty: { id: number; name: string }; cycle: { id: number; name: string }; versions_count?: number };
export type Course = {
    semester?: number | string | null;
    id: number;
    level_id: number;
    title: string;
    code?: string | null;
    credits?: number | null;
    cmi_hours?: number;
    td_hours?: number;
    tp_hours?: number;
};
export type Item = {
    source_course_id: number;
    is_optional?: boolean;
    name: string;
    code?: string | null;
    description?: string | null;
    credits: number | string | null;
    coefficient: number | string | null;
    cmi_hours: number;
    td_hours: number;
    tp_hours: number;
};
export type Unit = {
    level_id: number;
    period_code: string;
    code: string;
    name: string;
    expected_credits: number | string | null;
    credit_rule?: 'sum' | 'independent';
    items: Item[];
};
export type Version = {
    id: number;
    academic_program_id: number;
    academic_year_id: number | null;
    admission_cohort_id: number | null;
    code: string;
    name: string;
    status: 'draft' | 'validated' | 'published' | 'replaced' | 'archived';
    revision: number;
    weighting_mode: string;
    periods: Period[];
    program_snapshot: { name: string; code: string; cycle: string };
    units?: Unit[];
    enrollments_count?: number;
    published_at?: string | null;
};
export type Page<T> = { data: T[]; total: number; current_page?: number; links: { url: string | null; active: boolean; label: string }[] };
export type Student = {
    id: number;
    matricule: string | null;
    level_id: number;
    academic_year_id: number;
    profile: { user: { first_name: string; last_name: string } };
    level: { title: string };
    academic_year: { title: string };
};
export type Difference = {
    key: string;
    before: (Partial<Item> & { unit?: string; period?: string }) | null;
    after: (Partial<Item> & { unit?: string; period?: string }) | null;
};
export type LevelReview = {
    id: number;
    title: string;
    subject_count: number;
    approved: boolean;
    signature: string;
    schedule: {
        id: number;
        course_id: number;
        course: string;
        audience: string;
        teacher: string | null;
        sessions: { id: number; starts_at: string; ends_at: string; room: string }[];
    }[];
};

export type ScheduleGeneration = { sessions: number; issues: string[] };

export type Props = {
    packYear: number | null;
    facultyPack: {
        id: number;
        name: string;
        total: number;
        approved: number;
        versions: { id: number; program_id: number; name: string; levels: Pick<LevelReview, 'id' | 'title' | 'approved'>[] }[];
    }[];
    scheduleGeneration?: ScheduleGeneration | null;
    levelWorkspace: LevelReview[];
    scheduleSemesters: { id: number; number: number; start_date: string; end_date: string }[];
    institution:
        | (Row & {
              site?: { site_name: string; address?: string | null; contact_email?: string | null; contact_phone?: string | null } | null;
          })
        | null;
    sites: { id: number; site_name: string; address?: string | null; contact_email?: string | null; contact_phone?: string | null }[];
    faculties: { id: number; name: string; university_id: number | null }[];
    years: { id: number; title: string; university_id: number | null }[];
    levels: Level[];
    departments: Row[];
    cycles: Row[];
    programs: Page<Program>;
    selectedProgram: Program | null;
    cohorts: Row[];
    promotions: Row[];
    groups: { id: number; level_id: number; name: string; academic_promotion_id: number | null }[];
    versions: Page<Version> | null;
    activeVersions: Version[];
    selectedVersion: (Version & { units: Unit[] }) | null;
    catalog: Course[];
    affected: Page<Student> | null;
    unmapped: Page<Student> | null;
    comparison: Difference[] | null;
    audit: { id: number; action: string; reason: string; actor_id: number; created_at: string }[];
    abilities: { manage: boolean; curriculum: boolean };
    filters: {
        tab?: 'institution' | 'programs' | 'curriculum';
        program?: number;
        version?: number;
        level?: number;
        compare?: number;
        q?: string;
        student_q?: string;
    };
    success?: string;
    annualBatch?: {
        year: string;
        rows: (
            | {
                  faculty: string;
                  program: string;
                  program_id: number;
                  version_id: number;
                  status: 'created' | 'existing';
                  schedule?: ScheduleGeneration | null;
              }
            | { faculty: string; program?: string; program_id?: number; status: 'skipped'; message: string }
        )[];
    } | null;
};
export type ReferenceKind =
    'university' | 'faculty-context' | 'year-context' | 'department' | 'cycle' | 'program' | 'cohort' | 'promotion' | 'group-promotion';
export const labels: Record<ReferenceKind, string> = {
    university: 'Identité institutionnelle',
    'faculty-context': 'Rattacher la faculté',
    'year-context': 'Rattacher l’année',
    department: 'Département',
    cycle: 'Cycle académique',
    program: 'Programme',
    cohort: 'Cohorte d’admission',
    promotion: 'Promotion annuelle',
    'group-promotion': 'Associer un groupe pédagogique',
};
export const statusLabels: Record<Version['status'], string> = {
    draft: 'Brouillon',
    validated: 'Validée',
    published: 'Publiée',
    replaced: 'Remplacée',
    archived: 'Archivée',
};
export function messages(value: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    const visit = (item: unknown, key: string) => {
        if (typeof item === 'string') result[key] = item;
        else if (item && typeof item === 'object') for (const [name, child] of Object.entries(item)) visit(child, `${key}.${name}`);
    };
    visit(value, '');
    return result;
}
