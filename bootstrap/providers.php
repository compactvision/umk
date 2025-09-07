<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modules\Identity\Infrastructure\Providers\IdentityServiceProvider::class,
    App\Modules\AcademicYear\Infrastructure\Providers\AcademicYearServiceProvider::class,
    App\Modules\Faculty\Infrastructure\Providers\FacultyServiceProvider::class,
    App\Modules\Level\Infrastructure\Providers\LevelServiceProvider::class,
    App\Modules\LevelDetail\Infrastructure\Providers\LevelDetailServiceProvider::class,
    App\Modules\AdmissionCondition\Infrastructure\Providers\AdmissionConditionServiceProvider::class,
];
