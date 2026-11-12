import { catalogViewKey } from '@/components/system/dossier-navigation';
import { usePage, useRemember } from '@inertiajs/react';

export function useCatalogView<T>(initial: T) {
    return useRemember(initial, catalogViewKey(usePage().url));
}
