<?php

namespace Database\Seeders;

use App\Modules\Teaching\Application\Services\CurrentYearTeachingAssignments;
use Illuminate\Database\Seeder;

class CurrentYearTeachingAssignmentsSeeder extends Seeder
{
    public function run(): void
    {
        $plan = app(CurrentYearTeachingAssignments::class)->apply();
        $counts = collect($plan['items'])->countBy('action');
        $this->command?->info($plan['year']['title'].' : '.($counts['create'] ?? 0).' créations, '.($counts['update'] ?? 0).' réaffectations, '.($counts['keep'] ?? 0).' affectations conservées.');
    }
}
