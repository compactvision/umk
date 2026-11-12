declare module 'isotope-layout' {
    type Filter = string | ((element: Element) => boolean);
    interface Options { hiddenStyle?: { opacity?: number; transform?: string }; visibleStyle?: { opacity?: number; transform?: string }; stagger?: number; itemSelector?: string; layoutMode?: string; getSortData?: Record<string, string | ((element: Element) => string)>; sortBy?: string; sortAscending?: boolean; filter?: Filter; transitionDuration?: string; masonry?: { columnWidth?: string; gutter?: number; percentPosition?: boolean }; }
    export default class Isotope {
        constructor(element: Element, options?: Options);
        arrange(options?: Options): void;
        reloadItems(): void;
        layout(): void;
        destroy(): void;
    }
}
