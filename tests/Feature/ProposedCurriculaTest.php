<?php

namespace Tests\Feature;

use App\Models\Courses;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Modules\LevelDetail\Application\Services\CourseCatalog;
use Database\Seeders\ProposedCurriculaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProposedCurriculaTest extends TestCase
{
    use RefreshDatabase;

    private function levels(): void
    {
        foreach (['MED', 'SP', 'SSPA', 'DR', 'THEO'] as $code) {
            $faculty = DB::table('faculties')->insertGetId(['name' => $code, 'code' => $code]);
            foreach ([1, 2, 3] as $year) {
                $level = Level::create(['faculty_id' => $faculty, 'title' => 'Licence '.$year, 'code' => 'L'.$year]);
                LevelDetail::create(['level_id' => $level->id, 'credit_required' => $year === 1 ? 60 : null]);
            }
        }
    }

    public function test_every_program_has_two_balanced_semesters_and_can_be_seeded_twice(): void
    {
        $this->levels();
        $this->seed(ProposedCurriculaSeeder::class);
        $this->seed(ProposedCurriculaSeeder::class);
        $this->assertDatabaseCount('courses', 180);
        foreach (Level::with('detail')->get() as $level) {
            $this->assertEquals(60, $level->detail->credit_required);
            $this->assertEquals(12, $level->detail->courses_number);
            foreach ([1, 2] as $semester) {
                $this->assertEquals(30, Courses::where('level_id', $level->id)->where('semester', $semester)->sum('credits'));
            }
        }
    }

    public function test_seed_does_not_exceed_an_existing_lower_limit(): void
    {
        $this->levels();
        LevelDetail::query()->first()->update(['credit_required' => 40]);
        try {
            $this->seed(ProposedCurriculaSeeder::class);
            $this->fail('Le plafond devait bloquer le programme.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('plafond', $exception->getMessage());
            $this->assertDatabaseCount('courses', 0);
        }
    }

    public function test_full_program_rejects_extra_credits_and_allows_editing_without_double_counting(): void
    {
        $this->levels();
        $this->seed(ProposedCurriculaSeeder::class);
        $course = Courses::first();
        $catalog = app(CourseCatalog::class);
        $catalog->save($course->level_id, ['title' => 'Intitulé corrigé', 'credits' => $course->credits, 'semester' => 2], $course->id);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'title' => 'Intitulé corrigé']);
        $this->expectException(ValidationException::class);
        $catalog->save($course->level_id, ['title' => 'Cours en trop', 'credits' => 1, 'semester' => 1]);
    }
}
