<?php

return [
    // Empty: use the current open year, otherwise October–September around today (Kinshasa).
    'year' => env('DEMO_ACADEMIC_YEAR'),
    // Empty: a new random password is generated once, displayed only in the CLI.
    'password' => env('DEMO_ACCOUNTS_PASSWORD'),
    'students_per_level' => 3,
];
