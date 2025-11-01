import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

export function usePostFilters(initialFilters?: {
    q?: string;
    category_id?: string;
    status?: string;
}) {
    const [q, setQ] = useState(initialFilters?.q ?? '');
    const [categoryId, setCategoryId] = useState(initialFilters?.category_id ?? '');
    const [status, setStatus] = useState(initialFilters?.status ?? '');
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useMemo(
        () =>
            debounce((value: string) => {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (value) params.set('q', value);
                if (categoryId) params.set('category_id', String(categoryId));
                if (status) params.set('status', status);

                window.location.href =
                    route('dashboard.admin.posts.index') +
                    (params.toString() ? `?${params.toString()}` : '');
            }, 500),
        [categoryId, status]
    );

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setQ(e.target.value);
            debouncedSearch(e.target.value);
        },
        [debouncedSearch]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (categoryId) params.set('category_id', String(categoryId));
        if (status) params.set('status', status);

        window.location.href =
            route('dashboard.admin.posts.index') +
            (params.toString() ? `?${params.toString()}` : '');
    };

    return {
        q,
        categoryId,
        status,
        isLoading,
        setQ,
        setCategoryId,
        setStatus,
        handleSearchChange,
        handleSubmit,
    };
}