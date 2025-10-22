<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Models\Level;

final class ListLevelsByFaculty {
    public function __invoke() {
        return Level::query()
          ->where('is_active', true)
          ->with('faculty:id,name')
          ->get(['id','title','code','faculty_id']);
    }
}