<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Faculty as ModelsFaculty;

final class ListActiveFaculties {
    public function __invoke() {
        return ModelsFaculty::query()->where('is_active', true)->orderBy('name')->get(['id','name']);
    }
}