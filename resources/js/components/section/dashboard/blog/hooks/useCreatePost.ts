import { useForm } from '@inertiajs/react';
import { PostFormData } from '../types';

export function useCreatePost(onSuccess: () => void) {
    const form = useForm<PostFormData>({
        title: '',
        category_id: '',
        excerpt: '',
        content: '',
        read_time: '',
        gradient: '',
        featured: false,
        status: 'draft',
        published_at: '',
        main_image_1: null,
        main_image_2: null,
        gallery: [],
        tags: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => d);
        form.post(route('dashboard.admin.posts.store'), {
            forceFormData: true,
            onSuccess,
        });
    };

    return { ...form, submit };
}


