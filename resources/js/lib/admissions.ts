/** Published USK admissions information. Update this single source for each intake. */
export const admissionsYear = '2026–2027';
export const admissionsSource = 'https://www.universitesk.net/pages/admission.php';
export const admissionsVerified = '31 octobre 2026';
export type CandidateCategory = 'national' | 'international';
export type AdmissionRegime = 'standard' | 'special';
export type FeePlan = { first: number; second: number };
export type AdmissionFaculty = {
    id: string;
    name: string;
    shortName: string;
    match: string;
    image: string;
    number: string;
    description: string;
    interests: string;
    opportunities: string[];
    tuition: Record<CandidateCategory, FeePlan>;
    extras: { label: string; amount: number }[];
    publishedExtras?: number;
    extraNote?: string;
};
const commonPlan = { national: { first: 250, second: 155 }, international: { first: 370, second: 235 } };
export const admissionFaculties: AdmissionFaculty[] = [
    {
        id: 'medicine',
        name: 'Médecine humaine',
        shortName: 'Médecine',
        match: 'medecine',
        image: 'medicine.jpg',
        number: '01',
        description: 'Comprendre le vivant, développer la rigueur clinique et mettre ses connaissances au service des patients.',
        interests: 'Le soin, les sciences du vivant et la relation humaine.',
        opportunities: ['Pratique clinique', 'Recherche en santé', 'Formation médicale'],
        tuition: { national: { first: 450, second: 353 }, international: { first: 650, second: 553 } },
        extras: [
            { label: 'Formulaire', amount: 30 },
            { label: 'Aptitude physique et test', amount: 20 },
            { label: 'Laboratoire', amount: 30 },
            { label: 'Bibliothèque', amount: 20 },
            { label: 'Carnet de stage', amount: 10 },
            { label: 'Carte étudiante', amount: 10 },
            { label: 'Guide étudiant', amount: 10 },
            { label: 'Internet', amount: 20 },
            { label: 'Construction', amount: 20 },
            { label: 'Mobilité des professeurs', amount: 25 },
        ],
        publishedExtras: 195,
    },
    {
        id: 'public-health',
        name: 'Santé publique',
        shortName: 'Santé publique',
        match: 'sante',
        image: 'students.jpg',
        number: '02',
        description: 'Relier la prévention, l’analyse et l’action collective pour répondre aux enjeux de santé des populations.',
        interests: 'La prévention, les communautés et les politiques de santé.',
        opportunities: ['Prévention et sensibilisation', 'Programmes de santé', 'Recherche communautaire'],
        tuition: { national: { first: 270, second: 185 }, international: { first: 370, second: 235 } },
        extras: [
            { label: 'Formulaire', amount: 30 },
            { label: 'Aptitude physique et test', amount: 20 },
            { label: 'Laboratoire', amount: 15 },
            { label: 'Carnet de stage', amount: 15 },
            { label: 'Carte étudiante', amount: 10 },
            { label: 'Construction', amount: 25 },
            { label: 'Mobilité des professeurs', amount: 25 },
        ],
        publishedExtras: 135,
        extraNote:
            'Le flyer annonce 135 $, tandis que les lignes détaillées totalisent 140 $. Le montant applicable doit être confirmé auprès des admissions.',
    },
    {
        id: 'law',
        name: 'Droit',
        shortName: 'Droit',
        match: 'droit',
        image: 'ceremony.jpg',
        number: '03',
        description: 'Apprendre à analyser les règles, construire un raisonnement et défendre une société plus juste.',
        interests: 'La justice, l’argumentation et les institutions.',
        opportunities: ['Métiers juridiques', 'Administration', 'Conseil et recherche'],
        tuition: commonPlan,
        extras: [
            { label: 'Formulaire', amount: 0 },
            { label: 'Aptitude physique et test', amount: 20 },
        ],
    },
    {
        id: 'social-sciences',
        name: 'Sciences sociales, politiques et administratives',
        shortName: 'Sciences sociales',
        match: 'social',
        image: 'academic.jpg',
        number: '04',
        description: 'Comprendre les dynamiques de la société et les mécanismes des institutions pour accompagner le changement.',
        interests: 'L’action publique, les relations sociales et le développement.',
        opportunities: ['Action publique', 'Analyse sociale', 'Gestion de projets'],
        tuition: commonPlan,
        extras: [
            { label: 'Formulaire', amount: 0 },
            { label: 'Aptitude physique et test', amount: 20 },
        ],
    },
    {
        id: 'theology',
        name: 'Théologie',
        shortName: 'Théologie',
        match: 'theolog',
        image: 'campus.jpg',
        number: '05',
        description: 'Approfondir la réflexion théologique, interroger le sens et mettre en dialogue la foi, les textes et la société.',
        interests: 'La spiritualité, la transmission et la réflexion éthique.',
        opportunities: ['Enseignement', 'Accompagnement communautaire', 'Recherche théologique'],
        tuition: commonPlan,
        extras: [
            { label: 'Formulaire', amount: 0 },
            { label: 'Aptitude physique et test', amount: 20 },
        ],
    },
];
export const specialPlans: Record<CandidateCategory, FeePlan> = { national: { first: 190, second: 205 }, international: { first: 190, second: 305 } };
export const admissionDocuments = [
    { id: 'letter', title: 'Demande d’inscription', detail: 'Une lettre précisant l’année d’entrée et la faculté choisie.' },
    {
        id: 'diploma',
        title: 'Diplôme ou attestation de réussite',
        detail: 'Quatre copies du diplôme d’État ; pour les nouveaux diplômés, l’attestation ou le relevé accepté par le service.',
    },
    {
        id: 'reports',
        title: 'Bulletins du secondaire',
        detail: 'Une copie des bulletins des deux dernières années (3e et 4e des humanités sur le flyer).',
    },
    {
        id: 'certificates',
        title: 'Actes et attestations',
        detail: 'Deux exemplaires de l’attestation de naissance et du certificat de bonne vie et mœurs.',
    },
    { id: 'sponsor', title: 'Engagement de prise en charge', detail: 'Une lettre signée par la personne qui prend en charge les études.' },
    { id: 'photos', title: 'Photos d’identité', detail: 'Quatre photos au format passeport.' },
    { id: 'form', title: 'Formulaire complété', detail: 'À obtenir au bureau des inscriptions et à remplir soigneusement.' },
    { id: 'folder', title: 'Farde préimprimée USK', detail: 'À acheter sur le campus. Le flyer indique un prix de 6 000 CDF.' },
    {
        id: 'records',
        title: 'Documents du parcours antérieur',
        detail: 'Relevés de résultats et attestations de fréquentation, lorsque votre situation l’exige.',
    },
];
export const admissionSteps = [
    {
        title: 'Choisissez votre parcours',
        text: 'Explorez les facultés et clarifiez votre niveau d’entrée. Notre outil d’orientation peut vous aider à commencer.',
        link: '#facultes',
        action: 'Explorer les facultés',
    },
    {
        title: 'Constituez votre dossier',
        text: 'Réunissez les justificatifs et vérifiez les exigences propres à votre situation avec les admissions.',
        link: '#conditions',
        action: 'Ouvrir la checklist',
    },
    {
        title: 'Complétez votre demande',
        text: 'Obtenez le formulaire auprès du service compétent. Vous pouvez aussi créer votre espace candidat sur cette plateforme.',
        link: '/register',
        action: 'Créer mon espace',
    },
    {
        title: 'Suivez les modalités officielles',
        text: 'Présentez les tests demandés et réglez les frais selon les instructions communiquées par l’université.',
        link: '#frais',
        action: 'Comprendre les frais',
    },
    {
        title: 'Faites confirmer votre inscription',
        text: 'Le service des admissions examine le dossier et confirme les étapes restantes. Un calcul de frais ne vaut pas admission.',
        link: '#orientation',
        action: 'Contacter les admissions',
    },
];
export const admissionFaq = [
    {
        category: 'Dossier',
        question: 'Quel diplôme faut-il pour candidater ?',
        answer: 'Un diplôme d’État ou un titre reconnu équivalent est requis. Les pièces à joindre figurent dans la checklist. Les équivalences et les conditions propres à un niveau d’entrée se vérifient avec le service des admissions.',
    },
    {
        category: 'Dossier',
        question: 'Je viens d’obtenir mon diplôme : puis-je préparer mon dossier ?',
        answer: 'Le flyer prévoit une attestation de réussite ou un relevé pour les nouveaux diplômés. Faites confirmer le document accepté et les modalités de régularisation au bureau des inscriptions.',
    },
    {
        category: 'Frais',
        question: 'Comment se répartissent les frais académiques ?',
        answer: 'Le barème publié prévoit deux tranches. Le montant dépend de la faculté et de la catégorie du candidat. Le simulateur affiche cette répartition, sans intégrer les frais annexes ou les dépenses personnelles.',
    },
    {
        category: 'Frais',
        question: 'Le total du simulateur comprend-il tous les frais ?',
        answer: 'Non. Il correspond aux frais académiques publiés. Le dossier, les tests, les frais annexes, la farde et les dépenses de vie étudiante sont distincts. Faites confirmer le montant exigible et les modalités de paiement auprès du service.',
    },
    {
        category: 'International',
        question: 'Les candidats étrangers peuvent-ils postuler ?',
        answer: 'Une catégorie tarifaire est prévue pour les candidats étrangers. Les équivalences, les justificatifs administratifs et les exigences de séjour applicables à votre situation doivent être précisés par le service compétent.',
    },
    {
        category: 'Dossier',
        question: 'Un test ou un examen médical est-il prévu ?',
        answer: 'Le flyer mentionne une vérification de l’aptitude physique et un test d’admission, ainsi qu’un concours. Renseignez-vous sur les épreuves, leur date et leur application à la faculté choisie avant votre déplacement.',
    },
    {
        category: 'Dossier',
        question: 'Où obtenir le formulaire et la farde USK ?',
        answer: 'Ils sont à retirer ou à acheter auprès du service des inscriptions sur le campus. Le formulaire est annoncé gratuit pour Droit, Sciences sociales et Théologie, et à 30 $ pour les deux facultés de santé.',
    },
    {
        category: 'Campus',
        question: 'Où se trouve le bureau des inscriptions ?',
        answer: 'Rendez-vous à l’Université Simon Kimbangu, n° 44 avenue Bongolo, quartier Kauka, commune de Kalamu à Kinshasa. Contactez l’équipe avant votre visite pour confirmer les horaires et les documents à emporter.',
    },
    {
        category: 'Frais',
        question: 'À qui s’adresse l’inscription spéciale ?',
        answer: 'Le flyer et la page officielle présentent un barème spécifique. Son champ d’application et les conditions d’accès ne sont pas détaillés ici : faites confirmer que ce régime correspond à votre dossier avant de l’utiliser.',
    },
    {
        category: 'Dossier',
        question: 'Créer un espace candidat confirme-t-il mon admission ?',
        answer: 'La création du compte prépare votre démarche sur cette plateforme. L’inscription devient effective après les vérifications et la confirmation du service compétent de l’université.',
    },
];
export function calculateAcademicFees(facultyId: string, category: CandidateCategory, regime: AdmissionRegime = 'standard') {
    const faculty = admissionFaculties.find((f) => f.id === facultyId);
    if (!faculty) throw new Error('Faculté inconnue');
    const plan = regime === 'special' ? specialPlans[category] : faculty.tuition[category];
    return { ...plan, total: plan.first + plan.second };
}
export const formatUSD = (value: number) => `${new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 0 }).format(value)} $`;
export const normalizeFacultyName = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
