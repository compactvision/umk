import type { ReactNode } from 'react';
export default function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <header className="admin-page-heading">
            <div>
                <span>GESTION UNIVERSITAIRE</span>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {action}
        </header>
    );
}
