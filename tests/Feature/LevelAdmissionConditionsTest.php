<?php

namespace Tests\Feature;

use App\Models\Faculty;
use App\Models\Level;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LevelAdmissionConditionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creation_returns_to_the_conditions_tab_without_a_referrer(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = Faculty::create(['name' => 'Sciences', 'code' => 'SCI']);
        $level = $faculty->levels()->create(['title' => 'Licence 1', 'code' => 'L1']);
        $tab = route('dashboard.admin.levels.details.show', ['id' => $level->id, 'tab' => 'conditions']);
        $data = ['faculty_id' => $faculty->id, 'level_id' => $level->id, 'section' => 'academic_info', 'is_required' => true];
        $store = route('dashboard.admin.levels.admission-conditions.store');

        $this->actingAs($admin)->post($store, $data)->assertRedirect($tab)->assertSessionHasErrors('title');
        $this->post($store, $data + ['title' => 'Diplôme requis'])->assertRedirect($tab)->assertStatus(303);
        $this->assertDatabaseHas('admission_conditions', $data + ['title' => 'Diplôme requis']);
    }

    public function test_copy_is_scoped_to_the_previous_level_and_preserves_existing_conditions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = Faculty::create(['name' => 'Sciences', 'code' => 'SCI']);
        $other = Faculty::create(['name' => 'Droit', 'code' => 'DR']);
        [$first, $second, $third] = collect([1, 2, 3])->map(fn ($year) => $faculty->levels()->create([
            'title' => "Licence $year",
            'code' => "L$year",
        ]))->all();
        $otherFirst = $other->levels()->create(['title' => 'Licence 1', 'code' => 'L1']);
        $condition = ['section' => 'academic_info', 'description' => 'Original', 'is_required' => true];
        $first->admissionConditions()->create($condition + ['title' => 'Diplôme', 'faculty_id' => $faculty->id]);
        $first->admissionConditions()->create($condition + ['title' => 'Relevé', 'faculty_id' => $faculty->id]);
        $second->admissionConditions()->create(['description' => 'Consigne L2'] + $condition + ['title' => 'Diplôme', 'faculty_id' => $faculty->id]);
        $otherFirst->admissionConditions()->create($condition + ['title' => 'Autre faculté', 'faculty_id' => $other->id]);
        $copy = 'dashboard.admin.levels.admission-conditions.copy-previous';

        $this->actingAs($admin);
        foreach ([$second, $second, $third] as $level) {
            $this->post(route($copy, $level))->assertRedirect(route('dashboard.admin.levels.details.show', [
                'id' => $level->id, 'tab' => 'conditions',
            ]));
        }

        foreach ([$second, $third] as $level) {
            $this->assertEqualsCanonicalizing(['Diplôme', 'Relevé'], $level->admissionConditions()->pluck('title')->all());
            $this->assertSame('Consigne L2', $level->admissionConditions()->where('title', 'Diplôme')->firstOrFail()->description);
        }
    }
}
