<?php

namespace Tests\Feature;

use App\Mail\EnrollmentSubmitted;
use App\Models\AcademicStructure\AdmissionCampaign;
use App\Models\AcademicYear;
use App\Models\AdmissionCondition;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdmissionConsolidationTest extends TestCase
{
    use RefreshDatabase;

    private function context(): array
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $candidate = User::factory()->create();
        $faculty = Faculty::create(['name' => 'Sciences', 'code' => 'SCI']);
        $level = Level::create(['faculty_id' => $faculty->id, 'code' => 'L1', 'title' => 'Licence']);
        $year = AcademicYear::create(['title' => 'Année ouverte', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);

        return [$admin, $candidate, $faculty, $level, $year];
    }

    private function snapshot(User $candidate, Faculty $faculty, Level $level, AcademicYear $year): array
    {
        return ['faculty_id' => $faculty->id, 'level_id' => $level->id, 'year_id' => $year->id,
            'name' => 'Candidature locale', 'email' => $candidate->email, 'program' => $level->title, 'isConfirmed' => true, 'documents' => []];
    }

    public function test_campaign_controls_requirements_and_receipt_is_sent_once_before_annual_confirmation(): void
    {
        Mail::fake();
        Storage::fake('temp');
        Storage::fake('local');
        [$admin, $candidate, $faculty, $level, $year] = $this->context();
        $structure = app(StructureService::class);
        $common = ['revision' => 0, 'reason' => 'Configuration de test', 'is_active' => true];
        $university = $structure->save('university', $common + ['code' => 'TEST', 'name' => 'Université de test'], $admin);
        $faculty->forceFill(['university_id' => $university->id])->save();
        $cycle = $structure->save('cycle', $common + ['code' => 'C', 'name' => 'Cycle de test', 'normal_duration' => 1, 'progression_mode' => 'annual', 'weighting_mode' => 'credits', 'periods' => [['code' => 'A', 'name' => 'Année']]], $admin);
        $program = $structure->save('program', $common + ['code' => 'P', 'name' => 'Parcours Sciences', 'faculty_id' => $faculty->id, 'academic_cycle_id' => $cycle->id, 'level_ids' => [$level->id]], $admin);
        $campaigns = '/dashboard/admin/enrollments/campaigns';
        $campaign = ['academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $level->id, 'additional_documents' => 'Attestation spécifique', 'reason' => 'Exigence de la campagne'];
        $this->actingAs($admin)->post($campaigns, $campaign + ['is_open' => false])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('admission_cohorts', 0);
        $this->get($campaigns)->assertOk()->assertInertia(fn (Assert $page) => $page->has('campaigns.data', 1)->where('campaigns.data.0.is_open', false));
        $this->get($campaigns.'?level_id='.$level->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('level.id', $level->id)->has('campaigns.data', 1)->where('programs.0.id', $program->id));
        $otherLevel = Level::create(['faculty_id' => $faculty->id, 'code' => 'L2', 'title' => 'Autre niveau']);
        $this->get($campaigns.'?level_id='.$otherLevel->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('level.id', $otherLevel->id)->has('campaigns.data', 0)->has('programs', 0));

        $requirements = '/dashboard/enrollment/requirements?'.http_build_query(['level_id' => $level->id, 'faculty_id' => $faculty->id, 'year_id' => $year->id, 'academic_program_id' => $program->id]);
        $snapshot = $this->snapshot($candidate, $faculty, $level, $year) + ['academic_program_id' => $program->id];
        $this->actingAs($candidate)->getJson($requirements)->assertUnprocessable();
        $draft = $this->postJson('/dashboard/enrollments/save-progress', ['last_step' => 4, 'form_snapshot' => $snapshot])->assertOk()->json('draft.uuid');
        $submit = '/dashboard/enrollments/'.$draft.'/submit';
        $this->post($submit)->assertSessionHasErrors('submit');

        $this->actingAs($admin)->post($campaigns, $campaign + ['is_open' => true])->assertSessionHasNoErrors();
        $this->post($campaigns, $campaign + ['is_open' => true])->assertSessionHasNoErrors();
        $this->assertSame(1, AdmissionCampaign::count());
        $this->assertDatabaseHas('admission_cohorts', ['academic_program_id' => $program->id, 'academic_year_id' => $year->id]);
        $this->assertDatabaseCount('admission_cohorts', 1);
        $cohort = \App\Models\AcademicStructure\AdmissionCohort::sole();
        $cohort->update(['name' => 'Nom personnalisé de la cohorte']);
        $program->levels()->attach($otherLevel->id, ['position' => 2]);
        $this->post($campaigns, array_replace($campaign, ['level_id' => $otherLevel->id, 'is_open' => true]))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('admission_cohorts', 1);
        $this->assertSame('Nom personnalisé de la cohorte', $cohort->fresh()->name);
        $promotion = \App\Models\AcademicStructure\AcademicPromotion::create([
            'academic_program_id' => $program->id, 'academic_year_id' => $year->id, 'level_id' => $level->id,
            'code' => 'PROM-L1', 'name' => 'Promotion L1',
        ]);

        $key = $this->actingAs($candidate)->getJson($requirements)->assertOk()->assertJsonPath('payload.academic_info.0.label', 'Attestation spécifique')->json('payload.academic_info.0.key');
        $this->post($submit)->assertSessionHasErrors('submit');
        $temp = $this->postJson('/dashboard/enrollments/documents/upload', ['key' => $key, 'file' => UploadedFile::fake()->create('preuve.pdf', 10, 'application/pdf')])->assertOk()->json('temp');
        $snapshot['documents'][$key] = ['filename' => $temp['filename'], 'mime' => $temp['mime'], 'temp' => $temp];
        $this->postJson('/dashboard/enrollments/save-progress', ['uuid' => $draft, 'last_step' => 4, 'form_snapshot' => $snapshot])->assertOk();
        $this->post($submit)->assertSessionHasNoErrors()->assertRedirect('/dashboard/enrollments');
        $this->post($submit)->assertSessionHasNoErrors()->assertRedirect('/dashboard/enrollments');
        $entry = Enrollment::where('uuid', $draft)->firstOrFail();
        $this->assertNotEmpty($entry->meta['submitted_at']);
        $this->assertSame($program->id, $entry->form_snapshot['academic_program_id']);
        $this->assertSame(1, $entry->events()->where('event', 'submitted')->count());
        Mail::assertSent(EnrollmentSubmitted::class, 1);
        $this->get('/dashboard/enrollments/'.$draft)->assertInertia(fn (Assert $page) => $page->where('enrollment.requested_program', $program->name)->where('enrollment.submitted_at', $entry->meta['submitted_at']));

        $adminUrl = '/dashboard/admin/enrollments/'.$entry->id;
        $document = $entry->documents()->firstOrFail();
        $this->actingAs($admin)->get('/dashboard/admin/enrollments?'.http_build_query(['queue' => 'new', 'program_id' => $program->id, 'q' => $draft, 'submitted_from' => now()->toDateString()]))->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1));
        $this->post($adminUrl.'/start-analysis')->assertSessionHasNoErrors();
        $this->post($adminUrl.'/documents/'.$document->uuid.'/review', ['verdict' => 'accepted'])->assertSessionHasNoErrors();
        $this->post($adminUrl.'/validate')->assertSessionHasNoErrors();
        $academic = $entry->academicEnrollment()->sole();
        $this->assertSame('pending_confirmation', $academic->enrollment_status);
        $this->assertSame($cohort->id, $academic->admission_cohort_id);
        $this->assertSame($promotion->id, $academic->academic_promotion_id);
        $this->assertNull($academic->class_id);
        $this->assertNull($academic->curriculum_version_id);
        $this->get(route('dashboard.admin.student-academic.show', ['academic' => $academic->id, 'section' => 'Parcours']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentEnrollment.program', $program->name)
                ->where('currentEnrollment.cohort', $cohort->fresh()->name)
                ->where('currentEnrollment.promotion', $promotion->name));
        $this->assertSame($entry->matricule, $candidate->fresh()->studentProfile->matricule);
    }

    public function test_closed_year_expiry_withdrawal_and_duplicate_draft_behaviour(): void
    {
        Mail::fake();
        [, $candidate, $faculty, $level, $year] = $this->context();
        $payload = ['last_step' => 4, 'form_snapshot' => $this->snapshot($candidate, $faculty, $level, $year)];
        $url = '/dashboard/enrollments';
        $uuid = $this->actingAs($candidate)->postJson($url.'/save-progress', $payload)->assertOk()->json('draft.uuid');
        $this->postJson($url.'/save-progress', $payload)->assertOk()->assertJsonPath('draft.uuid', $uuid);
        $entry = Enrollment::where('uuid', $uuid)->firstOrFail();
        $year->update(['status' => 'closed']);
        $this->post($url.'/'.$uuid.'/submit')->assertSessionHasErrors('submit');
        $entry->update(['draft_expires_at' => now()->subDay()]);
        $this->get($url.'/'.$uuid.'/edit')->assertNotFound();
        $this->postJson($url.'/save-progress', $payload + ['uuid' => $uuid])->assertJsonValidationErrors('uuid');
        $this->post($url.'/'.$uuid.'/submit')->assertSessionHasErrors('submit');
        $new = $this->postJson($url.'/save-progress', $payload)->assertOk()->json('draft.uuid');
        $this->assertNotSame($uuid, $new);
        $this->actingAs(User::factory()->create())->post($url.'/'.$new.'/withdraw')->assertNotFound();
        $this->actingAs($candidate)->post($url.'/'.$new.'/withdraw')->assertSessionHasNoErrors();
        $this->post($url.'/'.$new.'/withdraw')->assertSessionHasNoErrors();
        $this->assertSame(1, Enrollment::where('uuid', $new)->firstOrFail()->events()->where('event', 'cancelled')->count());
        $this->assertDatabaseCount('enrollments', 2);
        Mail::assertNothingSent();
    }

    public function test_requirements_are_read_from_the_actual_level_and_faculty_and_admin_permission_is_enforced(): void
    {
        [$admin, $candidate, $faculty, $level] = $this->context();
        $other = Faculty::create(['name' => 'Droit', 'code' => 'DR']);
        $differentLevel = Level::create(['faculty_id' => $other->id, 'code' => 'T1', 'title' => 'Autre']);
        AdmissionCondition::create(['faculty_id' => $other->id, 'level_id' => $differentLevel->id, 'title' => 'Diplôme', 'section' => 'academic_info', 'is_required' => true]);
        $url = '/dashboard/enrollment/requirements?level_id='.$differentLevel->id;
        $this->actingAs($candidate)->getJson($url)->assertOk()->assertJsonPath('payload.academic_info.0.key', 'diplome');
        $this->getJson($url.'&faculty_id='.$faculty->id)->assertUnprocessable();
        $admin->roles()->firstOrFail()->revokePermissionTo('manage academic access');
        $this->actingAs($admin->fresh())->get('/dashboard/admin/enrollments')->assertForbidden();
        $this->post('/dashboard/admin/notifications/read-all')->assertForbidden();
    }
}
