// resources/js/pages/enrollment/hooks/useEnrollmentForm.ts (NO autosave)

import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormData, SaveStatus } from '../types';
import Alert from '@/utils/sweetAlert';

const SAVE_ROUTE = (window as any).route ? (window as any).route('dashboard.enrollments.save-progress') : '/dashboard/enrollments/save-progress';

const UPLOAD_ROUTE = (window as any).route
    ? (window as any).route('dashboard.enrollments.documents.upload')
    : '/dashboard/enrollments/documents/upload';

const SUBMIT_ROUTE = (uuid: string) =>
    (window as any).route ? (window as any).route('dashboard.enrollments.submit', uuid) : `/dashboard/enrollments/${uuid}/submit`;

type DocMeta = {
    uuid: string;
    filename: string;
    mime: string;
    size_bytes: number;
};

type DocumentsBag = Record<string, DocMeta | undefined>;

export function useEnrollmentForm(initial: Partial<FormData> & { uuid?: string; last_step?: number }) {
    const [formData, setFormData] = useState<FormData>({
        faculty_id: '',
        level_id: '',
        year_id: '',
        name: '',
        email: '',
        program: '',
        documents: {} as DocumentsBag,
        cardNumber: '',
        cvv: '',
        ...initial,
    });

    const [uuid, setUuid] = useState<string | null>(initial?.uuid ?? null);
    const [lastStep, setLastStep] = useState<number>(initial?.last_step ?? 1);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [previews, setPreviews] = useState<Record<string, string>>({});

    // --------- setters simples (aucune sauvegarde implicite) ----------
    const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleCheckboxChange = useCallback((checked: boolean) => {
        setIsConfirmed(checked);
    }, []);

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

    // --------- previews ----------
    const setPreviewUrl = (key: string, url?: string | null) => {
        if (previews[key]) URL.revokeObjectURL(previews[key]);
        if (url) {
            setPreviews((prev) => ({ ...prev, [key]: url }));
        } else {
            setPreviews((prev) => {
                const { [key]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    // --------- upload (aucune sauvegarde côté serveur tant que tu ne cliques pas "Sauvegarder") ----------
    const uploadDocument = useCallback(
        async (key: string, file: File) => {
            const fd = new FormData();
            if (uuid) fd.append('enrollment_uuid', uuid);
            fd.append('key', key);
            fd.append('file', file);

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            let res: Response;
            try {
                res = await fetch(UPLOAD_ROUTE, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    body: fd,
                });
            } catch (netErr: any) {
                throw new Error(`Réseau indisponible: ${netErr?.message || netErr}`);
            }

            // Essaye JSON, sinon texte
            let json: any = null;
            let raw: string | null = null;
            try {
                json = await res.json();
            } catch {
                try {
                    raw = await res.text();
                } catch {
                    /* noop */
                }
            }

            // Si HTTP non 2xx → remonte un message parlant
            if (!res.ok) {
                const hint = json?.message || raw || `HTTP ${res.status}`;
                throw new Error(`Upload HTTP ${res.status}: ${hint}`);
            }

            // Format 1 (temp) selon notre dernier contrôleur
            if (json?.ok && json?.temp) {
                const meta: DocMeta = {
                    // pas de uuid ici: fichier pas encore persisté en DB
                    temp: { token: json.temp.token, path: json.temp.path },
                    filename: json.temp.filename,
                    mime: json.temp.mime,
                    size_bytes: json.temp.size_bytes,
                };
                setFormData((prev) => ({
                    ...prev,
                    documents: { ...(prev.documents ?? {}), [key]: meta },
                }));
                return meta;
            }

            // Format 2 (document) si tu as encore l’ancien contrôleur en place
            if (json?.ok && json?.document) {
                const meta: DocMeta = {
                    uuid: json.document.uuid,
                    filename: json.document.filename,
                    mime: json.document.mime,
                    size_bytes: json.document.size_bytes,
                };
                setFormData((prev) => ({
                    ...prev,
                    documents: { ...(prev.documents ?? {}), [key]: meta },
                }));
                return meta;
            }

            // Format inattendu → log + erreur claire
            console.warn('Réponse upload inattendue:', json ?? raw);
            throw new Error(json?.message || 'Upload failed: payload inattendu');
        },
        [uuid],
    );

    const handleFileChange = useCallback(
        (key: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];

            if (!file) {
                setPreviewUrl(key, null);
                setFormData((prev) => {
                    const nextDocs: any = { ...(prev.documents ?? {}) };
                    delete nextDocs[key];
                    return { ...prev, documents: nextDocs };
                });
                return;
            }

            // Preview locale
            const previewUrl = URL.createObjectURL(file);
            setPreviewUrl(key, previewUrl);

            try {
                setSaveStatus('saving'); // feedback UI
                await uploadDocument(key, file); // ⇐ pas de saveProgress ici
                setSaveStatus('idle');
            } catch (err: any) {
                setSaveStatus('idle');
                // Message explicite pour toi
                console.error('Upload error:', err);
                alert(err?.message || 'Erreur lors de l’upload du fichier');
                setPreviewUrl(key, null);
            }
        },
        [uploadDocument],
    );

    const removeFile = useCallback((key: string) => {
        setPreviewUrl(key, null);
        setFormData((prev) => {
            const nextDocs: any = { ...(prev.documents as any) };
            if (nextDocs[key]) delete nextDocs[key];
            return { ...prev, documents: nextDocs };
        });
    }, []);

    // --------- payload de sauvegarde (draft) ----------
    const minimalSnapshot = (fd: FormData) => {
        // ne mapper que les documents déjà uploadés (qui ont un uuid)
        const docs: Record<string, { uuid: string; filename?: string; mime?: string; size_bytes?: number }> = {};
        Object.entries(fd.documents ?? {}).forEach(([k, v]) => {
            // v peut être DocMeta, File, undefined...
            if (v && typeof v === 'object' && 'uuid' in (v as any) && (v as any).uuid) {
                const m = v as any;
                docs[k] = {
                    uuid: m.uuid,
                    filename: m.filename ?? undefined,
                    mime: m.mime ?? undefined,
                    size_bytes: m.size_bytes ?? undefined,
                };
            }
        });

        return {
            faculty_id: fd.faculty_id || '',
            level_id: fd.level_id || '',
            year_id: fd.year_id || '',
            name: fd.name || '',
            email: fd.email || '',
            program: fd.program || '',
            documents: docs, // uniquement métadonnées, jamais de File
            cardNumber: fd.cardNumber || '',
            cvv: fd.cvv || '',
            isConfirmed,
        };
    };

    // --------- SAUVEGARDE EXPLICITE (bouton "Sauvegarder") ----------
    const saveProgress = useCallback(
        (forcedStep?: number) => {
            setSaveStatus('saving');

            // 1) snapshot strictement JSON-serializable (élimine Proxy/File/etc.)
            const safeSnapshot = JSON.parse(JSON.stringify(minimalSnapshot(formData)));

            router.post(
                SAVE_ROUTE,
                {
                    uuid,
                    last_step: forcedStep ?? lastStep,
                    form_snapshot: safeSnapshot,
                },
                {
                    preserveScroll: true,
                    // 2) évite FormData: Inertia n’essaiera pas de scanner des Files
                    forceFormData: false,
                    onSuccess: (page) => {
                        const newUuid = (page.props as any)?.uuid ?? (page as any)?.uuid ?? null;
                        if (newUuid && newUuid !== uuid) setUuid(newUuid);
                        if (forcedStep) setLastStep(forcedStep);

                        setSaveStatus('saved');
                        window.setTimeout(() => setSaveStatus('idle'), 1000);
                    },
                    onError: () => setSaveStatus('idle'),
                },
            );
        },
        [formData, isConfirmed, uuid, lastStep],
    );

    // --------- Chargement éventuel d’un brouillon existant (OK, ce n’est pas de l’auto-save) ----------
    const triedDraftRef = useRef(false);
    useEffect(() => {
        // si déjà essayé ou déjà un uuid → ne rien faire
        if (triedDraftRef.current || uuid) return;

        triedDraftRef.current = true; // on n'essaiera plus
        let aborted = false;

        (async () => {
            setIsLoadingDraft(true);
            try {
                // 1) si Ziggy n'a pas la route → on abandonne proprement
                const showDraftRoute = (window as any).route
                    ? (window as any).route('dashboard.enrollments.draft.show')
                    : '/dashboard/enrollments/draft/show';

                const res = await fetch(showDraftRoute, {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                });

                // 2) si 404/!ok → on arrête (pas de relance)
                if (!res.ok) return;

                const json = await res.json();
                if (!json?.ok || !json?.draft) return;

                if (aborted) return;

                const draft = json.draft;
                const snapshot = draft.form_snapshot || {};

                setFormData((prev) => ({
                    ...prev,
                    faculty_id: snapshot.faculty_id ?? prev.faculty_id,
                    level_id: snapshot.level_id ?? prev.level_id,
                    year_id: snapshot.year_id ?? prev.year_id,
                    name: snapshot.name ?? prev.name,
                    email: snapshot.email ?? prev.email,
                    program: snapshot.program ?? prev.program,
                    cardNumber: snapshot.cardNumber ?? prev.cardNumber,
                    cvv: snapshot.cvv ?? prev.cvv,
                    documents: snapshot.documents ?? prev.documents,
                }));

                setUuid(draft.uuid ?? null);

                if (draft.last_step) {
                    const n = parseInt(draft.last_step);
                    setLastStep(Number.isFinite(n) ? n : 1);
                }

                if (snapshot.isConfirmed !== undefined) {
                    setIsConfirmed(!!snapshot.isConfirmed);
                }
            } catch (e) {
                // silence → on n’essaie plus
            } finally {
                if (!aborted) setIsLoadingDraft(false);
            }
        })();

        return () => {
            aborted = true;
        };
    }, [uuid, setFormData, setIsConfirmed, setLastStep, setUuid, setIsLoadingDraft]);

    // --------- SOUMISSION FINALE ----------
    const submitEnrollment = useCallback(
        () => {
            Alert.success("Inscription reussi")
            window.location.href = route('dashboard.enrollments.index');
        },
        [],
    );
        // async (notes?: string) => {
        //     if (!uuid) throw new Error('Aucun brouillon à soumettre');

        //     setSaveStatus('saving');
        //     return new Promise((resolve, reject) => {
        //         router.post(
        //             SUBMIT_ROUTE(uuid),
        //             { notes: notes || '' },
        //             {
        //                 onSuccess: () => {
        //                     setSaveStatus('saved');
        //                     resolve(true);
        //                 },
        //                 onError: (errors) => {
        //                     setSaveStatus('idle');
        //                     reject(errors);
        //                 },
        //             },
        //         );
        //     });
        // },
        // [uuid],
    // );

    return {
        formData,
        setFormData,
        isConfirmed,
        setIsConfirmed: handleCheckboxChange,
        saveStatus,
        previews,
        fileInputRefs,
        isLoadingDraft,
        handleFileChange,
        removeFile,
        setCardNumber,
        handleFieldChange,
        uuid,
        lastStep,
        setLastStep,

        // Actions explicites UNIQUEMENT
        saveProgress, // ← appelle ceci depuis ton bouton "Sauvegarder"
        uploadDocument, // ← upload de fichiers, n’enclenche PLUS de save serveur
        submitEnrollment, // ← bouton "Soumettre l’inscription"
    };
}
