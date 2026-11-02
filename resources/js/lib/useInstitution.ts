import { usk } from '@/lib/usk';
import { usePage } from '@inertiajs/react';
export function useInstitution() {
    const { publicSettings } = usePage<{ publicSettings?: { identity?: Partial<typeof usk> } }>().props;
    return { ...usk, ...publicSettings?.identity };
}
