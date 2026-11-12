import type { ComponentType, SVGProps } from 'react';
export type Faculty = { id: string | number; name: string };
export type Level = { id: string | number; name: string; detail?: { fees?: number | null } | null };
export type Year = { id: string | number; name: string };
export type RequirementDoc = { key: string; label: string; required: boolean; accept?: string };
export type Requirements = {
    personal_info: RequirementDoc[];
    academic_info: RequirementDoc[];
    payment?: { required: boolean; amount: number; currency: string };
};
export type DocumentMeta = { uuid?: string; temp?: { token: string; path: string }; filename: string; mime: string; size_bytes: number };
export type FieldType = 'doc' | 'confirm' | 'payment' | undefined;
export type SectionField = { key: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; type?: FieldType };
export type Section = { title: string; icon: ComponentType<SVGProps<SVGSVGElement>>; fields: SectionField[] };
export type PaymentStage = 'confirm' | 'pay';
export type FormData = {
    academic_program_id?: string;
    faculty_id: string;
    level_id: string;
    year_id: string;
    name: string;
    email: string;
    program: string;
    documents: Record<string, DocumentMeta | undefined>;
};
export type SaveStatus = 'idle' | 'saving' | 'saved';
