import { useSyncExternalStore } from 'react';

export type DashboardTheme = 'light' | 'dark' | 'system';
const key = 'usk-dashboard-theme';
const systemQuery = '(prefers-color-scheme: dark)';
const changeEvent = 'usk:dashboard-theme';
let temporaryPreference: DashboardTheme | undefined;

function preference(): DashboardTheme {
    if (temporaryPreference) return temporaryPreference;
    try {
        const value = window.localStorage.getItem(key);
        if (value === 'light' || value === 'dark') return value;
    } catch {
        // The system preference remains available when storage is restricted.
    }
    return 'system';
}

function snapshot() {
    const value = preference();
    const resolved = value === 'system' ? (window.matchMedia(systemQuery).matches ? 'dark' : 'light') : value;
    return `${value}:${resolved}` as const;
}

function subscribe(onChange: () => void) {
    const media = window.matchMedia(systemQuery);
    const syncStorage = (event: StorageEvent) => {
        if (event.key !== key && event.key !== null) return;
        temporaryPreference = undefined;
        onChange();
    };
    media.addEventListener('change', onChange);
    window.addEventListener('storage', syncStorage);
    window.addEventListener(changeEvent, onChange);
    return () => {
        media.removeEventListener('change', onChange);
        window.removeEventListener('storage', syncStorage);
        window.removeEventListener(changeEvent, onChange);
    };
}

function setDashboardTheme(value: DashboardTheme) {
    try {
        window.localStorage.setItem(key, value);
        temporaryPreference = undefined;
    } catch {
        temporaryPreference = value;
    }
    window.dispatchEvent(new Event(changeEvent));
}

export function useDashboardTheme() {
    const state = useSyncExternalStore(subscribe, snapshot, () => 'system:light' as const);
    const [preference, resolved] = state.split(':') as [DashboardTheme, 'light' | 'dark'];
    return { preference, resolved, setPreference: setDashboardTheme };
}
