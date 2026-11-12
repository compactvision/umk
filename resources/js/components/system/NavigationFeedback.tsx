import { router } from '@inertiajs/react';
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import DashboardDeparture from './DashboardDeparture';
import { catalogReturnView, catalogViewKey, rememberDossierList } from './dossier-navigation';

type ContentChange = { kind: 'page'; previousUrl?: string } | { kind: 'panel'; previousUrl: string } | null;
type PendingContent = { kind: 'page'; source: string } | { kind: 'panel'; source: string; target: string };

export const NavigationFeedbackContext = createContext<{
    pendingContent: PendingContent | null;
    claimContentChange: (destination: string, url: string) => ContentChange;
    hasPageTransition: () => boolean;
    cancelPageTransition: () => void;
}>({
    pendingContent: null,
    claimContentChange: () => ({ kind: 'page' }),
    hasPageTransition: () => false,
    cancelPageTransition: () => {},
});

export default function NavigationFeedback({ children }: { children: ReactNode }) {
    const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);
    const lastContent = useRef<{ destination: string; url: string } | null>(null);
    const pageTransition = useRef<ViewTransition | null>(null);
    const hasPageTransition = useCallback(() => pageTransition.current !== null, []);
    const clearTransition = useCallback(() => {
        pageTransition.current = null;
        delete document.documentElement.dataset.dashboardPageTransition;
    }, []);
    const cancelPageTransition = useCallback(() => {
        if (!pageTransition.current) return;
        pageTransition.current.skipTransition();
        clearTransition();
    }, [clearTransition]);
    const claimContentChange = useCallback((destination: string, url: string): ContentChange => {
        const previous = lastContent.current;
        lastContent.current = { destination, url };
        if (previous && previous.url !== url && previous.url.split('?', 1)[0] === url.split('?', 1)[0]) {
            return { kind: 'panel', previousUrl: previous.url };
        }
        return previous?.destination === destination ? null : { kind: 'page', previousUrl: previous?.url };
    }, []);

    useEffect(() => {
        let activeVisit: object | null = null;
        let timer: number | undefined;
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const root = document.documentElement;
        const sessionAnimation = () => document.querySelector('[data-dashboard-arrival], [data-dashboard-curtain="departure"]');
        const respectMotion = () => {
            if (motion.matches) cancelPageTransition();
        };
        const stopLoading = () => {
            activeVisit = null;
            window.clearTimeout(timer);
            setPendingContent(null);
        };
        const handlePopState = () => {
            cancelPageTransition();
            stopLoading();
        };
        const stopBefore = router.on('before', ({ detail: { visit } }) => {
            if (visit.async || visit.prefetch) return;
            cancelPageTransition();

            if (
                visit.method !== 'get' ||
                visit.only.length ||
                visit.except.length ||
                visit.reset.length ||
                visit.preserveUrl ||
                visit.url.origin !== window.location.origin ||
                !/^\/dashboard(?:\/|$)/.test(visit.url.pathname) ||
                visit.url.pathname.startsWith('/dashboard/auth/') ||
                visit.url.pathname === window.location.pathname ||
                visit.url.hash ||
                window.scrollY > 80 ||
                motion.matches ||
                typeof document.startViewTransition !== 'function' ||
                !document.querySelector('[data-dashboard-navigation-surface]') ||
                sessionAnimation()
            ) {
                return;
            }

            visit.viewTransition = (transition) => {
                if (motion.matches || sessionAnimation() || window.scrollY > 80) {
                    transition.skipTransition();
                    return;
                }
                pageTransition.current = transition;
                root.dataset.dashboardPageTransition = '';
                const finish = () => {
                    if (pageTransition.current === transition) clearTransition();
                };
                void transition.finished.then(finish, finish);
            };
        });
        motion.addEventListener('change', respectMotion);
        window.addEventListener('popstate', handlePopState);

        const stopStart = router.on('start', ({ detail: { visit } }) => {
            if (
                visit.method !== 'get' ||
                !visit.showProgress ||
                visit.async ||
                visit.prefetch ||
                visit.preserveUrl ||
                visit.only.length ||
                visit.except.length ||
                visit.reset.length
            ) {
                return;
            }

            rememberDossierList(visit.url);
            const { origin, pathname, search } = window.location;
            const source = pathname + search;
            const sameDashboard =
                visit.url.origin === origin && visit.url.pathname === pathname && document.querySelector('[data-dashboard-navigation-surface]');
            if (sameDashboard && visit.url.search === search) return;

            const pending: PendingContent = sameDashboard
                ? { kind: 'panel', source, target: visit.url.pathname + visit.url.search }
                : { kind: 'page', source };
            activeVisit = visit;
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (activeVisit === visit) setPendingContent(pending);
            }, 180);
        });

        const stopBeforeUpdate = router.on('beforeUpdate', ({ detail: { page } }) => {
            const view = catalogReturnView(page.url);
            if (view !== undefined) {
                page.rememberedState = { ...page.rememberedState, [catalogViewKey(page.url)]: view };
            }
        });

        const stopFinish = router.on('finish', ({ detail: { visit } }) => {
            if (activeVisit === visit) stopLoading();
        });

        return () => {
            window.clearTimeout(timer);
            cancelPageTransition();
            motion.removeEventListener('change', respectMotion);
            window.removeEventListener('popstate', handlePopState);
            stopBefore();
            stopStart();
            stopBeforeUpdate();
            stopFinish();
        };
    }, [cancelPageTransition, clearTransition]);

    return (
        <NavigationFeedbackContext.Provider value={{ pendingContent, claimContentChange, hasPageTransition, cancelPageTransition }}>
            <DashboardDeparture>{children}</DashboardDeparture>
        </NavigationFeedbackContext.Provider>
    );
}
