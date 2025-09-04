<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modules\Identity\Infrastructure\Providers\IdentityServiceProvider::class,
    App\Modules\AcademicYear\Infrastructure\Providers\AcademicYearServiceProvider::class,
    App\Modules\Faculty\Providers\FacultyServiceProvider::class,
];
