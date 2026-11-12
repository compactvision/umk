<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\CardIssuance;
use App\Models\Student\CardTemplate;
use App\Models\Student\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CardRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_requires_a_review_of_the_current_profile_photo_and_confirmed_tuition(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage academic access', 'web'));
        $student = User::factory()->create();
        $student->assignRole(Role::findOrCreate('student', 'web'));
        $profile = StudentProfile::create(['user_id' => $student->id, 'student_status' => 'active']);
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = Level::create(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $context = ['level_id' => $level->id, 'academic_year_id' => $year->id, 'matricule' => 'EX-26-001'];
        $application = Enrollment::create($context + ['student_id' => $student->id, 'status' => 'submitted']);
        $entry = AcademicEnrollment::create($context + [
            'student_profile_id' => $profile->id,
            'application_id' => $application->id,
            'enrollment_status' => 'confirmed',
            'currency' => 'USD',
        ]);
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Première tranche', 'installment' => 1, 'amount_cents' => 5000]);
        $payment = $entry->payments()->create([
            'uuid' => Str::uuid(), 'kind' => 'tuition', 'amount_cents' => 5000, 'currency' => 'USD',
            'status' => 'pending', 'method' => 'cash', 'reference' => 'EX-TUITION', 'recorded_by' => $admin->id,
        ]);
        $prefix = 'dashboard.admin.card-requests.';
        $index = route($prefix.'index', ['q' => 'EX-26']);
        $review = route($prefix.'review', $entry);
        $assertRow = fn (string $status, bool $ready, int $paid) => $this->get($index)
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/cardRequests/Index')
                ->has('rows.data', 1)->where('rows.data.0.photo_status', $status)->where('rows.data.0.ready', $ready)
                ->where('rows.data.0.fees.paid', $paid));

        $this->actingAs($admin);
        $assertRow('none', false, 0);
        Storage::disk('local')->put('student-profiles/photo.jpg', 'private photo');
        $profile->forceFill(['photo_path' => 'student-profiles/photo.jpg', 'photo_mime' => 'image/jpeg'])->save();
        $version = $profile->cardPhotoVersion();
        $photo = route($prefix.'photo', [$entry, 'v' => $version]);
        $this->actingAs($student)->get($photo)->assertForbidden();
        $this->actingAs($student)->patch($review, ['status' => 'approved', 'version' => $version])->assertForbidden();
        $this->actingAs($admin)->get($photo)->assertOk()->assertHeader('Content-Type', 'image/jpeg');
        $this->from($index)->patch($review, ['status' => 'refused', 'version' => $version])->assertSessionHasErrors('decision_note');
        $this->from($index)->patch($review, ['status' => 'approved', 'version' => $version])->assertSessionHasNoErrors();
        $assertRow('approved', false, 0);

        app(\App\Modules\Student\Application\Services\StudentFinanceService::class)->transition($payment, $admin, 'confirmed', 'Contrôle du versement pour la carte.');
        $assertRow('approved', true, 5000);
        app(\App\Modules\Student\Application\Services\StudentFinanceService::class)->transition($payment, $admin, 'cancelled', 'Contrepassation documentée pour la carte.');
        $assertRow('approved', false, 0);

        Storage::disk('local')->put('student-profiles/replacement.jpg', 'new private photo');
        $profile->forceFill(['photo_path' => 'student-profiles/replacement.jpg'])->save();
        $assertRow('pending', false, 0);
        $this->get($photo)->assertNotFound();
        $this->from($index)->patch($review, ['status' => 'approved', 'version' => $version])->assertSessionHasErrors('photo');
        $this->from($index)->patch($review, [
            'status' => 'refused', 'version' => $profile->cardPhotoVersion(), 'decision_note' => 'Visage hors cadre.',
        ])->assertSessionHasNoErrors();
        $assertRow('refused', false, 0);
        $this->actingAs($student)->get(route('dashboard.student.index', ['section' => 'card', 'academic' => $entry->id]))
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/student/Portal')
                ->where('card_eligibility.photo_status', 'refused')
                ->where('card_eligibility.decision_note', 'Visage hors cadre.'));

    }

    public function test_only_an_eligible_print_can_enter_delivery_and_collection_is_final(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage academic access', 'web'));
        $student = User::factory()->create();
        $profile = StudentProfile::create(['user_id' => $student->id, 'student_status' => 'active']);
        Storage::disk('local')->put('student-profiles/print.jpg', 'private photo');
        $profile->forceFill(['photo_path' => 'student-profiles/print.jpg', 'photo_mime' => 'image/jpeg'])->save();
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Sciences', 'code' => 'SC']);
        $level = Level::create(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1']);
        $year = AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $context = ['level_id' => $level->id, 'academic_year_id' => $year->id, 'matricule' => 'PRINT-001'];
        $application = Enrollment::create($context + ['student_id' => $student->id, 'status' => 'submitted']);
        $entry = AcademicEnrollment::create($context + [
            'student_profile_id' => $profile->id, 'application_id' => $application->id, 'enrollment_status' => 'confirmed', 'currency' => 'USD',
        ]);
        $entry->cardRequest()->create(['photo_version' => $profile->cardPhotoVersion(), 'status' => 'approved']);
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Première tranche', 'installment' => 1, 'amount_cents' => 5000]);
        $payment = $entry->payments()->create([
            'uuid' => Str::uuid(), 'kind' => 'tuition', 'amount_cents' => 5000, 'currency' => 'USD',
            'status' => 'pending', 'method' => 'cash', 'reference' => 'PRINT-TUITION', 'recorded_by' => $admin->id,
        ]);
        $template = CardTemplate::create(['name' => 'USK Sciences', 'institution' => 'Université Simon Kimbangu', 'heading' => 'Badge étudiant', 'color' => '#174d37']);
        $prefix = 'dashboard.admin.card-issuance.';
        $list = route($prefix.'printing');
        $delivery = route($prefix.'delivery');
        $preview = route($prefix.'preview', ['enrollment' => $entry->id, 'template' => $template->id]);
        $printed = route($prefix.'printed', $entry);

        $this->actingAs($student)->get($preview)->assertForbidden();
        $this->actingAs($admin)->get($list)->assertInertia(fn (Assert $page) => $page->has('rows', 0));
        $this->get($preview)->assertRedirect($list);
        app(\App\Modules\Student\Application\Services\StudentFinanceService::class)->transition($payment, $admin, 'confirmed', 'Contrôle du versement pour la carte.');
        $this->get($list)->assertInertia(fn (Assert $page) => $page->has('rows', 1)->where('rows.0.matricule', 'PRINT-001'));
        $response = $this->get($preview)->assertInertia(fn (Assert $page) => $page->component('dashboard/cardIssuance/Preview')
            ->where('identity.matricule', 'PRINT-001')->where('identity.faculty', 'Sciences')
            ->where('template.id', $template->id)->has('identity.photo')->has('version'));
        $payload = ['version' => $response->viewData('page')['props']['version'], 'template' => $template->id];
        $check = route($prefix.'check', ['enrollment' => $entry->id] + $payload);

        $this->getJson($check)->assertOk()->assertJson(['ready' => true]);
        $this->get($delivery)->assertInertia(fn (Assert $page) => $page->has('cards.data', 0));
        app(\App\Modules\Student\Application\Services\StudentFinanceService::class)->transition($payment, $admin, 'cancelled', 'Contrepassation documentée pour la carte.');
        $this->getJson($check)->assertUnprocessable();
        $this->from($preview)->post($printed, $payload)->assertSessionHasErrors('card');
        $this->assertDatabaseCount('student_card_issuances', 0);
        $finance = app(\App\Modules\Student\Application\Services\StudentFinanceService::class);
        $replacement = $finance->record($entry, $admin, ['kind' => 'tuition', 'amount' => \App\Modules\Student\Application\Services\Money::decimal((int)$payment->amount_cents), 'method' => 'cash', 'reference' => 'CARD-REPLACEMENT', 'note' => 'Nouveau versement après contrepassation.']);
        $finance->transition($replacement, $admin, 'confirmed', 'Contrôle du versement de remplacement.');

        $this->from($preview)->post($printed, $payload)->assertRedirect($delivery)->assertSessionHasNoErrors();
        $card = CardIssuance::sole();
        $this->assertSame($admin->id, $card->printed_by);
        $this->assertSame('USK Sciences', $card->template_name);
        $this->from($preview)->post($printed, $payload)->assertSessionHasErrors('card');
        $this->get($list)->assertInertia(fn (Assert $page) => $page->has('rows', 0));
        $this->get($delivery)->assertInertia(fn (Assert $page) => $page->component('dashboard/cardIssuance/Delivery')
            ->has('cards.data', 1)->where('cards.data.0.collected_at', null));

        $collect = route($prefix.'collect', $card);
        $this->actingAs($student)->patch($collect)->assertForbidden();
        $this->actingAs($admin)->from($delivery)->patch($collect)->assertSessionHasNoErrors();
        $this->assertSame($admin->id, $card->fresh()->collected_by);
        $this->from($delivery)->patch($collect)->assertSessionHasErrors('card');
        $this->get($delivery)->assertInertia(fn (Assert $page) => $page->has('cards.data', 0));
        $this->get(route($prefix.'delivery', ['status' => 'collected']))->assertInertia(fn (Assert $page) => $page
            ->has('cards.data', 1)->where('cards.data.0.matricule', 'PRINT-001'));
    }
}
