import { dateLabel, localDate, localInput, time } from '@/lib/scheduleDates';
import { useState } from 'react';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';

export type RoomChoice = { id: number; code: string; name: string; capacity: number; is_active: boolean };
export type SessionState = {
    id: number;
    starts_at: string;
    ends_at: string;
    room: string;
    academic_room_id?: number | null;
    is_published: boolean;
    validated_at?: string | null;
    cancelled_at?: string | null;
    change_reason?: string | null;
    successor?: { starts_at: string } | null;
    replaces_session_id?: number | null;
    activity_type?: string | null;
    recurrence_id?: string | null;
};
export const sessionLabel = (session: SessionState) => {
    if (session.cancelled_at) return session.successor ? 'Reportée' : 'Annulée';
    if (session.is_published) return 'Publiée';
    return session.validated_at ? 'Validée' : 'Brouillon';
};

export default function SessionActions({ session, rooms, close }: { session: SessionState; rooms: RoomChoice[]; close: () => void }) {
    const [spec, setSpec] = useState<FormSpec | null>(null);
    const show = (action: string, title: string) =>
        setSpec({
            title,
            description: 'La décision est contrôlée et inscrite dans l’historique du planning.',
            action: route('dashboard.admin.schedule.transition', session.id),
            values: { action },
            fields: [
                ...(action === 'reschedule'
                    ? [
                          {
                              name: 'starts_at',
                              label: 'Nouveau début (Kinshasa)',
                              type: 'datetime-local',
                              value: localInput(session.starts_at),
                              required: true,
                          },
                          {
                              name: 'ends_at',
                              label: 'Nouvelle fin (Kinshasa)',
                              type: 'datetime-local',
                              value: localInput(session.ends_at),
                              required: true,
                          },
                          {
                              name: 'academic_room_id',
                              label: 'Salle du référentiel',
                              type: 'select',
                              value: session.academic_room_id,
                              options: rooms.filter((r) => r.is_active).map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })),
                          },
                          { name: 'room', label: 'Libellé hors référentiel', value: session.room },
                      ]
                    : []),
                { name: 'reason', label: 'Motif', type: 'textarea', required: true },
            ],
        });
    return (
        <>
            {spec && <AcademicForm spec={spec} onClose={() => setSpec(null)} onSuccess={close} />}
            {session.activity_type && <p>{session.activity_type}</p>}
            {session.change_reason && <p>Motif enregistré · {session.change_reason}</p>}
            {session.successor && (
                <p>
                    Nouveau créneau · {dateLabel(localDate(session.successor.starts_at))} à {time(session.successor.starts_at)}
                </p>
            )}
            {!session.cancelled_at && (
                <div className="teaching-inline-actions">
                    {!session.is_published && (
                        <button
                            type="button"
                            className="admin-secondary"
                            onClick={() =>
                                show(session.validated_at ? 'publish' : 'validate', session.validated_at ? 'Publier la séance' : 'Valider la séance')
                            }
                        >
                            {session.validated_at ? 'Publier' : 'Valider'}
                        </button>
                    )}
                    {new Date(session.starts_at) > new Date() && (
                        <>
                            <button type="button" className="admin-secondary" onClick={() => show('reschedule', 'Reporter la séance')}>
                                Reporter
                            </button>
                            <button type="button" className="admin-secondary" onClick={() => show('cancel', 'Annuler la séance')}>
                                Annuler
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
