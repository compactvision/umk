<?php

namespace Tests\Feature;

use App\Models\Professor;
use Database\Seeders\DemoProfessorsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoProfessorsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_profiles_are_repeatable_and_preserve_administrative_edits(): void
    {
        $this->seed(DemoProfessorsSeeder::class);
        $this->assertDatabaseCount('professors', 20);
        $professor = Professor::where('email', 'jean-pierre.kabeya@enseignants.example.test')->firstOrFail();
        $professor->update(['speciality' => 'Spécialité modifiée', 'is_active' => false]);
        $this->seed(DemoProfessorsSeeder::class);
        $this->assertDatabaseCount('professors', 20);
        $this->assertDatabaseHas('professors', ['id' => $professor->id, 'speciality' => 'Spécialité modifiée', 'is_active' => false]);
        $this->assertTrue(Professor::all()->every(fn ($p) => str_ends_with($p->email, '.test') && str_contains($p->biography, 'fictif')));
        $this->assertDatabaseCount('academic_offerings', 0);
    }
}
