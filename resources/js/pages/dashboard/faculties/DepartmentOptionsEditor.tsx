import AdminModal from '@/components/admin/AdminModal';
import Alert from '@/utils/sweetAlert';
import { useForm } from '@inertiajs/react';
import type { Row } from '../academicStructure/types';

export type OrientationLevel = {
    id: number;
    title: string;
    code: string;
    department_options: { id: number; name: string }[];
};

export default function DepartmentOptionsEditor({
    level,
    departments,
    onClose,
}: {
    level: OrientationLevel;
    departments: Row[];
    onClose: () => void;
}) {
    const savedIds = level.department_options.map((department) => department.id);
    const form = useForm({ department_ids: savedIds });

    return (
        <AdminModal
            title={`Choix de département · ${level.title}`}
            description="Les étudiants inscrits à ce niveau pourront choisir parmi les départements cochés. Laissez la liste vide pour un niveau sans choix de département."
            formId="department-options"
            submitLabel="Enregistrer les choix"
            onClose={onClose}
            busy={form.processing}
            errors={form.errors}
        >
            <form
                id="department-options"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(route('dashboard.admin.academic-structure.department-options.update', level.id), {
                        preserveScroll: true,
                        onSuccess: () => {
                            Alert.success('Choix de département enregistrés.');
                            onClose();
                        },
                    });
                }}
            >
                <fieldset className="grid gap-3" disabled={form.processing}>
                    <legend className="mb-2 font-semibold">Départements proposés</legend>
                    {departments
                        .filter((department) => department.is_active || savedIds.includes(department.id))
                        .map((department) => (
                            <label className="flex items-center gap-2" key={department.id}>
                                <input
                                    type="checkbox"
                                    checked={form.data.department_ids.includes(department.id)}
                                    onChange={(event) =>
                                        form.setData(
                                            'department_ids',
                                            event.target.checked
                                                ? [...form.data.department_ids, department.id]
                                                : form.data.department_ids.filter((id) => id !== department.id),
                                        )
                                    }
                                />
                                {department.name}
                                {!department.is_active && ' (inactif)'}
                            </label>
                        ))}
                </fieldset>
            </form>
        </AdminModal>
    );
}
