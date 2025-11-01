// pages/Blog/hooks/useCreateCategory.ts
import { useForm } from '@inertiajs/react';
import { CategoryFormData } from '../types';

export function useCreateCategory(onSuccess: () => void) {
    const form = useForm<CategoryFormData>({
        name: '',
        color: '#6366f1',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('dashboard.admin.categories.store'), {
            onSuccess: () => {
                form.reset();
                onSuccess();
            },
        });
    };

    return { ...form, submit };
}
