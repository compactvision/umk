import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { formatDate } from '@/lib/studentEnrollment';
import { Head, Link } from '@inertiajs/react';
import '../../../../css/student-portal.css';

type Props = {
    title: string;
    number: number;
    current: number;
    body: string | null;
    late: boolean | null;
    received_at: string | null;
    download_url: string | null;
    previous_url: string | null;
    next_url: string | null;
    return_url: string;
    administrative?: boolean;
};

export default function SubmissionVersion(props: Props) {
    return (
        <Dashboard hideAppsNavigation>
            <Head title={props.administrative ? 'Dépôt pédagogique' : 'Mon dépôt pédagogique'} />
            <main className="student-portal">
                <section className="portal-panel">
                    <Link href={props.return_url}>{props.administrative ? 'Retour aux travaux de l’étudiant' : 'Retour à l’activité'}</Link>
                    <h1>{props.title}</h1>
                    <p>
                        Version {props.number} sur {props.current} {props.received_at && ` · ${formatDate(props.received_at, true)}`}{' '}
                        {props.late && '· Remise tardive'}
                    </p>
                    {props.body && <p style={{ whiteSpace: 'pre-wrap' }}>{props.body}</p>}
                    {props.download_url && <a href={props.download_url}>Télécharger cette version</a>}
                    <nav className="student-dossier-links" aria-label="Versions du dépôt">
                        {props.previous_url && <Link href={props.previous_url}>Version précédente</Link>}
                        {props.next_url && <Link href={props.next_url}>Version suivante</Link>}
                    </nav>
                </section>
            </main>
        </Dashboard>
    );
}
