import AdminModal from '@/components/admin/AdminModal';
import { slotRange } from '@/lib/scheduleCalendar';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import '../../../../css/dashboard/schedule.css';
import { messages, type LevelReview } from './types';

const weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const firstSlot = { weekday: 1, start_time: '08:00', end_time: '10:00', room: '' };

export default function WeeklyScheduleForm({
    offerings,
    semesterId,
    initialSlot,
    onClose,
    onSaved,
}: {
    offerings: LevelReview['schedule'];
    semesterId: number;
    initialSlot?: { day: string; minute: number };
    onClose: () => void;
    onSaved: (levels: LevelReview[]) => void;
}) {
    const range = initialSlot && slotRange(initialSlot.day, initialSlot.minute, Math.min(60, 1439 - initialSlot.minute));
    const slot =
        initialSlot && range
            ? {
                  weekday: new Date(`${initialSlot.day}T12:00:00Z`).getUTCDay() || 7,
                  start_time: range.starts_at.slice(11),
                  end_time: range.ends_at.slice(11),
                  room: '',
              }
            : firstSlot;
    const form = useForm({ academic_offering_id: '', semester_id: semesterId, slots: [slot], is_published: false });

    function changeSlot(index: number, values: Partial<typeof firstSlot>) {
        form.setData(
            'slots',
            form.data.slots.map((slot, position) => (position === index ? { ...slot, ...values } : slot)),
        );
    }

    return (
        <AdminModal
            title="Planifier un cours pour le semestre"
            description="Choisissez le cours puis ses jours et heures à Kinshasa. Un créneau le lundi est répété tous les lundis du semestre du cours."
            formId="curriculum-weekly-schedule"
            submitLabel="Enregistrer le brouillon"
            onClose={onClose}
            busy={form.processing}
            errors={messages(form.errors)}
            wide
        >
            <form
                id="curriculum-weekly-schedule"
                className="admin-modal-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('dashboard.admin.schedule.semester'), {
                        preserveScroll: true,
                        onSuccess: (page) => {
                            onSaved((page.props.levelWorkspace as LevelReview[] | undefined) ?? []);
                            onClose();
                        },
                    });
                }}
            >
                <label className="admin-field">
                    Cours *
                    <select
                        required
                        value={form.data.academic_offering_id}
                        onChange={(event) => form.setData('academic_offering_id', event.target.value)}
                    >
                        <option value="">Sélectionner un cours</option>
                        {offerings.map((offering) => (
                            <option key={offering.id} value={offering.id}>
                                {offering.course} · {offering.audience}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="schedule-slots">
                    {form.data.slots.map((slot, index) => (
                        <fieldset key={index} className="schedule-slot-row">
                            <legend>Créneau {index + 1}</legend>
                            <div className="schedule-slot-fields">
                                <label className="admin-field">
                                    Jour *
                                    <select value={slot.weekday} onChange={(event) => changeSlot(index, { weekday: Number(event.target.value) })}>
                                        {weekdays.map((day, position) => (
                                            <option key={day} value={position + 1}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="admin-field">
                                    Début *
                                    <input
                                        type="time"
                                        required
                                        value={slot.start_time}
                                        onChange={(event) => changeSlot(index, { start_time: event.target.value })}
                                    />
                                </label>
                                <label className="admin-field">
                                    Fin *
                                    <input
                                        type="time"
                                        required
                                        min={slot.start_time}
                                        value={slot.end_time}
                                        onChange={(event) => changeSlot(index, { end_time: event.target.value })}
                                    />
                                </label>
                                <label className="admin-field">
                                    Salle (facultatif)
                                    <input maxLength={180} value={slot.room} onChange={(event) => changeSlot(index, { room: event.target.value })} />
                                </label>
                            </div>
                            {form.data.slots.length > 1 && (
                                <button
                                    type="button"
                                    className="calendar-delete"
                                    onClick={() =>
                                        form.setData(
                                            'slots',
                                            form.data.slots.filter((_, position) => position !== index),
                                        )
                                    }
                                >
                                    <Trash2 size={14} aria-hidden="true" /> Retirer ce créneau
                                </button>
                            )}
                        </fieldset>
                    ))}
                    <button
                        type="button"
                        className="admin-secondary"
                        disabled={form.data.slots.length >= 21}
                        onClick={() => {
                            const previous = form.data.slots[form.data.slots.length - 1];
                            form.setData('slots', [...form.data.slots, { ...firstSlot, weekday: (previous.weekday % 7) + 1 }]);
                        }}
                    >
                        <Plus size={15} aria-hidden="true" /> Ajouter un créneau
                    </button>
                </div>
            </form>
        </AdminModal>
    );
}
