<?php

return [
    'currencies' => ['USD', 'CDF'], // Existing minor-unit ledger: two decimal places; no implicit conversion.
    'methods' => ['cash', 'bank_transfer', 'other'],
    'dual_control' => false, // Preserve existing authorization; institution can require a different confirmer.
    'max_import_rows' => 500,
];
