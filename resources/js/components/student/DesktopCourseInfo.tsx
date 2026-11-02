import { dateLabel } from '@/lib/scheduleDates';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, ChevronDown, ClipboardCheck, GraduationCap, UserRound, Users } from 'lucide-react';
type Course = {
    title: string;
    description: string | null;
    pedagogical_content: string | null;
    credits: number;
    semester: number | null;
    cmi_hours: number | null;
    td_hours: number | null;
    tp_hours: number | null;
};
type Organization = {
    id: number;
    teacher: string | null;
    assistant: string | null;
    leader: string | null;
    group: string | null;
    delivery_mode: string;
};
function syllabus(course: Course) {
    const headings: Record<string, string> = {
        'OBJECTIFS ET ACQUIS ATTENDUS': 'Objectifs et acquis attendus',
        'CONTENU DU COURS': 'Programme du cours',
        'ORGANISATION DES APPRENTISSAGES': 'Méthodes et apprentissages',
        'CHARGE DE TRAVAIL PROPOSÉE': 'Charge de travail',
        'ÉVALUATION PROPOSÉE': 'Modalités d’évaluation proposées',
        RESSOURCES: 'Ressources et bibliographie',
    };
    const items: { title: string; content: string }[] = [];
    if (course.description?.trim()) items.push({ title: 'Description du cours', content: course.description });
    const content = course.pedagogical_content?.trim();
    if (content) {
        let title = 'Présentation pédagogique';
        let lines: string[] = [];
        const flush = () => {
            if (lines.join('\n').trim()) items.push({ title, content: lines.join('\n').trim() });
            lines = [];
        };
        for (const line of content.split('\n')) {
            const heading = headings[line.trim().toLocaleUpperCase('fr')];
            if (heading) {
                flush();
                title = heading;
            } else lines.push(line);
        }
        flush();
    }
    return items;
}
function Teacher({ name, label }: { name: string | null; label: string }) {
    const words = name?.split(/\s+/).filter(Boolean) ?? [];
    return (
        <div className={`desktop-course-person ${name ? '' : 'is-unassigned'}`}>
            <span className="desktop-course-avatar" aria-hidden="true">
                {words.length ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ''}` : <UserRound size={21} strokeWidth={1.5} />}
            </span>
            <div>
                <small>{label}</small>
                <strong>{name || 'Non renseigné'}</strong>
            </div>
        </div>
    );
}
export default function DesktopCourseInfo({
    course,
    academic,
    organization,
    period,
    stats,
    attendanceHref,
}: {
    course: Course;
    academic: { level: string; faculty: string; year: string; group: string | null };
    organization: Organization[];
    period: { start_date: string; end_date: string } | null;
    stats: Record<string, number>;
    attendanceHref: string | null;
}) {
    const content = syllabus(course);
    const leaders = [...new Set(organization.map((person) => person.leader).filter(Boolean))];
    const modes = [
        ...new Set(
            organization
                .map((person) => ({ in_person: 'Présentiel', online: 'À distance', hybrid: 'Hybride' })[person.delivery_mode as 'in_person'])
                .filter(Boolean),
        ),
    ];
    return (
        <div className="desktop-course-info">
            <div className="desktop-course-top-grid">
                <section className="desktop-course-panel desktop-course-team" aria-labelledby="desktop-course-team-title">
                    <header>
                        <Users size={19} />
                        <h2 id="desktop-course-team-title">Équipe enseignante</h2>
                    </header>
                    <div className="desktop-course-team-body">
                        {organization.length ? (
                            organization.map((person) => (
                                <div className="desktop-course-teaching-group" key={person.id}>
                                    {person.group && <p className="desktop-course-group-label">{person.group}</p>}
                                    <Teacher label="Professeur titulaire" name={person.teacher} />
                                    <Teacher label="Assistant" name={person.assistant} />
                                </div>
                            ))
                        ) : (
                            <div className="desktop-course-team-empty">
                                <UserRound size={30} />
                                <p>L’équipe enseignante sera précisée par la faculté.</p>
                            </div>
                        )}
                    </div>
                    <div className="desktop-course-team-note">
                        <GraduationCap size={16} />
                        <span>{academic.faculty}</span>
                    </div>
                </section>
                <section className="desktop-course-panel desktop-course-organization" aria-labelledby="desktop-course-organization-title">
                    <header>
                        <BookOpen size={18} />
                        <h2 id="desktop-course-organization-title">Organisation du cours</h2>
                    </header>
                    <div className="desktop-course-organization-body">
                        <dl>
                            <div>
                                <dt>Promotion</dt>
                                <dd>
                                    {academic.level}
                                    {academic.group && <small>{academic.group}</small>}
                                </dd>
                            </div>
                            <div>
                                <dt>Période</dt>
                                <dd>
                                    <span className="desktop-course-semester">
                                        {course.semester === 1 ? 'Premier semestre' : course.semester === 2 ? 'Deuxième semestre' : 'À préciser'}
                                    </span>
                                    <small>{period ? `${dateLabel(period.start_date)} — ${dateLabel(period.end_date)}` : academic.year}</small>
                                </dd>
                            </div>
                            <div>
                                <dt>Chef de promotion</dt>
                                <dd>
                                    {leaders.join(', ') || 'Non renseigné'}
                                    {modes.length > 0 && <small>{modes.join(' · ')}</small>}
                                </dd>
                            </div>
                            <div>
                                <dt>Mes présences</dt>
                                <dd>
                                    <span>
                                        {stats.present ?? 0} présent · {stats.absent ?? 0} absent
                                    </span>
                                    {attendanceHref && (
                                        <Link href={attendanceHref}>
                                            Suivi par séance
                                            <ArrowUpRight size={13} />
                                        </Link>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="desktop-course-workload">
                            <p>Crédits et volume horaire</p>
                            <div>
                                {[
                                    { label: 'Crédits', value: course.credits, unit: '' },
                                    { label: 'CMI', value: course.cmi_hours, unit: 'h' },
                                    { label: 'TD', value: course.td_hours, unit: 'h' },
                                    { label: 'TP', value: course.tp_hours, unit: 'h' },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <span>{item.label}</span>
                                        <strong>
                                            {item.value ?? '—'}
                                            {item.value !== null && <small>{item.unit}</small>}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <section className="desktop-course-syllabus" aria-labelledby="desktop-course-syllabus-title">
                <header>
                    <div>
                        <span>APPRENDRE AVEC MÉTHODE</span>
                        <h2 id="desktop-course-syllabus-title">Contenu pédagogique</h2>
                    </div>
                    <p>Programme, objectifs et organisation des apprentissages.</p>
                </header>
                {content.length ? (
                    <div className="desktop-course-accordions">
                        {content.map((item, index) => (
                            <details key={`${index}-${item.title}`} open={index === 0}>
                                <summary>
                                    <span>{String(index + 1).padStart(2, '0')}</span>
                                    <strong>{item.title}</strong>
                                    <ChevronDown size={17} />
                                </summary>
                                <div>{item.content}</div>
                            </details>
                        ))}
                    </div>
                ) : (
                    <div className="desktop-course-syllabus-empty">
                        <ClipboardCheck size={25} />
                        <p>Le contenu pédagogique sera communiqué par l’équipe enseignante.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
