// resources/js/pages/enrollment/hooks/useRequirements.ts
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Requirements } from '../types';

type Params = {
    faculty_id: string;
    level_id: string;
    year_id: string;
};

export function useRequirements(params: Params) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<Requirements>({
        personal_info: [],
        academic_info: [],
        payment: undefined,
    });

    useEffect(() => {
        if (!params.year_id || !params.level_id) {
            setRequirements({ personal_info: [], academic_info: [], payment: undefined });
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const url = '/dashboard/enrollment/requirements';

                const res = await axios.get(url, {
                    params: {
                        faculty_id: params.faculty_id || null,
                        level_id: Number(params.level_id),
                        year_id: Number(params.year_id),
                    },
                    signal: controller.signal,
                });

                const data = res.data;
                if (!data?.ok) {
                    setRequirements({ personal_info: [], academic_info: [], payment: undefined });
                    setError(data?.message || 'Impossible de récupérer les exigences.');
                    return;
                }

                const payload = data.payload as Requirements;
                setRequirements({
                    personal_info: (payload.personal_info ?? []).map((d) => ({
                        key: d.key,
                        label: d.label ?? d.key,
                        required: !!d.required,
                        accept: d.accept ?? 'image/*,.pdf',
                    })),
                    academic_info: (payload.academic_info ?? []).map((d) => ({
                        key: d.key,
                        label: d.label ?? d.key,
                        required: !!d.required,
                        accept: d.accept ?? 'image/*,.pdf',
                    })),
                    payment: payload.payment
                        ? {
                              required: !!payload.payment.required,
                              amount: Number(payload.payment.amount ?? 0),
                              currency: payload.payment.currency ?? 'EUR',
                          }
                        : undefined,
                });
            } catch (e: unknown) {
                if (axios.isCancel?.(e)) return;
                if (axios.isAxiosError(e) && e.response?.status === 422) setError(e.response?.data?.message || 'Année académique non active.');
                else setError('Erreur serveur lors du chargement des exigences.');
                setRequirements({ personal_info: [], academic_info: [], payment: undefined });
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [params.faculty_id, params.level_id, params.year_id]);

    return { requirements, loading, error };
}
