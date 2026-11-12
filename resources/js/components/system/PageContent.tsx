import { fadePanel } from '@/hooks/use-panel-fade';
import { usePage } from '@inertiajs/react';
import { useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import '../../../css/page-feedback.css';
import { NavigationFeedbackContext } from './NavigationFeedback';
import { isDossierOpening } from './dossier-navigation';

type PageTone = 'public' | 'admin' | 'student' | 'auth';

const titleOffsets: Record<PageTone, string> = {
    public: 'translateY(14px)',
    admin: 'translateY(9px)',
    student: 'translateY(9px)',
    auth: 'translateY(-12px)',
};
const useEntranceEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function changedQueryKeys(previousUrl: string, url: string) {
    const before = new URL(previousUrl, window.location.origin).searchParams;
    const after = new URL(url, window.location.origin).searchParams;
    return new Set(
        [...new Set([...before.keys(), ...after.keys()])].filter(
            (name) => JSON.stringify(before.getAll(name)) !== JSON.stringify(after.getAll(name)),
        ),
    );
}

function updatedPanels(surface: HTMLElement, updated: Set<string>) {
    if (!updated.size) return [];

    const panels = surface.querySelectorAll<HTMLElement>('[data-dashboard-panel]');
    const targets = panels.length
        ? [...panels].filter((panel) => {
              const keys = panel.dataset.dashboardPanel;
              return !keys || keys.split(' ').some((key) => updated.has(key));
          })
        : [...surface.querySelectorAll<HTMLElement>('.review-list, .academic-table-scroll, [role="tabpanel"]')];
    const visibleTargets = targets.filter(
        (panel) =>
            !targets.some((parent) => parent !== panel && parent.contains(panel)) &&
            !panel.closest('details:not([open])') &&
            panel.getClientRects().length > 0,
    );
    return visibleTargets.flatMap((panel) => {
        const table = panel.firstElementChild;
        return panel.childElementCount === 1 && table instanceof HTMLTableElement && table.tBodies.length ? [...table.tBodies] : [panel];
    });
}

function fadeUpdatedPanels(surface: HTMLElement, previousUrl: string, url: string) {
    const updated = changedQueryKeys(previousUrl, url);
    if (!updated.size) return;
    surface.dataset.dashboardUpdate = '';
    const animations = updatedPanels(surface, updated).map(fadePanel);
    return () => animations.forEach((animation) => animation?.cancel());
}

function showPanelSkeletons(surface: HTMLElement, source: string, target: string) {
    const panels = updatedPanels(surface, changedQueryKeys(source, target));
    const cleanups = panels.map((panel) => {
        panel.dataset.dashboardPanelLoading = '';
        const hasBusyState = panel.hasAttribute('aria-busy');
        if (!hasBusyState) panel.setAttribute('aria-busy', 'true');
        return () => {
            delete panel.dataset.dashboardPanelLoading;
            if (!hasBusyState) panel.removeAttribute('aria-busy');
        };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
}

function PageSkeleton({ tone }: { tone: PageTone }) {
    return (
        <div className="usk-page-overlay" aria-hidden="true">
            <div className="usk-page-skeleton" data-page-skeleton={tone}>
                <div className="usk-skeleton-heading">
                    <span className="usk-skeleton-block usk-skeleton-kicker" />
                    <span className="usk-skeleton-block usk-skeleton-title" />
                    <span className="usk-skeleton-block usk-skeleton-caption" />
                </div>
                {tone === 'auth' ? (
                    <div className="usk-skeleton-form">
                        <span className="usk-skeleton-block usk-skeleton-field" />
                        <span className="usk-skeleton-block usk-skeleton-field" />
                        <span className="usk-skeleton-block usk-skeleton-submit" />
                    </div>
                ) : (
                    <>
                        <div className="usk-skeleton-cards">
                            {Array.from({ length: 3 }, (_, index) => (
                                <div className="usk-skeleton-card" key={index}>
                                    <span className="usk-skeleton-block usk-skeleton-card-icon" />
                                    <span className="usk-skeleton-block usk-skeleton-card-title" />
                                    <span className="usk-skeleton-block usk-skeleton-card-line" />
                                </div>
                            ))}
                        </div>
                        {tone !== 'public' && (
                            <div className="usk-skeleton-rows">
                                <span className="usk-skeleton-block" />
                                <span className="usk-skeleton-block" />
                                <span className="usk-skeleton-block" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function PageContent({
    tone,
    className = '',
    skipEntrance = false,
    children,
}: {
    tone: PageTone;
    className?: string;
    skipEntrance?: boolean;
    children: ReactNode;
}) {
    const { component, url } = usePage();
    const destination = `${component}:${url.split(/[?#]/, 1)[0]}`;
    const { pendingContent, claimContentChange, hasPageTransition } = useContext(NavigationFeedbackContext);
    const pageUrl = url.split('#', 1)[0];
    const loading = pendingContent?.kind === 'page' && pendingContent.source === pageUrl;
    const dashboard = tone === 'admin' || tone === 'student';
    const loadingPanelUrl = dashboard && pendingContent?.kind === 'panel' && pendingContent.source === pageUrl ? pendingContent.target : null;
    const content = useRef<HTMLDivElement>(null);

    useEntranceEffect(() => {
        if (content.current && loadingPanelUrl) return showPanelSkeletons(content.current, pageUrl, loadingPanelUrl);
    }, [loadingPanelUrl, pageUrl]);

    useEntranceEffect(() => {
        const surface = content.current;
        if (!surface || loading) return;
        const change = claimContentChange(destination, pageUrl);
        if (change?.kind === 'page') delete surface.dataset.dashboardUpdate;
        if (!change || skipEntrance || hasPageTransition()) return;
        if (change.kind === 'panel') {
            if (dashboard) return fadeUpdatedPanels(surface, change.previousUrl, pageUrl);
            return;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotion.matches || typeof surface.animate !== 'function') return;

        const heading = [...surface.querySelectorAll('h1')].find((element) => element.getClientRects().length > 0);
        const easing = 'cubic-bezier(.22, 1, .36, 1)';
        const slide = change.previousUrl && isDossierOpening(change.previousUrl, pageUrl);
        const entrance = surface.animate(
            slide
                ? [
                      { opacity: 0.55, translate: '18px' },
                      { opacity: 1, translate: '0px' },
                  ]
                : [{ opacity: dashboard ? 0.38 : 0.72 }, { opacity: 1 }],
            { duration: 340, easing },
        );
        const title = heading?.animate([{ transform: titleOffsets[tone] }, { transform: 'none' }], {
            duration: dashboard ? 360 : 440,
            easing,
        });
        const cancelEntrance = () => {
            entrance.cancel();
            title?.cancel();
        };
        const respectReducedMotion = () => {
            if (reducedMotion.matches) cancelEntrance();
        };

        reducedMotion.addEventListener('change', respectReducedMotion);
        return () => {
            reducedMotion.removeEventListener('change', respectReducedMotion);
            cancelEntrance();
        };
    }, [claimContentChange, dashboard, destination, hasPageTransition, loading, pageUrl, skipEntrance, tone]);

    return (
        <>
            <div ref={content} className={`usk-page-current ${className}`} aria-busy={loading || undefined} inert={loading}>
                {children}
            </div>
            {loading && <PageSkeleton tone={tone} />}
            <span className="usk-page-status sr-only" role="status">
                {loading ? 'Chargement de la page…' : loadingPanelUrl && 'Chargement des résultats…'}
            </span>
        </>
    );
}
