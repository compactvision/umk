import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState, type SetStateAction } from 'react';
import type { DocumentMeta, FormData as EnrollmentFormData, SaveStatus } from '../types';

export function useEnrollmentForm(initial: Partial<EnrollmentFormData> & { uuid?: string; last_step?: number; isConfirmed?: boolean }) {
    const [formData, setFormData] = useState<EnrollmentFormData>({
        faculty_id: '',
        level_id: '',
        year_id: '',
        name: '',
        email: '',
        program: '',
        documents: {},
        ...initial,
    });
    const [uuid, setUuid] = useState<string | null>(initial.uuid || null);
    const [isConfirmed, setIsConfirmed] = useState(!!initial.isConfirmed);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [saveError, setSaveError] = useState('');
    const [uploadingKeys, setUploadingKeys] = useState<string[]>([]);
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const previewUrls = useRef<Record<string, string>>({});
    const busy = useRef(false);
    useEffect(
        () => () => {
            Object.values(previewUrls.current).forEach((url) => URL.revokeObjectURL(url));
        },
        [],
    );
    const updatePreview = (key: string, file?: File) => {
        if (previewUrls.current[key]) URL.revokeObjectURL(previewUrls.current[key]);
        delete previewUrls.current[key];
        if (file) previewUrls.current[key] = URL.createObjectURL(file);
        setPreviews({ ...previewUrls.current });
    };
    const updateFormData = (update: SetStateAction<EnrollmentFormData>) => {
        setFormData(update);
        setSaveStatus('idle');
        setIsConfirmed(false);
    };
    const handleFieldChange = (field: keyof EnrollmentFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setSaveStatus('idle');
        setIsConfirmed(false);
    };
    const removeFile = (key: string) => {
        updatePreview(key);
        setFormData((prev) => {
            const documents = { ...prev.documents };
            delete documents[key];
            return { ...prev, documents };
        });
        setUploadErrors((prev) => ({ ...prev, [key]: '' }));
        setIsConfirmed(false);
        setSaveStatus('idle');
    };
    const handleFileChange = (key: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadErrors((prev) => ({ ...prev, [key]: '' }));
        if (file.size > 10 * 1024 * 1024) {
            setUploadErrors((prev) => ({ ...prev, [key]: 'Ce fichier dépasse 10 Mo. Choisissez un fichier plus léger.' }));
            event.target.value = '';
            return;
        }
        updatePreview(key, file);
        setUploadingKeys((prev) => [...prev, key]);
        const body = new FormData();
        body.append('key', key);
        body.append('file', file);
        try {
            const { data } = await axios.post('/dashboard/enrollments/documents/upload', body);
            const document: DocumentMeta | undefined = data.temp
                ? {
                      temp: { token: data.temp.token, path: data.temp.path },
                      filename: data.temp.filename,
                      mime: data.temp.mime,
                      size_bytes: data.temp.size_bytes,
                  }
                : data.document;
            if (!data.ok || !document) throw new Error('Le transfert n’a pas abouti. Réessayez.');
            setFormData((prev) => ({ ...prev, documents: { ...prev.documents, [key]: document } }));
            setIsConfirmed(false);
            setSaveStatus('idle');
        } catch (error) {
            updatePreview(key);
            setUploadErrors((prev) => ({
                ...prev,
                [key]: axios.isAxiosError(error)
                    ? error.response?.data?.errors?.file?.[0] || 'Impossible de transférer le fichier. Vérifiez votre connexion et réessayez.'
                    : 'Impossible de transférer le fichier. Réessayez.',
            }));
        } finally {
            setUploadingKeys((prev) => prev.filter((item) => item !== key));
        }
    };
    const saveProgress = async (step = 1): Promise<boolean> => {
        if (busy.current || uploadingKeys.length) return false;
        busy.current = true;
        setSaveStatus('saving');
        setSaveError('');
        try {
            const { data } = await axios.post('/dashboard/enrollments/save-progress', {
                uuid,
                last_step: step,
                form_snapshot: {
                    faculty_id: formData.faculty_id,
                    level_id: formData.level_id,
                    academic_program_id: formData.academic_program_id,
                    year_id: formData.year_id,
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    program: formData.program.trim(),
                    documents: formData.documents,
                    isConfirmed,
                },
            });
            if (!data.ok || !data.draft?.uuid) throw new Error('Sauvegarde non confirmée.');
            setUuid(data.draft.uuid);
            setFormData((prev) => ({ ...prev, documents: data.draft.form_snapshot?.documents ?? prev.documents }));
            setSaveStatus('saved');
            return true;
        } catch (error) {
            const response = axios.isAxiosError(error) ? error.response?.data : null;
            const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null;
            setSaveError(String(firstError || response?.message || 'Votre dossier n’a pas été sauvegardé. Vérifiez votre connexion et réessayez.'));
            setSaveStatus('idle');
            return false;
        } finally {
            busy.current = false;
        }
    };
    const submitEnrollment = async (): Promise<boolean> => {
        if (!uuid || !(await saveProgress(4))) return false;
        try {
            const { data } = await axios.post<{ ok: boolean; redirect: string }>(route('dashboard.enrollments.submit', uuid));
            router.visit(data.redirect);
            return true;
        } catch (error) {
            const response = axios.isAxiosError(error) ? error.response?.data : null;
            setSaveError(response?.message || 'La soumission a échoué. Réessayez.');
            return false;
        }
    };
    return {
        formData,
        setFormData: updateFormData,
        isConfirmed,
        setIsConfirmed,
        saveStatus,
        saveError,
        uploadingKeys,
        uploadErrors,
        previews,
        fileInputRefs,
        handleFieldChange,
        handleFileChange,
        removeFile,
        saveProgress,
        submitEnrollment,
    };
}
