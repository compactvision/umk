<?php

namespace Tests\Feature;

use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Services\FacultyService;
use Database\Seeders\LandingLevelsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LandingLevelsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_level_shows_only_its_own_courses_with_semesters_and_credits(): void
    {
        $faculty = Faculty::create(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $level = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 1', 'code' => 'L1', 'is_active' => true]);
        $other = Level::create(['faculty_id' => $faculty->id, 'title' => 'Licence 2', 'code' => 'L2', 'is_active' => true]);
        (new \App\Models\Courses)->forceFill(['level_id' => $level->id, 'title' => 'Droit civil', 'credits' => 6, 'semester' => 2])->save();
        (new \App\Models\Courses)->forceFill(['level_id' => $other->id, 'title' => 'Autre niveau', 'credits' => 5, 'semester' => 1])->save();
        $this->get('/course/'.$level->id)->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('courses/CourseShow')->has('course.courses', 1)
            ->where('course.courses.0.title', 'Droit civil')
            ->where('course.courses.0.credits', 6)->where('course.courses.0.semester', 2));
        $this->get('/course/'.$other->id)->assertOk();
        $level->update(['is_active' => false]);
        $this->get('/course/'.$level->id)->assertNotFound();
    }

    public function test_levels_are_prepared_inactively_without_overwriting_existing_data(): void
    {
        Storage::fake('public');
        foreach (['MED', 'SP', 'SSPA', 'DR', 'THEO'] as $code) {
            Faculty::create(['name' => 'Faculté '.$code, 'code' => $code]);
        }
        $faculty = Faculty::where('code', 'MED')->firstOrFail();
        $existing = Level::create(['faculty_id' => $faculty->id, 'title' => 'Nom conservé', 'code' => 'L1', 'is_active' => true]);
        $detail = LevelDetail::create(['level_id' => $existing->id, 'price' => 123, 'course_objective' => 'Objectif existant']);

        $this->seed(LandingLevelsSeeder::class);
        $this->seed(LandingLevelsSeeder::class);

        $this->assertDatabaseCount('levels', 15);
        $this->assertDatabaseCount('level_details', 15);
        $this->assertDatabaseCount('admission_conditions', 135);
        $this->assertSame(14, Level::where('is_active', false)->count());
        $this->assertSame('Nom conservé', $existing->fresh()->title);
        $this->assertEquals(123, $detail->fresh()->price);
        $this->assertSame('Objectif existant', $detail->fresh()->course_objective);
        foreach (Level::all() as $level) {
            Storage::disk('public')->assertExists($level->image);
            Storage::disk('public')->assertExists($level->detail->illustration_image);
            $this->assertSame(9, $level->admissionConditions()->count());
        }
        $public = app(FacultyService::class)->getWithLevels();
        $this->assertSame(1, $public->sum(fn ($faculty) => $faculty->levels->count()));
        $inactive = Level::where('is_active', false)->firstOrFail();
        $this->get('/course/'.$inactive->id)->assertNotFound();
    }
}
