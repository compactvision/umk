import Alert from "@/utils/sweetAlert";
import { useForm } from "@inertiajs/react";
import ErrorText from "../UI/ErrorText";

export default function CreateFacultyPopup({ isEdit, closeModal, faculty }: { isEdit: boolean; closeModal: () => void; faculty: any }) {
    const { data, setData, errors, post, put, processing, reset } = useForm({
        id: faculty?.id || '',
        name: faculty?.name || '',
        code: faculty?.code || '',
        description: faculty?.description || '',
        duration_years: faculty?.duration_years || '',
        is_active: faculty?.is_active || true,
    });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            Alert.loading('Mise à jour en cours...');
            put(route('dashboard.admin.faculties.update', data.id), {
                onSuccess: () => {
                    Alert.success('Faculté mise à jour avec succès!');
                    closeModal();
                },
                onError: (error) => {
                    Alert.error(error?.message || "Une erreur s'est produite");
                },
                onFinish: () => {
                    Alert.close();
                },
            });
            reset();
        } else {
            post(route('dashboard.admin.faculties.store'), {
                onSuccess: () => {
                    Alert.success('Faculté créée avec succès!');
                    reset();
                    closeModal();
                },
                onError: (error) => {
                    Alert.error(error?.message || "Une erreur s'est produite");
                },
            });
            reset();
        }
    };

    return (
        <div className="modall" onClick={(e) => e.target.className === 'modal' && closeModal()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isEdit ? data.name : '🏛️ Nouvelle Faculté'}</h2>
                    <p>{isEdit ? 'Modifiez ' : 'Remplissez '} les informations de la faculté</p>
                </div>

                {errors.duplicate && (
                    <div className="form-error-global">{errors.duplicate}</div>
                )}

                {errors.general && (
                    <div className="form-error-global">{errors.general}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nom de la faculté</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Ex: Faculté de Médecine"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <ErrorText error={errors.name} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="code">Code de la faculté</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="Ex: MED"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            maxLength={10}
                            required
                        />
                        <ErrorText error={errors.code} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="duration_years">Durée de la faculté (en années)</label>
                        <input
                            type="number"
                            id="duration_years"
                            name="duration_years"
                            placeholder="4"
                            min="1"
                            max="10"
                            value={data.duration_years}
                            onChange={(e) => setData('duration_years', e.target.value)}
                            required
                        />
                        <ErrorText error={errors.duration_years} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Courte présentation de la faculté"
                            rows={7}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        ></textarea>
                        <ErrorText error={errors.description} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Status</label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                className="toggle-switch__checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <span className="toggle-switch__slider"></span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={processing}>
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={processing}>
                            {processing ? (isEdit ? 'Mise à jour...' : 'Création...') : isEdit ? 'Mettre à jour la faculté' : 'Créer la faculté'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
