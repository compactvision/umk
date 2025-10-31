// resources/js/pages/enrollment/types.ts
import { ComponentType } from 'react';

export type Faculty = { id: string | number; name: string };
export type Level   = { id: string | number; name: string };
export type Year    = { id: string | number; name: string };

export type RequirementDoc = {
  key: string;
  label: string;
  required: boolean;
  accept?: string;
};

export type Requirements = {
  personal_info: RequirementDoc[];
  academic_info: RequirementDoc[];
  payment?: { required: boolean; amount: number; currency: string };
};

export type FieldType = 'doc' | 'confirm' | 'payment' | undefined;

export type SectionField = {
  key: string;
  label: string;
  icon: ComponentType<any>;
  type?: FieldType;
};

export type Section = {
  title: string;
  icon: ComponentType<any>;
  fields: SectionField[];
};

export type PaymentStage = 'confirm' | 'pay';

export type FormData = {
  faculty_id: string;
  level_id: string;
  year_id: string;
  name: string;
  email: string;
  program: string;
  documents: Record<string, File | undefined>;
  cardNumber: string;
  cvv: string;
};

export type SaveStatus = 'idle' | 'saving' | 'saved';
