<?php

return [
    'queue_notices' => (bool) env('OFFICIAL_DOCUMENT_QUEUE_NOTICES', false),
    'queue_issuance' => (bool) env('OFFICIAL_DOCUMENT_QUEUE_ISSUANCE', false),
];
