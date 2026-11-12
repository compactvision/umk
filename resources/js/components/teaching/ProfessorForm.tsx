import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import type { Professor } from './types';

export default function ProfessorForm({
    professor,
    canInvite = false,
    onClose,
}: {
    professor?: Professor;
    canInvite?: boolean;
    onClose: () => void;
}) {
    const form = useForm({
        first_name: professor?.first_name ?? '',
        last_name: professor?.last_name ?? '',
        email: professor?.email ?? '',
        phone: professor?.phone ?? '',
        speciality: professor?.speciality ?? '',
        biography: professor?.biography ?? '',
        is_active: professor?.is_active ?? true,
        send_invitation: false,
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (professor) form.put(route('dashboard.admin.professors.update', professor.id), options);
        else {
            form.transform((data) => ({ ...data, send_invitation: canInvite && data.is_active && data.send_invitation }));
            form.post(route('dashboard.admin.professors.store'), options);
        }
    };
    return (
        <AdminModal
            title={professor ? 'Modifier l’enseignant' : 'Ajouter un enseignant'}
            description="Renseignez les coordonnées et la spécialité de l’enseignant."
            formId="professor-form"
            submitLabel={!professor && form.data.is_active && form.data.send_invitation ? 'Enregistrer et inviter' : 'Enregistrer'}
            onClose={onClose}
            busy={form.processing}
            errors={form.errors}
        >
            <form id="professor-form" onSubmit={submit} className="admin-modal-form">
                <label>
                    Prénom *
                    <input
                        required
                        maxLength={100}
                        autoComplete="given-name"
                        value={form.data.first_name}
                        onChange={(e) => form.setData('first_name', e.target.value)}
                    />
                </label>
                <label>
                    Nom *
                    <input
                        required
                        maxLength={100}
                        autoComplete="family-name"
                        value={form.data.last_name}
                        onChange={(e) => form.setData('last_name', e.target.value)}
                    />
                </label>
                <label>
                    Email *
                    <input
                        type="email"
                        required
                        maxLength={255}
                        autoComplete="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                </label>
                <label>
                    Téléphone
                    <input type="tel" maxLength={20} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                </label>
                <label>
                    Spécialité
                    <input maxLength={255} value={form.data.speciality} onChange={(e) => form.setData('speciality', e.target.value)} />
                </label>
                <label>
                    Biographie
                    <textarea rows={3} maxLength={5000} value={form.data.biography} onChange={(e) => form.setData('biography', e.target.value)} />
                </label>
                <label className="teaching-checkbox">
                    <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} /> Enseignant
                    actif
                </label>
                {!professor && canInvite && form.data.is_active && (
                    <label className="teaching-checkbox">
                        <input
                            type="checkbox"
                            checked={form.data.send_invitation}
                            onChange={(e) => form.setData('send_invitation', e.target.checked)}
                        />
                        Envoyer l’invitation par e-mail
                    </label>
                )}
                {professor && (
                    <p className="teaching-help">
                        Un enseignant inactif conserve ses affectations existantes et ne peut plus recevoir de nouvelle affectation.
                    </p>
                )}
            </form>
        </AdminModal>
    );
}
