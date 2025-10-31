// resources/js/pages/enrollment/utils/progress.ts
import { FormData, Section } from '../types';

export function makeIsFieldCompleted(formData: FormData, isConfirmed: boolean) {
    return (field: any) => {
        if (field.type === 'confirm') return isConfirmed;
        if (field.type === 'payment') return Boolean((formData as any)[field.key]);
        if (field.type === 'doc') return Boolean(formData.documents[field.key]);
        return Boolean((formData as any)[field.key]);
    };
}

export function computeProgress(sections: Section[], isFieldCompleted: (f: any) => boolean) {
    const total = sections.reduce((acc, s) => acc + s.fields.length, 0);
    const done = sections.reduce((acc, s) => acc + s.fields.filter(isFieldCompleted).length, 0);
    const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
    return { totalFields: total, completedFields: done, percentage };
}
