import Pagination from '@/components/admin/Pagination';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { dateLabel, localDate, time } from '@/lib/scheduleDates';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarClock, CalendarX, DoorOpen, MapPin, Pencil, Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import '../../../../css/dashboard/schedule-resources.css';
import '../../../../css/dashboard/student-academic.css';
import '../../../../css/student-portal.css';
import AcademicForm, { type FormSpec } from '../studentAcademic/AcademicForm';

type Room = {
    id: number;
    code: string;
    name: string;
    campus: string;
    building: string;
    capacity: number;
    type: string;
    equipment: string | null;
    instructions: string | null;
    is_active: boolean;
};
type Block = {
    id: number;
    starts_at: string;
    ends_at: string;
    reason: string;
    released_at: string | null;
    room: Pick<Room, 'code' | 'name'> | null;
    professor: Person | null;
};
type Person = { id: number; first_name: string; last_name: string };
export default function Resources({
    rooms,
    blocks,
    professors,
    q,
}: {
    rooms: { data: Room[]; total: number };
    blocks: { data: Block[]; total: number };
    professors: Person[];
    q: string;
}) {
    const [modal, setModal] = useState<FormSpec | null>(null);
    const [search, setSearch] = useState(q);
    const { flash } = usePage<{ flash?: { success?: string } }>().props;
    const roomForm = (room?: Room) =>
        setModal({
            title: room ? 'Modifier la salle' : 'Ajouter une salle',
            description: 'Renseignez sa localisation et sa capacité autorisée.',
            method: room ? 'put' : 'post',
            action: room ? route('dashboard.admin.schedule.rooms.update', room.id) : route('dashboard.admin.schedule.rooms.store'),
            fields: [
                { name: 'code', label: 'Code unique', value: room?.code, required: true },
                { name: 'name', label: 'Nom', value: room?.name, required: true },
                { name: 'campus', label: 'Campus', value: room?.campus, required: true },
                { name: 'building', label: 'Bâtiment', value: room?.building, required: true },
                { name: 'capacity', label: 'Capacité', type: 'number', value: room?.capacity, required: true },
                { name: 'type', label: 'Type de salle', value: room?.type, required: true },
                { name: 'equipment', label: 'Équipements', type: 'textarea', value: room?.equipment },
                { name: 'instructions', label: 'Contraintes d’utilisation', type: 'textarea', value: room?.instructions },
                { name: 'is_active', label: 'Salle active', type: 'checkbox', value: room?.is_active ?? true },
            ],
        });
    const blockForm = (room?: Room) =>
        setModal({
            title: 'Déclarer une indisponibilité',
            description: 'Le créneau sera vérifié contre les séances existantes. Heures de Kinshasa.',
            action: route('dashboard.admin.schedule.blocks.store'),
            fields: [
                ...(room
                    ? []
                    : [
                          {
                              name: 'professor_id',
                              label: 'Enseignant',
                              type: 'select',
                              required: true,
                              options: professors.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` })),
                          },
                      ]),
                { name: 'starts_at', label: 'Début', type: 'datetime-local', required: true },
                { name: 'ends_at', label: 'Fin', type: 'datetime-local', required: true },
                { name: 'reason', label: 'Motif', type: 'textarea', required: true },
            ],
            values: room ? { academic_room_id: room.id } : {},
        });
    return (
        <Dashboard hideAppsNavigation>
            <Head title="Salles et disponibilités" />
            {modal && <AcademicForm spec={modal} onClose={() => setModal(null)} onSuccess={() => setModal(null)} />}
            <main className="student-portal academic-administration schedule-resources">
                <header className="rooms-heading">
                    <div>
                        <Link className="rooms-back" href={route('dashboard.admin.schedule.index')}>
                            <ArrowLeft size={16} aria-hidden="true" /> Retour au calendrier
                        </Link>
                        <h1>Salles et disponibilités</h1>
                    </div>
                    <button type="button" className="rooms-button is-primary" onClick={() => roomForm()}>
                        <Plus size={17} aria-hidden="true" /> Ajouter une salle
                    </button>
                </header>
                {flash?.success && (
                    <p role="status" className="portal-alert">
                        {flash.success}
                    </p>
                )}
                <div className="rooms-workspace">
                    <section className="rooms-panel" aria-labelledby="rooms-directory">
                        <header className="rooms-section-heading">
                            <span className="rooms-section-icon">
                                <Building2 size={19} aria-hidden="true" />
                            </span>
                            <h2 id="rooms-directory">Répertoire des salles</h2>
                            <span className="rooms-count">{rooms.total}</span>
                        </header>
                        <form
                            className="rooms-search"
                            onSubmit={(event) => {
                                event.preventDefault();
                                router.get(route('dashboard.admin.schedule.resources'), { q: search.trim() || undefined }, { preserveScroll: true });
                            }}
                        >
                            <label htmlFor="rooms-query" className="sr-only">
                                Rechercher par nom, code ou campus
                            </label>
                            <div className="rooms-search-input">
                                <Search size={17} aria-hidden="true" />
                                <input
                                    id="rooms-query"
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Nom, code ou campus"
                                />
                            </div>
                            <button className="rooms-button" type="submit">
                                Rechercher
                            </button>
                            {q && (
                                <Link className="rooms-button" href={route('dashboard.admin.schedule.resources')}>
                                    Effacer
                                </Link>
                            )}
                        </form>
                        {rooms.data.length ? (
                            <div className="rooms-card-grid">
                                {rooms.data.map((room) => (
                                    <article className="rooms-card" key={room.id}>
                                        <div className="rooms-card-top">
                                            <span className="rooms-code">
                                                <DoorOpen size={15} aria-hidden="true" /> {room.code}
                                            </span>
                                            <span className="rooms-status" data-tone={room.is_active ? 'green' : 'neutral'}>
                                                {room.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <h3>{room.name}</h3>
                                        <p className="rooms-location">
                                            <MapPin size={15} aria-hidden="true" /> {room.campus} · {room.building}
                                        </p>
                                        <div className="rooms-card-facts">
                                            <span>
                                                <Users size={16} aria-hidden="true" /> {room.capacity} {room.capacity === 1 ? 'place' : 'places'}
                                            </span>
                                            <span>{room.type}</span>
                                        </div>
                                        {(room.equipment || room.instructions) && (
                                            <dl className="rooms-notes">
                                                {room.equipment && (
                                                    <div>
                                                        <dt>Équipements</dt>
                                                        <dd>{room.equipment}</dd>
                                                    </div>
                                                )}
                                                {room.instructions && (
                                                    <div>
                                                        <dt>Conditions d’utilisation</dt>
                                                        <dd>{room.instructions}</dd>
                                                    </div>
                                                )}
                                            </dl>
                                        )}
                                        <div className="rooms-actions">
                                            <button type="button" className="rooms-button" onClick={() => roomForm(room)}>
                                                <Pencil size={15} aria-hidden="true" /> Modifier
                                            </button>
                                            <button type="button" className="rooms-button is-tinted" onClick={() => blockForm(room)}>
                                                <CalendarX size={15} aria-hidden="true" /> Bloquer un créneau
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rooms-empty">
                                <DoorOpen size={26} aria-hidden="true" />
                                <strong>{q ? 'Aucune salle ne correspond à la recherche' : 'Aucune salle enregistrée'}</strong>
                                {!q && (
                                    <button type="button" className="rooms-button" onClick={() => roomForm()}>
                                        Ajouter une salle
                                    </button>
                                )}
                            </div>
                        )}
                        <Pagination value={rooms} />
                    </section>
                    <section className="rooms-panel rooms-blocks" aria-labelledby="rooms-unavailability">
                        <header className="rooms-section-heading">
                            <span className="rooms-section-icon">
                                <CalendarClock size={19} aria-hidden="true" />
                            </span>
                            <h2 id="rooms-unavailability">Indisponibilités</h2>
                            <span className="rooms-count">{blocks.total}</span>
                        </header>
                        <p className="rooms-timezone">Heure de Kinshasa · UTC+1</p>
                        <button type="button" className="rooms-button is-tinted" onClick={() => blockForm()}>
                            <Plus size={16} aria-hidden="true" /> Indisponibilité d’un enseignant
                        </button>
                        {blocks.data.length ? (
                            <ul className="rooms-block-list">
                                {blocks.data.map((block) => {
                                    const day = localDate(block.starts_at);
                                    const endDay = localDate(block.ends_at);

                                    return (
                                        <li key={block.id}>
                                            <div className="rooms-block-heading">
                                                <h3>
                                                    {block.room
                                                        ? `${block.room.code} · ${block.room.name}`
                                                        : [block.professor?.first_name, block.professor?.last_name].filter(Boolean).join(' ') ||
                                                          'Enseignant'}
                                                </h3>
                                                <span className="rooms-status" data-tone={block.released_at ? 'neutral' : 'amber'}>
                                                    {block.released_at ? 'Libérée' : 'Bloquée'}
                                                </span>
                                            </div>
                                            <p className="rooms-block-time">
                                                <time dateTime={block.starts_at}>
                                                    {dateLabel(day)} · {time(block.starts_at)}
                                                </time>
                                                {' → '}
                                                <time dateTime={block.ends_at}>
                                                    {endDay !== day && `${dateLabel(endDay)} · `}
                                                    {time(block.ends_at)}
                                                </time>
                                            </p>
                                            <p className="rooms-block-reason">{block.reason}</p>
                                            {!block.released_at && (
                                                <button
                                                    type="button"
                                                    className="rooms-button"
                                                    onClick={() =>
                                                        setModal({
                                                            title: 'Libérer le créneau',
                                                            description: 'Le créneau redeviendra disponible pour la planification.',
                                                            action: route('dashboard.admin.schedule.blocks.release', block.id),
                                                            fields: [],
                                                        })
                                                    }
                                                >
                                                    Libérer le créneau
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="rooms-empty">
                                <CalendarClock size={24} aria-hidden="true" />
                                <strong>Aucune indisponibilité enregistrée</strong>
                            </div>
                        )}
                        <Pagination value={blocks} />
                    </section>
                </div>
            </main>
        </Dashboard>
    );
}
