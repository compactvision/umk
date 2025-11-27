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
        (forcedStep?: number): Promise<boolean> => {
            if (!uuid && !formData.faculty_id) return Promise.resolve(true); // Pas assez de données

            setSaveStatus('saving');

            return new Promise((resolve, reject) => {
                router.post(
                    SAVE_ROUTE,
                    {
                        uuid,
                        last_step: forcedStep ?? lastStep,
                        form_snapshot: minimalSnapshot(formData),
                    },
                    {
                        preserveScroll: true,
                        // 2) évite FormData: Inertia n’essaiera pas de scanner des Files
                        forceFormData: false,
                        onSuccess: (page) => {
                            // Récupérer le UUID depuis les props (structure: props.draft.uuid)
                            const props = page.props as any;
                            const newUuid = props.draft?.uuid ?? props.uuid ?? (page as any).uuid ?? null;
                            
                            if (newUuid && newUuid !== uuid) {
                                setUuid(newUuid);
                                // Mettre à jour l'URL pour pointer vers l'édition du brouillon
                                const newUrl = window.route('dashboard.enrollments.edit', newUuid);
                                window.history.replaceState({}, '', newUrl);
                            }
                            if (forcedStep) setLastStep(forcedStep);

                            setSaveStatus('saved');
                            window.setTimeout(() => setSaveStatus('idle'), 1000);
                            resolve(true);
                        },
                        onError: (errors) => {
                            setSaveStatus('idle');
                            // Gérer l'erreur d'unicité spécifique
                            if ((errors as any)?.uniqueness) {
                                Alert.error((errors as any).uniqueness);
                                // Attendre un peu que l'utilisateur lise le message avant de recharger
                                setTimeout(() => {
                                    router.visit(window.route('dashboard.enrollments.create'));
                                }, 2000);
                                resolve(false); // On résout à false pour bloquer la navigation mais l'action est traitée
                                return;
                            }
                            console.error('Save error:', errors);
                            resolve(false);
                        },
                    },
                );
            });
        },
        [uuid, formData, lastStep, minimalSnapshot],
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

    // --------- AUTO-SAVE avec debounce (SUPPRIMÉ) ----------
    // L'utilisateur souhaite sauvegarder uniquement au changement d'étape.
    // Le code ci-dessous est commenté/supprimé pour désactiver l'auto-save au changement de champ.
    /*
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        // ...
    }, [formData, isConfirmed]);
    */

    // --------- SOUMISSION FINALE ----------
    const submitEnrollment = useCallback(
        async (notes?: string) => {
            if (!uuid) {
                Alert.error('Aucun brouillon à soumettre. Veuillez d\'abord remplir le formulaire.');
                return false;
            }

            setSaveStatus('saving');
            
            // 1. D'abord sauvegarder la progression actuelle pour être sûr
            // On utilise une promesse pour attendre la fin de la sauvegarde
            try {
                console.log('submitEnrollment: Starting preliminary save...');
                await new Promise<void>((resolve, reject) => {
                    const safeSnapshot = JSON.parse(JSON.stringify(minimalSnapshot(formData)));
                    router.post(
                        SAVE_ROUTE,
                        {
                            uuid,
                            last_step: lastStep,
                            form_snapshot: safeSnapshot,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                console.log('submitEnrollment: Preliminary save success');
                                resolve();
                            },
                            onError: (err) => {
                                console.error('submitEnrollment: Preliminary save error', err);
                                reject(new Error('Erreur lors de la sauvegarde préliminaire'));
                            },
                        }
                    );
                });
            } catch (e) {
                console.error('submitEnrollment: Save failed', e);
                setSaveStatus('idle');
                Alert.error('Impossible de sauvegarder les dernières modifications avant soumission.');
                return false;
            }

            // 2. Ensuite soumettre
            console.log('submitEnrollment: Starting final submission...');
            return new Promise<boolean>((resolve, reject) => {
                router.post(
                    SUBMIT_ROUTE(uuid),
                    { notes: notes || '' },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            console.log('submitEnrollment: Submission success');
                            setSaveStatus('saved');
                            Alert.success('Inscription soumise avec succès !');
                            resolve(true);
                        },
                        onError: (errors) => {
                            console.error('submitEnrollment: Submission error', errors);
                            setSaveStatus('idle');
                            // Gérer l'erreur d'unicité spécifique
                            if ((errors as any)?.uniqueness) {
                                Alert.error((errors as any).uniqueness);
                                // Réinitialiser le formulaire en rechargeant la page de création
                                router.visit(window.route('dashboard.enrollments.create'));
                                return;
                            }
                            const errorMsg = (errors as any)?.submit || 'Erreur lors de la soumission';
                            Alert.error(errorMsg);
                            reject(errors);
                        },
                    },
                );
            });
        },
        [uuid, formData, lastStep, minimalSnapshot],
    );

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
