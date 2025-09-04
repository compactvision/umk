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
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEdit ? "Modifier l'année académique" : "Créer une nouvelle année académique"}
                    </h2>
                    <button onClick={closeModal} className="modal-close">
                        <span>✕</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">
                            Titre de l'année *<span className="form-help">Ex: 2025-2026</span>
                        </label>
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={(e) => form.setData("title", e.target.value)}
                            className={`form-input ${form.errors.title ? "form-input--error" : ""}`}
                            placeholder="Entrez le titre de l'année..."
                        />
                        {form.errors.title && <div className="form-error">{form.errors.title}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                Date de début *<span className="form-help">Premier jour de l'année</span>
                            </label>
                            <input
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) => form.setData("start_date", e.target.value)}
                                className={`form-input ${form.errors.start_date ? "form-input--error" : ""}`}
                            />
                            {form.errors.start_date && <div className="form-error">{form.errors.start_date}</div>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Date de fin *<span className="form-help">Dernier jour de l'année</span>
                            </label>
                            <input
                                type="date"
                                value={form.data.end_date}
                                onChange={(e) => form.setData("end_date", e.target.value)}
                                className={`form-input ${form.errors.end_date ? "form-input--error" : ""}`}
                            />
                            {form.errors.end_date && <div className="form-error">{form.errors.end_date}</div>}
                        </div>
                    </div>

                    {!isEdit && (
                        <div className="form-info">
                            <div className="info-icon">💡</div>
                            <div className="info-text">
                                L'année sera créée en tant que brouillon. Vous pourrez l'ouvrir une fois configurée.
                            </div>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" onClick={closeModal} className="btn btn--secondary">
                            Annuler
                        </button>
                        <button type="submit" disabled={form.processing} className="btn btn--primary">
                            {form.processing ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    {isEdit ? "Mise à jour en cours..." : "Création en cours..."}
                                </>
                            ) : (
                                <>
                                    <span>✓</span>
                                    {isEdit ? "Mettre à jour" : "Créer l'année"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
