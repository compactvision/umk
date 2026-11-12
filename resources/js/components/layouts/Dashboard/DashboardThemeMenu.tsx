import { useDashboardTheme, type DashboardTheme } from '@/hooks/use-dashboard-theme';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef } from 'react';

const options = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
] as const;

export default function DashboardThemeMenu() {
    const { preference, resolved, setPreference } = useDashboardTheme();
    const Icon = resolved === 'dark' ? Moon : Sun;
    const label = options.find(({ value }) => value === preference)?.label;
    const icon = useRef<SVGSVGElement>(null);
    const previousTheme = useRef(resolved);

    useEffect(() => {
        if (previousTheme.current === resolved) return;
        previousTheme.current = resolved;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const animation = icon.current?.animate?.(
            [
                { opacity: 0.5, transform: 'rotate(-22deg) scale(.8)' },
                { opacity: 1, transform: 'none' },
            ],
            { duration: 180, easing: 'ease-out' },
        );
        return () => animation?.cancel();
    }, [resolved]);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="usk-theme-trigger" aria-label={`Thème du dashboard, ${label}`} title="Changer le thème du dashboard">
                <Icon ref={icon} size={17} aria-hidden="true" />
                <ChevronDown size={12} aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="usk-theme-menu" align="end" sideOffset={9} collisionPadding={12} aria-label="Thème du dashboard">
                    <DropdownMenu.RadioGroup value={preference} onValueChange={(value) => setPreference(value as DashboardTheme)}>
                        {options.map(({ value, label, icon: OptionIcon }) => (
                            <DropdownMenu.RadioItem className="usk-theme-option" key={value} value={value}>
                                <OptionIcon size={16} aria-hidden="true" />
                                <span>{label}</span>
                                <DropdownMenu.ItemIndicator>
                                    <Check size={15} aria-hidden="true" />
                                </DropdownMenu.ItemIndicator>
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
