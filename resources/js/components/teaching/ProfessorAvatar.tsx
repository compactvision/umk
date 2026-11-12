import { UserRound } from 'lucide-react';
import { useState } from 'react';

export default function ProfessorAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();

    return (
        <span className="professor-portrait" aria-hidden="true">
            {photoUrl && photoUrl !== failedUrl ? (
                <img src={photoUrl} alt="" width={80} height={80} onError={() => setFailedUrl(photoUrl)} />
            ) : (
                initials || <UserRound size={24} />
            )}
        </span>
    );
}
