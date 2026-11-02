import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
type Choice = 'accepted' | 'refused' | null;
function choice(): Choice {
    return (document.cookie.match(/(?:^|; )usk_audience=(accepted|refused)(?:;|$)/)?.[1] as Choice) ?? null;
}
function event(name: string, path: string) {
    if (choice() !== 'accepted') return;
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (!csrf) return;
    void fetch('/analytics/events', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
        body: JSON.stringify({ event: name, path }),
        keepalive: true,
    }).catch(() => {});
}
export default function AudienceConsent() {
    const {
        props: { publicSettings },
        url,
    } = usePage<{ publicSettings?: { analytics_enabled: boolean } }>();
    const enabled = publicSettings?.analytics_enabled ?? false;
    const [open, setOpen] = useState(false);
    const [preference, setPreference] = useState<Choice>(null);
    useEffect(() => {
        const update = () => setOpen(true);
        setOpen(enabled && !choice());
        setPreference(choice());
        window.addEventListener('usk:cookie-settings', update);
        return () => window.removeEventListener('usk:cookie-settings', update);
    }, [enabled]);
    useEffect(() => {
        if (!enabled || preference !== 'accepted') return;
        const path = url.split('?')[0].split('#')[0];
        event('page_view', path);
        if (/^\/course\/\d+$/.test(path)) event('course_view', path);
        let source = 'direct';
        try {
            const host = new URL(document.referrer).hostname;
            if (host !== location.hostname)
                source = /(^|\.)(google|bing|duckduckgo)\./.test(host)
                    ? 'search'
                    : /(^|\.)(facebook|instagram|linkedin|t)\./.test(host)
                      ? 'social'
                      : 'referral';
        } catch {
            /* No referrer. */
        }
        event(`source_${source}`, path);
        const click = (clickEvent: MouseEvent) => {
            const link = (clickEvent.target as Element)?.closest<HTMLAnchorElement>('a');
            if (link?.getAttribute('href')?.match(/^\/dashboard\/enrollments/)) event('admission_start', '/admission');
        };
        document.addEventListener('click', click);
        return () => document.removeEventListener('click', click);
    }, [enabled, preference, url]);
    if (!enabled || !open) return null;
    const save = (value: Exclude<Choice, null>) => {
        document.cookie = `usk_audience=${value}; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        setPreference(value);
        setOpen(false);
    };
    return (
        <aside className="usk-cookie-panel" aria-label="Préférences de mesure d’audience">
            <h2>Mesure d’audience facultative</h2>
            <p>
                Avec votre accord, nous comptons les pages consultées et les démarches d’admission par jour, sans enregistrer votre identité. Les
                cookies de connexion restent nécessaires au service.
            </p>
            <p>
                <a href="/politique-des-cookies">Lire la politique des cookies</a>
            </p>
            <div className="usk-actions">
                <button className="usk-button usk-button-green" onClick={() => save('accepted')}>
                    Accepter la mesure
                </button>
                <button className="usk-button usk-button-green" onClick={() => save('refused')}>
                    Refuser la mesure
                </button>
            </div>
        </aside>
    );
}
