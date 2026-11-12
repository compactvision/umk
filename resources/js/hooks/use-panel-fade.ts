import { useEffect, useLayoutEffect, useRef } from 'react';

const usePanelEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const animationId = 'usk-dashboard-panel-fade';

export function fadePanel(element: HTMLElement) {
    if (
        typeof element.animate !== 'function' ||
        element.closest('[data-dashboard-panel-loading]') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
        return;

    element
        .getAnimations()
        .find((animation) => animation.id === animationId)
        ?.cancel();
    return element.animate([{ opacity: 0.55 }, { opacity: 1 }], {
        id: animationId,
        duration: 180,
        easing: 'cubic-bezier(.2, .65, .3, 1)',
    });
}

export function usePanelFade<T extends HTMLElement = HTMLDivElement>(revision: string | number | null | undefined) {
    const panel = useRef<T>(null);
    const previous = useRef(revision);
    usePanelEffect(() => {
        if (previous.current === revision) return;
        previous.current = revision;
        const animation = panel.current && fadePanel(panel.current);
        return () => animation?.cancel();
    }, [revision]);
    return panel;
}
