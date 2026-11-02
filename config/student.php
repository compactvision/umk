<?php

return [
    'currency' => 'USD',
    'payment_verifier' => null, // Adapter selected explicitly by the institution; no provider is assumed.
    'features' => ['dashboard_view', 'profile_view', 'courses_view', 'schedule_view', 'payments_view', 'administrative_support', 'materials_download', 'assignments_submit', 'evaluations_participate', 'results_view', 'documents_request'],
    'requires_rule' => ['materials_download', 'assignments_submit', 'evaluations_participate', 'documents_request'],
    'essential' => ['dashboard_view', 'profile_view', 'payments_view', 'administrative_support'],
    'regulated' => ['results_view', 'evaluations_participate'],
];
