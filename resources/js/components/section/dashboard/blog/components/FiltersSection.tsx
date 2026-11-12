import { debounce } from 'lodash';
import React, { useMemo } from 'react';
import { Category } from '../types';

export default function FiltersSection({
    q,
    setQ,
    categoryId,
    setCategoryId,
    status,
    setStatus,
    indexRouteName,
    categories,
}: {
    q: string;
    setQ: (v: string) => void;
    categoryId: string;
    setCategoryId: (v: string) => void;
    status: string;
    setStatus: (v: string) => void;
    indexRouteName: string;
    categories: Category[];
}) {
    const debounced = useMemo(
        () =>
            debounce((params: URLSearchParams) => {
                window.location.href = route(indexRouteName) + (params.toString() ? `?${params.toString()}` : '');
            }, 500),
        [indexRouteName],
    );

    const onSearch = (value: string) => {
        setQ(value);
        const p = new URLSearchParams();
        if (value) p.set('q', value);
        if (categoryId) p.set('category_id', String(categoryId));
        if (status) p.set('status', status);
        debounced(p);
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q) p.set('q', q);
        if (categoryId) p.set('category_id', String(categoryId));
        if (status) p.set('status', status);
        window.location.href = route(indexRouteName) + (p.toString() ? `?${p.toString()}` : '');
    };

    return (
        <div className="mb-8 rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <input
                    value={q}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Rechercher par titre, extrait…"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="">Toutes les catégories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="flex gap-2 md:col-span-2">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 px-4 text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="draft">Brouillon</option>
                        <option value="published">Publié</option>
                        <option value="archived">Archivé</option>
                    </select>
                    <button
                        type="submit"
                        className="h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 font-medium text-white shadow-lg hover:shadow-xl"
                    >
                        Filtrer
                    </button>
                </div>
            </form>
        </div>
    );
}
