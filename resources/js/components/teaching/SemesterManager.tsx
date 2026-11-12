import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import { CalendarDays, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Year } from './types';

export type Semester = { id: number; academic_year_id: number; number: number; start_date: string; end_date: string };
const label = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'Africa/Kinshasa', day: 'numeric', month: 'long', year: 'numeric' });

function SemesterForm({ year, number, existing, onClose }: { year: Year; number: number; existing?: Semester; onClose: () => void }) {
    const first = year.start_date!.slice(0, 7);
    const last = year.end_date!.slice(0, 7);
    const start = new Date(`${first}-01T12:00:00Z`);
    const end = new Date(`${last}-01T12:00:00Z`);
    const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1;
    const split = new Date(start);
    split.setUTCMonth(split.getUTCMonth() + Math.ceil(months / 2));
    const previous = new Date(split);
    previous.setUTCMonth(previous.getUTCMonth() - 1);
    const form = useForm({
        academic_year_id: year.id,
        number,
        start_month: existing?.start_date.slice(0, 7) ?? (number === 1 ? first : split.toISOString().slice(0, 7)),
        end_month: existing?.end_date.slice(0, 7) ?? (number === 1 ? previous.toISOString().slice(0, 7) : last),
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(route('dashboard.admin.schedule.semesters.store'), { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <AdminModal
            title={`${existing ? 'Modifier' : 'Définir'} le ${number === 1 ? '1er' : '2e'} semestre`}
            description={`Année ${year.title} : du ${label(year.start_date!)} au ${label(year.end_date!)}.`}
            formId="semester-period-form"
            submitLabel="Enregistrer la période"
            busy={form.processing}
            errors={form.errors}
            onClose={onClose}
        >
            <form id="semester-period-form" className="admin-modal-form" onSubmit={submit}>
                <div className="schedule-period-fields">
                    <label>
                        Mois de début *
                        <input
                            type="month"
                            required
                            min={first}
                            max={last}
                            value={form.data.start_month}
                            onChange={(event) => form.setData('start_month', event.target.value)}
                        />
                    </label>
                    <label>
                        Mois de fin *
                        <input
                            type="month"
                            required
                            min={form.data.start_month || first}
                            max={last}
                            value={form.data.end_month}
                            onChange={(event) => form.setData('end_month', event.target.value)}
                        />
                    </label>
                </div>
                <p className="teaching-help">
                    Les mois de début et de fin sont inclus. Les dates sont ajustées aux limites exactes de l’année académique. Ces périodes seront
                    utilisées pour tous les niveaux.
                </p>
                {existing && (
                    <p className="teaching-help">
                        Les séances déjà créées sont conservées. Une réduction de période sera refusée si elle exclut des séances existantes.
                    </p>
                )}
            </form>
        </AdminModal>
    );
}

export default function SemesterManager({ year, semesters }: { year?: Year; semesters: Semester[] }) {
    const [editing, setEditing] = useState<number | null>(null);
    if (!year?.start_date || !year.end_date)
        return <p className="teaching-help">Créez une année académique et définissez ses dates avant de préparer les semestres.</p>;
    const periods = semesters.filter((semester) => semester.academic_year_id === year.id);
    return (
        <section className="semester-manager" aria-label="Périodes des semestres">
            <header>
                <div>
                    <h2>Les semestres · {year.title}</h2>
                    <p>Les dates s’appliquent à tous les niveaux de cette année.</p>
                </div>
                <small>
                    {label(year.start_date)} — {label(year.end_date)}
                </small>
            </header>
            <div className="semester-period-grid">
                {[1, 2].map((number) => {
                    const period = periods.find((item) => item.number === number);
                    return (
                        <article key={number}>
                            <CalendarDays size={22} />
                            <div>
                                <h3>{number === 1 ? '1er semestre' : '2e semestre'}</h3>
                                {period ? (
                                    <p>
                                        {label(period.start_date)} — {label(period.end_date)}
                                    </p>
                                ) : (
                                    <p>Période à définir</p>
                                )}
                            </div>
                            <button className={period ? 'admin-secondary' : 'admin-primary'} onClick={() => setEditing(number)}>
                                {period ? <Pencil size={14} /> : <Plus size={14} />}
                                {period ? 'Modifier' : 'Définir'}
                            </button>
                        </article>
                    );
                })}
            </div>
            {editing && (
                <SemesterForm
                    key={`${year.id}-${editing}`}
                    year={year}
                    number={editing}
                    existing={periods.find((item) => item.number === editing)}
                    onClose={() => setEditing(null)}
                />
            )}
        </section>
    );
}
