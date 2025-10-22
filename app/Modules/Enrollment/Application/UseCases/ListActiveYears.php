<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\AcademicYear;

final class ListActiveYears {
    public function __invoke() {
        return AcademicYear::query()
          ->where('status', 'open')->orderBy('start_date', 'desc')
          ->get(['id','title','status']);
    }
}