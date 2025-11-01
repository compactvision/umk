// pages/Blog/Index.tsx
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { Head, Link } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { PageProps } from './types';
import { usePostFilters } from './hooks/usePostFilters';
import { useCreatePost } from './hooks/useCreatePost';
import { useCreateCategory } from './hooks/useCreateCategory';
import Notification from './components/Notification';
import PageHeader from './components/PageHeader';
import FiltersSection from './components/FiltersSection';
import StatsGrid from './components/StatsGrid';
import ArticleCard from './components/ArticleCard';
import EmptyState from './components/EmptyState';
import Pagination from './components/Pagination';
import CreatePostModal from './components/CreatePostModal';
import CreateCategoryModal from './components/CreateCategoryModal';

export default function Index(props: PageProps) {
    const { categories, posts, filters, flash } = props;
    const [showCreate, setShowCreate] = useState(false);
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [showNotifications, setShowNotifications] = useState(true);

    const filterHandlers = usePostFilters(filters);
    const postForm = useCreatePost(() => setShowCreate(false));
    const categoryForm = useCreateCategory(() => setShowCreateCategory(false));

    useEffect(() => {
        if (flash?.success || flash?.error) {
            const timer = setTimeout(() => setShowNotifications(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    return (
        <Dashboard>
            <Head title="Blog" />

            <Notification
                show={showNotifications}
                flash={flash}
                onClose={() => setShowNotifications(false)}
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
                    <PageHeader
                        onCreatePost={() => setShowCreate(true)}
                        onCreateCategory={() => setShowCreateCategory(true)}
                    />

                    <FiltersSection
                        categories={categories}
                        filters={filterHandlers}
                    />

                    <StatsGrid posts={posts} categories={categories} />

                    <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <ArticleCard key={post.id} post={post} />
                        ))}
                    </div>

                    {posts.data.length === 0 && (
                        <EmptyState onCreatePost={() => setShowCreate(true)} />
                    )}

                    {posts.data.length > 0 && <Pagination links={posts.links} />}
                </div>
            </div>

            <CreatePostModal
                show={showCreate}
                categories={categories}
                form={postForm}
                onClose={() => {
                    setShowCreate(false);
                    postForm.reset();
                }}
            />

            <CreateCategoryModal
                show={showCreateCategory}
                form={categoryForm}
                onClose={() => {
                    setShowCreateCategory(false);
                    categoryForm.reset();
                }}
            />
        </Dashboard>
    );
}