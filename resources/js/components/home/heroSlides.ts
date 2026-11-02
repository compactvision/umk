export type HeroSlide = {
    id: string;
    image: string;
    alt: string;
    eyebrow: string;
    title: string;
    position: string;
    /** Optional local MP4/WebM. The image remains the poster and reduced-motion fallback. */
    video?: string;
};
export const HERO_DURATION = 7000;
export const heroSlides: HeroSlide[] = [
    {
        id: 'communaute',
        image: '/assets/usk/academic.jpg',
        alt: 'La communauté universitaire réunie lors d’une activité académique',
        eyebrow: 'L’esprit USK',
        title: 'Apprendre. Grandir. Transmettre.',
        position: '65% 47%',
    },
    {
        id: 'etudiants',
        image: '/assets/usk/students.jpg',
        alt: 'La communauté étudiante de l’Université Simon Kimbangu',
        eyebrow: 'Une ambition partagée',
        title: 'Votre avenir commence ensemble.',
        position: '60% 45%',
    },
    {
        id: 'campus',
        image: '/assets/usk/campus.jpg',
        alt: 'Le campus de l’Université Simon Kimbangu à Kinshasa',
        eyebrow: 'Au cœur de Kinshasa',
        title: 'Un lieu pour ouvrir vos horizons.',
        position: '65% 50%',
    },
    {
        id: 'ceremonie',
        image: '/assets/usk/ceremony.jpg',
        alt: 'Une cérémonie de la communauté universitaire',
        eyebrow: 'Des moments qui rassemblent',
        title: 'Une histoire à poursuivre.',
        position: '65% 45%',
    },
];
