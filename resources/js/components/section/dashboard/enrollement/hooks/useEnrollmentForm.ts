// resources/js/pages/enrollment/hooks/useEnrollmentForm.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormData, SaveStatus } from '../types';

export function useEnrollmentForm(initial: Partial<FormData>) {
    const [formData, setFormData] = useState<FormData>({
        faculty_id: '',
        level_id: '',
        year_id: '',
        name: '',
        email: '',
        program: '',
        documents: {},
        cardNumber: '',
        cvv: '',
        ...initial,
    });

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [previews, setPreviews] = useState<Record<string, string>>({});

    const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleCheckboxChange = useCallback((checked: boolean) => {
        setIsConfirmed(checked);
    }, []);

    const handleFileChange = useCallback(
        (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            setFormData((prev) => ({ ...prev, documents: { ...prev.documents, [key]: file ?? undefined } }));

            if (previews[key]) URL.revokeObjectURL(previews[key]);
            if (file) {
                const url = URL.createObjectURL(file);
                setPreviews((prev) => ({ ...prev, [key]: url }));
            } else {
                setPreviews((prev) => {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                });
            }
        },
        [previews],
    );

    const removeFile = useCallback(
        (key: string) => {
            if (previews[key]) URL.revokeObjectURL(previews[key]);
            setPreviews((prev) => {
                const { [key]: _, ...rest } = prev;
                return rest;
            });
            setFormData((prev) => {
                const nextDocs = { ...prev.documents };
                delete nextDocs[key];
                return { ...prev, documents: nextDocs };
            });
        },
        [previews],
    );

    const formatCardNumber = useCallback((value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const match = (v.match(/\d{4,16}/g) || [])[0] || '';
        const parts: string[] = [];
        for (let i = 0; i < match.length; i += 4) parts.push(match.substring(i, i + 4));
        return parts.length ? parts.join(' ') : v;
    }, []);

    const setCardNumber = useCallback(
        (raw: string) => {
            const formatted = formatCardNumber(raw);
            setFormData((prev) => ({ ...prev, cardNumber: formatted }));
        },
        [formatCardNumber],
    );

    // persistence locale simple
    const saveProgress = useCallback(async () => {
        setSaveStatus('saving');
        try {
            const dataToSave = {
                formData: {
                    faculty_id: formData.faculty_id,
                    level_id: formData.level_id,
                    year_id: formData.year_id,
                    name: formData.name,
                    email: formData.email,
                    program: formData.program,
                },
                isConfirmed,
            };
            await new Promise((r) => setTimeout(r, 500));
            localStorage.setItem('enrollment_progress', JSON.stringify(dataToSave));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        } catch {
            setSaveStatus('idle');
        }
    }, [formData, isConfirmed]);

    useEffect(() => {
        const saved = localStorage.getItem('enrollment_progress');
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            setFormData((prev) => ({ ...prev, ...parsed.formData, documents: prev.documents }));
            setIsConfirmed(!!parsed.isConfirmed);
        } catch {
            /* noop */
        }
    }, []);

    return {
        formData,
        setFormData,
        isConfirmed,
        setIsConfirmed: handleCheckboxChange,
        fileInputRefs,
        previews,
        handleFileChange,
        removeFile,
        setCardNumber,
        handleFieldChange,
        saveProgress,
        saveStatus,
    };
}
