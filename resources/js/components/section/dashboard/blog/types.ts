// pages/Blog/types.ts
export type Category = {
    id: number;
    name: string;
    color?: string;
    description?: string;
};

export type Post = {
    id: number;
    uuid: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    main_image_1?: string | null;
    main_image_2?: string | null;
    views: number;
    likes: number;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    published_at?: string | null;
    category?: { id: number; name: string; color?: string } | null;
    author?: { id: number; name: string } | null;
    created_at: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Pagination<T> = {
    data: T[];
    links: PaginationLink[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export type PageProps = {
    categories: Category[];
    posts: Pagination<Post>;
    filters?: { q?: string; category_id?: string; status?: string };
    flash?: { success?: string; error?: string };
};

export type PostFormData = {
    title: string;
    category_id: string | number | null;
    excerpt: string;
    content: string;
    read_time: string;
    gradient: string;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    published_at: string;
    main_image_1: File | null;
    main_image_2: File | null;
    gallery: File[];
    tags: string;
};

export type CategoryFormData = {
    name: string;
    color: string;
    description: string;
};