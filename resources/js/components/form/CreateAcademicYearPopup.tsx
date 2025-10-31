import Alert from "@/utils/sweetAlert";
import { useForm } from "@inertiajs/react";

type AcademicYear = {
    id?: number;
    title: string;
    start_date: string;
    end_date: string;
    status?: "draft" | "open" | "closed";
};

export default function CreateOrEditAcademicYearPopup({
    closeModal,
    academicYear = null, // si null → création, sinon édition
}: {
    closeModal: () => void;
    academicYear?: AcademicYear | null;
}) {
    const isEdit = !!academicYear;

    const form = useForm({
        title: academicYear?.title || "",
        start_date: academicYear?.start_date || "",
        end_date: academicYear?.end_date || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        Alert.loading(isEdit ? "Mise à jour en cours..." : "Création en cours...");

        const routeName = isEdit
            ? route("dashboard.admin.academic-years.update", academicYear?.id)
            : route("dashboard.admin.academic-years.store");

        const method = isEdit ? form.put : form.post;

        method(routeName, {
            onSuccess: () => {
                Alert.success(
                    isEdit ? "Année académique mise à jour avec succès" : "Année académique créée avec succès"
                );
                form.reset();
                closeModal();
            },
            onError: () => {
                Alert.error(
                    isEdit
                        ? "Une erreur est survenue lors de la mise à jour"
                        : "Une erreur est survenue lors de la création"
                );
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEdit ? "Modifier l'année académique" : "Créer une nouvelle année académique"}
                    </h2>
                    <button 
                        onClick={closeModal} 
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 flex items-center justify-center transition-all duration-200"
                    >
                        <span>✕</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre de l'année <span className="text-red-500">*</span>
                            <span className="block text-xs text-gray-500 mt-1">Ex: 2025-2026</span>
                        </label>
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={(e) => form.setData("title", e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors duration-200 ${
                                form.errors.title 
                                    ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="Entrez le titre de l'année..."
                        />
                        {form.errors.title && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                </svg>
                                {form.errors.title}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de début <span className="text-red-500">*</span>
                                <span className="block text-xs text-gray-500 mt-1">Premier jour de l'année</span>
                            </label>
                            <input
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) => form.setData("start_date", e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors duration-200 ${
                                    form.errors.start_date 
                                        ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                            />
                            {form.errors.start_date && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                    {form.errors.start_date}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de fin <span className="text-red-500">*</span>
                                <span className="block text-xs text-gray-500 mt-1">Dernier jour de l'année</span>
                            </label>
                            <input
                                type="date"
                                value={form.data.end_date}
                                onChange={(e) => form.setData("end_date", e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors duration-200 ${
                                    form.errors.end_date 
                                        ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                            />
                            {form.errors.end_date && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                    {form.errors.end_date}
                                </div>
                            )}
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xl">💡</div>
                            <div className="text-sm text-blue-700">
                                L'année sera créée en tant que brouillon. Vous pourrez l'ouvrir une fois configurée.
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button 
                            type="button" 
                            onClick={closeModal} 
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            disabled={form.processing} 
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {form.processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 rounded-full border-t-white animate-spin"></div>
                                    <span>{isEdit ? "Mise à jour en cours..." : "Création en cours..."}</span>
                                </>
                            ) : (
                                <>
                                    <span>✓</span>
                                    <span>{isEdit ? "Mettre à jour" : "Créer l'année"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}