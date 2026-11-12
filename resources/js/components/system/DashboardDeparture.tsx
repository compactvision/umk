import { router } from '@inertiajs/react';
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { DashboardCurtain } from './DashboardArrival';

type DeparturePhase = 'closing' | 'waiting' | 'revealing' | 'immediate' | null;
const reducedMotion = '(prefers-reduced-motion: reduce)';

export const DashboardDepartureContext = createContext<{ phase: DeparturePhase; logout: (animate: boolean) => void }>({
    phase: null,
    logout: () => router.post('/logout'),
});

export default function DashboardDeparture({ children }: { children: ReactNode }) {
    const [phase, setPhase] = useState<DeparturePhase>(null);
    const current = useRef<DeparturePhase>(null);
    const move = useCallback((next: DeparturePhase) => {
        current.current = next;
        setPhase(next);
    }, []);

    const submit = useCallback(() => {
        const animated = current.current === 'closing';
        if (!animated && current.current !== null) return;

        move(animated ? 'waiting' : 'immediate');
        router.post(
            '/logout',
            {},
            {
                showProgress: false,
                onFinish: () => move(animated && !window.matchMedia(reducedMotion).matches ? 'revealing' : null),
            },
        );
    }, [move]);

    const logout = (animate: boolean) => {
        if (current.current !== null) return;
        if (animate && !window.matchMedia(reducedMotion).matches) move('closing');
        else submit();
    };

    useEffect(() => {
        if (phase === 'closing') {
            const media = window.matchMedia(reducedMotion);
            const respectMotion = () => {
                if (media.matches) submit();
            };
            const fallback = window.setTimeout(submit, 1000);
            media.addEventListener('change', respectMotion);
            return () => {
                window.clearTimeout(fallback);
                media.removeEventListener('change', respectMotion);
            };
        }
        if (phase === 'revealing') {
            const fallback = window.setTimeout(() => move(null), 280);
            return () => window.clearTimeout(fallback);
        }
    }, [move, phase, submit]);

    return (
        <DashboardDepartureContext.Provider value={{ phase, logout }}>
            {children}
            {phase !== null && phase !== 'immediate' && (
                <DashboardCurtain
                    departure
                    revealing={phase === 'revealing'}
                    onAnimationEnd={(event) => {
                        if (event.animationName === 'usk-dashboard-close-right' && current.current === 'closing') submit();
                        if (event.animationName === 'usk-dashboard-uncover' && current.current === 'revealing') move(null);
                    }}
                />
            )}
            <span className="sr-only" role="status">
                {phase === 'closing' || phase === 'waiting' || phase === 'immediate' ? 'Déconnexion en cours…' : ''}
            </span>
        </DashboardDepartureContext.Provider>
    );
}
