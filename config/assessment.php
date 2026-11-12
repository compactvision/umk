<?php

return [
    'queue_notices' => (bool) env('ASSESSMENT_QUEUE_NOTICES', false),
    'categories' => [
        'assignment' => 'Devoir', 'practical' => 'Travaux pratiques', 'tutorial' => 'Travaux dirigés',
        'project' => 'Projet', 'quiz' => 'Interrogation', 'continuous' => 'Contrôle continu', 'exam' => 'Examen',
    ],
];
