export default function StatsGrid({
    total,
    published,
    drafts,
    categoriesCount,
}: {
    total: number;
    postsCount: number;
    published: number;
    drafts: number;
    categoriesCount: number;
}) {
    const Card = ({ title, value, ring }: { title: string; value: number; ring: string }) => (
        <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
            <div className={`absolute -top-4 -right-4 h-24 w-24 rounded-full ${ring} opacity-70`} />
        </div>
    );
    return (
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Total articles" value={total} ring="bg-indigo-100" />
            <Card title="Publiés" value={published} ring="bg-emerald-100" />
            <Card title="Brouillons" value={drafts} ring="bg-amber-100" />
            <Card title="Catégories" value={categoriesCount} ring="bg-purple-100" />
        </div>
    );
}
