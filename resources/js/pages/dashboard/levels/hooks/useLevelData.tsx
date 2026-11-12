import type { LevelDetails } from '@/types/academic';
import { useState } from 'react';
import { safeJsonParse } from '../utils/levelUtils';

type FieldValue = string | number | boolean | string[] | File;

export function useLevelData(level: LevelDetails) {
    const detailsData = {
        level_id: level.level_id,
        credit_required: level.credit_required ?? '',
        duration_years: level.duration_years,
        courses_number: level.courses_number ?? '',
        price: level.price ?? '',
        price_foreign: level.price_foreign ?? '',
        price_national_first: level.price_national_first ?? '',
        price_national_second: level.price_national_second ?? '',
        price_foreign_first: level.price_foreign_first ?? '',
        price_foreign_second: level.price_foreign_second ?? '',
        language: level.language ?? '',
        student_number: level.student_number ?? '',
        has_certificate: level.has_certificate,
        illustration_image: level.illustration_image ?? '',
        course_objective: level.course_objective ?? '',
        options: safeJsonParse(level.options),
        fees: level.fees ?? '',
    };

    const [draft, setDraft] = useState<Omit<typeof detailsData, 'illustration_image'> & { illustration_image: string | File }>(detailsData);
    const resetDraft = () => setDraft(detailsData);
    const getFieldValue = (field: string) => (field in draft ? draft[field as keyof typeof draft] : undefined);
    const updateField = (field: string, value: FieldValue) => {
        setDraft((current) => (field in current ? { ...current, [field]: value } : current));
    };

    return { detailsData, draft, resetDraft, getFieldValue, updateField };
}
