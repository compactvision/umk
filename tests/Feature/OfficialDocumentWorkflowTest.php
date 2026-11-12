<?php

namespace Tests\Feature;

use App\Models\AcademicStructure\University;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AccessRule;
use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Documents\Application\DocumentAccess;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class OfficialDocumentWorkflowTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const ADMIN = 'dashboard.admin.official-documents.';

    private const STUDENT = 'dashboard.student.official-documents.';

    public function test_controlled_issuance_private_archive_and_public_status(): void
    {
        Storage::fake('local');
        [$student, $entry, $university, $manager, $signer, $issuer] = $this->context();
        $type = $this->catalog($entry, $university, $manager, $signer);
        $data = ['type_id' => $type->id, 'action' => 'initial', 'reason' => 'Attestation pour mon dossier.', 'operation_key' => (string) Str::uuid()];
        $submit = route(self::STUDENT.'submit', ['academic' => $entry->id]);
        $this->actingAs($student)->get(route('dashboard.student.index', ['section' => 'documents', 'academic' => $entry->id]))
            ->assertInertia(fn (Assert $page) => $page->where('document_center.types.0.id', $type->id));
        $this->post($submit, $data)->assertStatus(303);
        $this->post($submit, $data)->assertStatus(303);
        $this->postJson($submit, array_replace($data, ['operation_key' => (string) Str::uuid()]))->assertUnprocessable();
        $ticket = ServiceRequest::sole();
        $transition = route(self::ADMIN.'transition', $ticket);
        $issue = route(self::ADMIN.'issue', $ticket);
        $this->actingAs($issuer)->postJson($issue, ['revision' => 1])->assertUnprocessable();
        $this->actingAs($manager)->post($transition, ['action' => 'correct', 'revision' => 1, 'reason' => 'Précisez le motif.'])->assertStatus(303);
        $this->actingAs($student)->post(route(self::STUDENT.'transition', ['ticket' => $ticket->id, 'academic' => $entry->id]), [
            'action' => 'resubmit', 'revision' => 2, 'reason' => 'Attestation requise pour mon stage.',
        ])->assertStatus(303);
        $this->actingAs($manager)->post($transition, ['action' => 'review', 'revision' => 3, 'reason' => 'Dossier contrôlé.'])->assertStatus(303);
        $approval = ['action' => 'approve', 'revision' => 4, 'reason' => 'Approbation de la version.'];
        $this->post($transition, $approval)->assertForbidden();
        $this->actingAs($signer)->post($transition, $approval)->assertStatus(303);
        $this->actingAs($issuer)->postJson($issue, ['revision' => 4])->assertUnprocessable();
        $this->post($issue, ['revision' => 5])->assertStatus(303);
        $this->post($issue, ['revision' => 5])->assertStatus(303);
        $document = OfficialDocument::sole();
        $this->assertMatchesRegularExpression('/^ATT-\d{4}-\d{8}$/', $document->number);
        $path = "official-documents/{$document->reference}.pdf";
        $bytes = Storage::disk('local')->get($path);
        $this->assertStringStartsWith('%PDF-', $bytes);
        $this->assertSame(hash('sha256', $bytes), $document->sha256);
        $download = route(self::STUDENT.'download', ['academic' => $entry->id, 'document' => $document->reference]);
        $this->actingAs($student)->get($download)->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $other = User::factory()->create()->assignRole('student');
        $this->actingAs($other)->get($download)->assertForbidden();
        $public = route('official-documents.verify', $document->reference);
        auth()->logout();
        $this->get($public)->assertOk()->assertSee($document->number)->assertSee('Valide')
            ->assertDontSee($entry->matricule)->assertDontSee($student->full_name)->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $this->get(route('official-documents.verify', (string) Str::uuid()))->assertNotFound();
        $this->actingAs($student);
        Storage::disk('local')->put($path, 'archive altérée');
        $this->get($download)->assertStatus(503);
        Storage::disk('local')->put($path, $bytes);
        $this->post($submit, array_replace($data, [
            'action' => 'duplicate', 'previous_id' => $document->id, 'operation_key' => (string) Str::uuid(),
        ]))->assertStatus(303);
        $this->approveAndIssue(ServiceRequest::latest('id')->firstOrFail(), $manager, $signer, $issuer);
        $copy = OfficialDocument::latest('id')->firstOrFail();
        $this->assertSame($document->id, $copy->previous_id);
        $this->assertNotSame($document->number, $copy->number);
        $this->assertSame($document->snapshot['student'], $copy->snapshot['student']);
        $this->assertSame('valid', $document->fresh()->validity());
        $this->actingAs($issuer)->post(route(self::ADMIN.'lifecycle', $document), ['action' => 'revoke', 'reason' => 'Révocation documentée.'])->assertStatus(303);
        $this->get($public)->assertSee('Révoqué');
        $this->actingAs($student)->get($download)->assertNotFound();
        $this->assertSame($bytes, Storage::disk('local')->get($path));
        $notice = $student->notifications()->get()->firstWhere('data.status', 'issued');
        $this->assertNotNull($notice);
        $this->post(route('dashboard.notifications.open', $notice->id))->assertRedirect(route('dashboard.student.index', ['section' => 'documents', 'academic' => $entry->id]));
    }

    public function test_scopes_and_success_without_certified_result_are_rejected(): void
    {
        [$student, $entry, $university, $manager, $signer, $issuer] = $this->context();
        $type = $this->catalog($entry, $university, $manager, $signer, 'success');
        $this->actingAs($student)->postJson(route(self::STUDENT.'submit', ['academic' => $entry->id]), [
            'type_id' => $type->id, 'action' => 'initial', 'reason' => 'Dossier académique incomplet.', 'operation_key' => (string) Str::uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors('result');
        $outsider = $this->staff(DocumentAccess::ISSUE);
        $other = $university->faculties()->create(['name' => 'Autre faculté', 'code' => 'OTHER']);
        $outsider->academicFaculties()->attach($other);
        $this->actingAs($outsider)->get(route(self::ADMIN.'index', ['academic' => $entry->id]))->assertNotFound();
        $this->actingAs($issuer)->get(route(self::ADMIN.'index'))
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/officialDocuments/Administration')->where('types.data.0.id', $type->id));
        $this->assertDatabaseCount('official_documents', 0);
    }

    public function test_card_requires_photo_and_payment_and_replacement_preserves_both_archives(): void
    {
        Storage::fake('local');
        [$student, $entry, $institution, $manager, $signer, $issuer] = $this->context();
        $type = $this->catalog($entry, $institution, $manager, $signer, 'card');
        $data = ['type_id' => $type->id, 'action' => 'initial', 'reason' => 'Demande de carte étudiante.', 'operation_key' => (string) Str::uuid()];
        $submit = route(self::STUDENT.'submit', ['academic' => $entry->id]);
        $this->actingAs($student)->postJson($submit, $data)->assertUnprocessable()->assertJsonValidationErrors('type');
        $photo = UploadedFile::fake()->image('portrait.png', 120, 144);
        Storage::disk('local')->put('student-profiles/portrait.png', $photo->get());
        $entry->profile->forceFill(['photo_path' => 'student-profiles/portrait.png', 'photo_mime' => 'image/png'])->save();
        $entry->cardRequest()->create(['photo_version' => $entry->profile->cardPhotoVersion(), 'status' => 'approved']);
        $entry->obligations()->create(['kind' => 'tuition', 'title' => 'Première tranche', 'installment' => 1, 'amount_cents' => 5000]);
        $payment = $entry->payments()->create([
            'uuid' => Str::uuid(), 'kind' => 'tuition', 'amount_cents' => 5000, 'currency' => 'USD',
            'status' => 'pending', 'method' => 'cash', 'reference' => 'CARD-P12', 'recorded_by' => $manager->id,
        ]);
        $this->postJson($submit, $data)->assertUnprocessable()->assertJsonValidationErrors('type');
        app(StudentFinanceService::class)->transition($payment, $manager, 'confirmed', 'Versement vérifié.');
        $this->post($submit, $data)->assertStatus(303);
        $this->approveAndIssue(ServiceRequest::sole(), $manager, $signer, $issuer);
        $card = OfficialDocument::sole();
        $public = route('official-documents.verify', $card->reference);
        $this->assertNotNull($card->expires_at);
        $this->get($public)->assertSee('En attente de remise');
        $lifecycle = route(self::ADMIN.'lifecycle', $card);
        $this->postJson($lifecycle, ['action' => 'deliver', 'reason' => 'Remise au titulaire.'])->assertUnprocessable();
        $this->post($lifecycle, ['action' => 'print', 'reason' => 'Impression recto verso.'])->assertStatus(303);
        $this->post($lifecycle, ['action' => 'deliver', 'reason' => 'Remise au titulaire.'])->assertStatus(303);
        $this->get($public)->assertSee('Valide');
        $this->actingAs($student)->postJson($submit, array_replace($data, [
            'action' => 'duplicate', 'previous_id' => $card->id, 'operation_key' => (string) Str::uuid(),
        ]))->assertUnprocessable();
        $this->post($submit, array_replace($data, [
            'action' => 'replace', 'previous_id' => $card->id, 'operation_key' => (string) Str::uuid(), 'reason' => 'Carte perdue, remplacement demandé.',
        ]))->assertStatus(303);
        $this->approveAndIssue(ServiceRequest::latest('id')->firstOrFail(), $manager, $signer, $issuer);
        $replacement = OfficialDocument::latest('id')->firstOrFail();
        $this->assertSame($card->id, $replacement->previous_id);
        $this->assertNotSame($card->number, $replacement->number);
        $this->assertSame('pending', $replacement->validity());
        $this->get($public)->assertSee('Remplacé');
        Storage::disk('local')->assertExists(["official-documents/{$card->reference}.pdf", "official-documents/{$replacement->reference}.pdf"]);
        $this->travel(366)->days();
        $this->get(route('official-documents.verify', $replacement->reference))->assertSee('Expiré');
    }

    public function test_storage_failure_keeps_approval_and_allows_retry(): void
    {
        Storage::fake('local');
        [$student, $entry, $institution, $manager, $signer, $issuer] = $this->context();
        $type = $this->catalog($entry, $institution, $manager, $signer);
        $this->actingAs($student)->post(route(self::STUDENT.'submit', ['academic' => $entry->id]), [
            'type_id' => $type->id, 'action' => 'initial', 'reason' => 'Dossier administratif.', 'operation_key' => (string) Str::uuid(),
        ])->assertStatus(303);
        $ticket = ServiceRequest::sole();
        $transition = route(self::ADMIN.'transition', $ticket);
        $this->actingAs($manager)->post($transition, ['action' => 'review', 'revision' => 1, 'reason' => 'Contrôle du dossier.'])->assertStatus(303);
        $this->actingAs($signer)->post($transition, ['action' => 'approve', 'revision' => 2, 'reason' => 'Édition approuvée.'])->assertStatus(303);
        Storage::disk('local')->put('official-documents', 'Obstacle simulé.');
        $issue = route(self::ADMIN.'issue', $ticket);
        $this->actingAs($issuer)->post($issue, ['revision' => 3])->assertStatus(503);
        $this->assertDatabaseCount('official_documents', 0);
        $this->assertSame('approved', $ticket->fresh()->status);
        Storage::disk('local')->delete('official-documents');
        $this->post($issue, ['revision' => 3])->assertStatus(303);
        $this->assertDatabaseCount('official_documents', 1);
    }

    private function approveAndIssue(ServiceRequest $ticket, User $manager, User $signer, User $issuer): void
    {
        $transition = route(self::ADMIN.'transition', $ticket);
        $this->actingAs($manager)->post($transition, ['action' => 'review', 'revision' => 1, 'reason' => 'Contrôle du dossier.'])->assertStatus(303);
        $this->actingAs($signer)->post($transition, ['action' => 'approve', 'revision' => 2, 'reason' => 'Édition approuvée.'])->assertStatus(303);
        $this->actingAs($issuer)->post(route(self::ADMIN.'issue', $ticket), ['revision' => 3])->assertStatus(303);
    }

    private function context(): array
    {
        $student = $this->studentContext();
        $entry = AcademicEnrollment::sole();
        $entry->update(['matricule' => 'PRIVE-DOC-4242']);
        $institution = University::create(['name' => 'Université de test', 'code' => 'UTEST', 'is_active' => true]);
        $entry->level->faculty->forceFill(['university_id' => $institution->id])->save();
        AccessRule::create(['feature' => 'documents_request', 'mode' => 'open', 'is_active' => true]);

        return [$student, $entry, $institution, $this->staff(DocumentAccess::MANAGE), $this->staff(DocumentAccess::APPROVE), $this->staff(DocumentAccess::ISSUE)];
    }

    private function staff(string $permission): User
    {
        $user = User::factory()->create()->assignRole(Role::findOrCreate('admin', 'web'));
        $user->givePermissionTo(Permission::findOrCreate($permission, 'web'));

        return $user;
    }

    private function catalog(AcademicEnrollment $entry, University $institution, User $manager, User $signer, string $kind = 'enrollment'): OfficialDocumentType
    {
        $this->actingAs($manager)->post(route(self::ADMIN.'type'), [
            'faculty_id' => $entry->level->faculty_id, 'university_id' => $institution->id,
            'name' => 'Attestation institutionnelle', 'code' => 'ATT', 'kind' => $kind, 'student_request' => true,
            'download' => true, 'print' => true, 'copies' => true, 'financial_gate' => true,
            'valid_days' => $kind === 'card' ? 365 : null, 'decisions' => $kind === 'success' ? 'validated' : null, 'reason' => 'Catalogue de la faculté.',
        ])->assertStatus(303);
        $type = OfficialDocumentType::sole();
        $activation = route(self::ADMIN.'activate', $type);
        $this->actingAs($signer)->postJson($activation, ['active' => true, 'reason' => 'Activation du catalogue.'])->assertUnprocessable();
        $model = ['title' => 'Attestation institutionnelle', 'body' => 'Nous attestons l’inscription de {{ student }} pour {{ year }}.',
            'signer_id' => $signer->id, 'capacity' => 'Responsable habilité', 'reason' => 'Modèle soumis à approbation.'];
        if ($kind === 'card') {
            $model += ['width_mm' => 85.6, 'height_mm' => 53.98, 'margin_mm' => 3, 'color' => '#203852'];
        }
        $this->actingAs($manager)->postJson(route(self::ADMIN.'template', $type), array_replace($model, ['body' => '{{ email }}']))
            ->assertUnprocessable()->assertJsonValidationErrors('body');
        $this->post(route(self::ADMIN.'template', $type), $model)->assertStatus(303);
        $template = $type->templates()->sole();
        $this->actingAs($signer)->post(route(self::ADMIN.'template-state', $template), ['action' => 'approve', 'reason' => 'Texte institutionnel approuvé.'])->assertStatus(303);
        $this->post($activation, ['active' => true, 'reason' => 'Activation du catalogue.'])->assertStatus(303);

        return $type->refresh();
    }
}
