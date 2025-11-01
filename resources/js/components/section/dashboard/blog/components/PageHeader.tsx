export default function PageHeader({ onCreate, onCreateCategory }: { onCreate: () => void; onCreateCategory: () => void }) {
    return (
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">Blog</h1>
                <p className="mt-2 text-slate-600">Gérez et publiez les actualités de l'UMK.</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onCreateCategory}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm hover:shadow-md"
                >
                    Catégorie
                </button>
                <button
                    onClick={onCreate}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 font-medium text-white shadow-lg hover:shadow-xl"
                >
                    Créer un article
                </button>
            </div>
        </div>
    );
}
