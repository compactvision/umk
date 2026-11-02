<?php

return [
    'built_assets' => env('VITE_USE_BUILD', false),
    'origin' => env('SEO_SITE_URL'),
    'indexable' => env('SEO_INDEXABLE', false),
    'enforce_origin' => env('SEO_ENFORCE_ORIGIN', false),
    'search_console' => env('GOOGLE_SITE_VERIFICATION'),
    'identity' => [
        'name' => 'Université Simon Kimbangu', 'email' => 'contact@universitesk.net',
        'phone' => '+243 894 465 813', 'address' => 'N° 44, avenue Bongolo, quartier Kauka, Kalamu, Kinshasa, RDC',
        'city' => 'Kinshasa', 'country' => 'CD',
        'legal_form' => '', 'registration' => '', 'publication_director' => '', 'host_name' => '', 'host_contact' => '',
        'privacy_contact' => '', 'retention_policy' => '', 'refund_policy' => '', 'legal_basis' => '', 'international_transfers' => '', 'minors_policy' => '',
    ],
    'pages' => [
        '/' => ['title' => 'Université Simon Kimbangu à Kinshasa — Facultés et admissions', 'description' => 'Découvrez l’Université Simon Kimbangu à Kinshasa : ses facultés, ses formations, les admissions et les actualités de la vie universitaire.', 'heading' => 'Le savoir pour grandir. La conscience pour agir.'],
        '/about' => ['title' => 'L’Université Simon Kimbangu — Histoire, missions et gouvernance', 'description' => 'Découvrez l’histoire, les missions, la gouvernance et l’engagement de l’Université Simon Kimbangu au service de la formation et de la recherche à Kinshasa.', 'heading' => 'L’Université Simon Kimbangu'],
        '/courses' => ['title' => 'Facultés et formations à Kinshasa — Université Simon Kimbangu', 'description' => 'Explorez les facultés et les niveaux de formation ouverts à l’Université Simon Kimbangu. Consultez les programmes et les conditions d’admission.', 'heading' => 'Facultés et formations'],
        '/admission' => ['title' => 'Admissions et inscription à Kinshasa — Université Simon Kimbangu', 'description' => 'Préparez votre candidature à l’Université Simon Kimbangu : facultés, pièces à fournir, étapes d’inscription et informations sur les frais académiques.', 'heading' => 'Préparer votre admission à l’USK'],
        '/blog' => ['title' => 'Actualités et vie universitaire — Université Simon Kimbangu', 'description' => 'Consultez les actualités publiées par l’Université Simon Kimbangu : recherche, activités académiques et vie du campus à Kinshasa.', 'heading' => 'Actualités universitaires'],
        '/contact' => ['title' => 'Contacter l’USK à Kalamu, Kinshasa — Université Simon Kimbangu', 'description' => 'Retrouvez l’adresse, le téléphone et l’email de l’Université Simon Kimbangu à Kalamu, Kinshasa, pour vos questions sur les études et les admissions.', 'heading' => 'Contacter l’Université Simon Kimbangu'],
        '/tuitions' => ['title' => 'Frais académiques et renseignements — Université Simon Kimbangu', 'description' => 'Renseignez-vous sur les frais académiques de l’Université Simon Kimbangu selon la faculté, le niveau et l’année, auprès du service des admissions.', 'heading' => 'Les frais académiques'],
        '/plan-du-site' => ['title' => 'Plan du site — Université Simon Kimbangu', 'description' => 'Accédez aux facultés, aux formations, aux admissions, aux actualités et aux informations publiques de l’Université Simon Kimbangu.', 'heading' => 'Plan du site'],
    ],
    'legal' => [
        'privacy' => ['path' => '/politique-de-confidentialite', 'title' => 'Politique de confidentialité'],
        'terms' => ['path' => '/conditions-generales-utilisation', 'title' => 'Conditions générales d’utilisation'],
        'notices' => ['path' => '/mentions-legales', 'title' => 'Mentions légales'],
        'cookies' => ['path' => '/politique-des-cookies', 'title' => 'Politique des cookies'],
        'enrollment' => ['path' => '/conditions-inscription', 'title' => 'Conditions générales d’inscription'],
        'accessibility' => ['path' => '/accessibilite', 'title' => 'Accessibilité'],
    ],
];
