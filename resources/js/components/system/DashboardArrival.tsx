import { createContext, useEffect, useState, type AnimationEventHandler } from 'react';
import '../../../css/dashboard/arrival.css';

export const DashboardArrivalContext = createContext(false);

const reducedMotion = '(prefers-reduced-motion: reduce)';

export function useDashboardArrival(requested: boolean) {
    const [opening, setOpening] = useState(() => requested && typeof window !== 'undefined' && !window.matchMedia(reducedMotion).matches);

    useEffect(() => {
        if (!opening) return;

        const media = window.matchMedia(reducedMotion);
        const finish = () => setOpening(false);
        const respectMotion = () => {
            if (media.matches) finish();
        };
        const timeout = window.setTimeout(finish, 1080);
        media.addEventListener('change', respectMotion);

        return () => {
            window.clearTimeout(timeout);
            media.removeEventListener('change', respectMotion);
        };
    }, [opening]);

    return opening;
}

export function DashboardCurtain({
    departure = false,
    revealing = false,
    onAnimationEnd,
}: {
    departure?: boolean;
    revealing?: boolean;
    onAnimationEnd?: AnimationEventHandler<HTMLDivElement>;
}) {
    return (
        <div
            className="usk-dashboard-opening"
            data-dashboard-curtain={departure ? 'departure' : 'arrival'}
            data-dashboard-curtain-reveal={revealing ? '' : undefined}
            aria-hidden="true"
            onAnimationEnd={onAnimationEnd}
        >
            <div className="usk-dashboard-opening-door" />
            <div className="usk-dashboard-opening-door" />
            <div className="usk-dashboard-opening-crest">
                <img src="/assets/usk/logo.png" alt="" width={58} height={58} />
            </div>
        </div>
    );
}
