<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Courses;
use App\Models\Intake;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AccessRule;
use App\Models\Student\ContentSection;
use App\Models\User;
use App\Modules\Teaching\Application\Services\LearningContent;
use App\Notifications\LearningContentNotice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

final class LearningContentTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    private const REASON = 'Support approuvé pour le cours.';

    private const TEACHER = '/dashboard/teacher/resources';

    private const ADMIN = '/dashboard/admin/teaching/resources';

    private const STUDENT = '/dashboard/student/resources';

    private function fixtures(): array
    {
        Storage::fake('local');
        $student = $this->studentContext();
        $entry = $student->studentProfile->enrollments()->sole();
        foreach (['materials_download', 'assignments_submit', 'evaluations_participate'] as $feature) {
            AccessRule::create(['feature' => $feature, 'mode' => 'open', 'is_active' => true, 'level_id' => $entry->level_id]);
        }
        $teacher = $this->teacher();
        $offer = $this->offering($entry, $teacher);
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'))->givePermissionTo(Permission::findOrCreate('publish academic content', 'web'));

        return [$student, $entry, $teacher, $offer, $admin];
    }

    private function teacher(): User
    {
        $teacher = User::factory()->create();
        $teacher->assignRole(Role::findOrCreate('professor', 'web'))->givePermissionTo(Permission::findOrCreate('manage courses', 'web'));
        Professor::create(['first_name' => 'Alice', 'last_name' => 'Professeur',
            'email' => $teacher->email, 'is_active' => true])->forceFill(['user_id' => $teacher->id, 'photo' => 'professors/test-portrait.png'])->save();

        return $teacher;
    }

    private function offering($entry, User $teacher): AcademicOffering
    {
        $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Séminaire', 'code' => Str::random(10), 'semester' => 1]);
        $course->save();

        return AcademicOffering::create(['academic_year_id' => $entry->academic_year_id, 'level_id' => $entry->level_id,
            'course_id' => $course->id, 'is_published' => true, 'professor_id' => Professor::where('user_id', $teacher->id)->value('id')]);
    }

    private function pdf(string $name = 'support.pdf', string $label = 'exemplaire un'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n".$label."\n%%EOF\n");
    }

    private function payload(array $fields = []): array
    {
        return $fields + ['operation_key' => (string) Str::uuid(), 'kind' => 'material', 'title' => 'Support de cours', 'file' => $this->pdf()];
    }

    private function upload(AcademicOffering $offer, array $fields = []): AcademicResource
    {
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload($fields))->assertStatus(303)->assertSessionHasNoErrors();

        return $offer->resources()->latest('id')->firstOrFail();
    }

    private function transition(AcademicResource $resource, string $action, bool $notify = false)
    {
        return $this->post(self::TEACHER.'/'.$resource->id.'/publication', ['action' => $action, 'reason' => self::REASON,
            'revision' => $resource->fresh()->revision, 'notify' => $notify]);
    }

    public function test_authorized_publisher_can_create_retry_publish_withdraw_and_archive_a_private_support(): void
    {
        [$student, , $teacher, $offer, $admin] = $this->fixtures();
        $input = $this->payload();
        $this->actingAs($teacher)->post(self::TEACHER.'/offerings/'.$offer->id, $input)->assertStatus(303);
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $input)->assertStatus(303);
        $this->post(self::TEACHER.'/offerings/'.$offer->id, array_replace($input, ['title' => 'Autre édition']))->assertSessionHasErrors('operation_key');
        $resource = $offer->resources()->sole();
        $this->assertCount(1, Storage::disk('local')->allFiles('learning-content'));
        $this->assertSame(1, $resource->current_version);
        $this->assertSame(hash('sha256', Storage::disk('local')->get($resource->path)), $resource->sha256);

        $download = self::STUDENT.'/'.$resource->id.'/download';
        $this->actingAs($student)->get($download)->assertNotFound();
        $this->actingAs($teacher);
        $this->transition($resource, 'publish')->assertStatus(303);
        $this->actingAs($student)->get($download)->assertOk()->assertDownload('support.pdf')->assertHeader('X-Content-Type-Options', 'nosniff');
        $preview = $this->get(self::STUDENT.'/'.$resource->id.'/preview')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertInstanceOf(BinaryFileResponse::class, $preview->baseResponse);
        $this->assertTrue($preview->headers->hasCacheControlDirective('private'));
        $this->assertTrue($preview->headers->hasCacheControlDirective('no-store'));
        $this->withHeaders(['Range' => 'bytes=0-7'])->get(self::STUDENT.'/'.$resource->id.'/preview')->assertStatus(206);
        $this->flushHeaders();
        $this->assertSame(1, $resource->fresh()->download_count);

        $this->actingAs($teacher);
        $this->transition($resource, 'withdraw')->assertStatus(303);
        $this->actingAs($student)->get($download)->assertNotFound();
        $this->actingAs($teacher);
        $this->transition($resource, 'archive')->assertStatus(303);
        $this->transition($resource, 'publish')->assertSessionHasErrors('resource');
        $this->delete(self::TEACHER.'/'.$resource->id)->assertNotFound();
        $this->assertDatabaseCount('academic_resource_versions', 1);
        Storage::disk('local')->assertExists($resource->path);
        $this->actingAs($admin)->get(self::ADMIN.'?status=archived&resource='.$resource->id)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/teaching/Learning')->has('resources.data', 1)->where('downloads', 1)->where('file_status', 'available')
            ->has('versions.data', 1)->missing('selected.path')->missing('versions.data.0.edition.path'));
    }

    public function test_replacement_freezes_the_legacy_edition_and_rejects_a_stale_editor(): void
    {
        [$student, , $teacher, $offer] = $this->fixtures();
        $original = 'academic-resources/ancien.pdf';
        Storage::disk('local')->put($original, '%PDF-1.4 historique');
        $legacy = $offer->resources()->create(['kind' => 'material', 'title' => 'Syllabus historique', 'is_published' => true,
            'path' => $original, 'filename' => 'ancien.pdf', 'mime' => 'application/pdf']);
        $this->actingAs($student)->get(self::STUDENT.'/'.$legacy->id.'/download')->assertDownload('ancien.pdf');
        $this->actingAs($teacher);
        $edition = ['title' => 'Syllabus révisé', 'revision' => 0, 'reason' => self::REASON, 'file' => $this->pdf('revision.pdf')];
        $this->post(self::TEACHER.'/'.$legacy->id.'/edition', $edition)->assertStatus(303)->assertSessionHasNoErrors();
        $this->post(self::TEACHER.'/'.$legacy->id.'/edition', array_replace($edition, ['file' => $this->pdf('perdu.pdf')]))->assertSessionHasErrors('revision');
        $legacy->refresh();
        $this->assertSame(2, $legacy->current_version);
        $this->assertFalse($legacy->is_published);
        $this->assertSame($original, $legacy->versions()->where('number', 1)->sole()->snapshot['path']);
        $this->assertCount(1, Storage::disk('local')->allFiles('learning-content'));
        $this->get(self::TEACHER.'/'.$legacy->id.'/versions/1')->assertDownload('ancien.pdf');
        $this->actingAs($student)->get(self::STUDENT.'/'.$legacy->id.'/download')->assertNotFound();
        $this->actingAs($teacher);
        $this->transition($legacy, 'publish')->assertStatus(303);
        $this->actingAs($student)->get(self::STUDENT.'/'.$legacy->id.'/download')->assertDownload('revision.pdf');
    }

    public function test_assistant_sees_only_published_supports_and_outsiders_cannot_mutate_or_download(): void
    {
        [$student, $entry, $teacher, $offer] = $this->fixtures();
        $assistant = $this->teacher();
        $other = $this->teacher();
        $offer->update(['assistant_professor_id' => Professor::where('user_id', $assistant->id)->value('id')]);
        $this->actingAs($teacher);
        $resource = $this->upload($offer);
        $this->actingAs($assistant)->get(self::TEACHER.'?offering='.$offer->id)->assertInertia(fn (Assert $page) => $page
            ->where('canManage', false)->has('resources.data', 0));
        $this->get(self::TEACHER.'/'.$resource->id.'/file')->assertNotFound();
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload())->assertForbidden();
        $this->actingAs($other)->get(self::TEACHER.'/'.$resource->id.'/file')->assertForbidden();
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload())->assertForbidden();
        $this->actingAs($teacher);
        $this->transition($resource, 'publish')->assertStatus(303);
        $this->actingAs($assistant)->get(self::TEACHER.'/'.$resource->id.'/file')->assertDownload();
        $this->get(self::TEACHER.'/'.$resource->id.'/versions/1')->assertForbidden();
        $this->post(self::TEACHER.'/'.$resource->id.'/publication', ['action' => 'withdraw', 'reason' => self::REASON, 'revision' => 2])->assertForbidden();

        $intake = Intake::create(['name' => 'Groupe distinct']);
        $group = Classes::create(['faculty_id' => $entry->level->faculty_id, 'level_id' => $entry->level_id, 'intake_id' => $intake->id]);
        $offer->update(['class_id' => $group->id]);
        $this->actingAs($student)->get(self::STUDENT.'/'.$resource->id.'/download')->assertNotFound();
        $student->studentProfile->update(['student_status' => 'suspended']);
        $this->get(self::STUDENT.'/'.$resource->id.'/download')->assertForbidden();
    }

    public function test_upload_validation_and_failed_disk_write_leave_no_content_or_file(): void
    {
        [, , $teacher, $offer] = $this->fixtures();
        $this->actingAs($teacher);
        foreach ([$this->pdf('script.php'), UploadedFile::fake()->createWithContent('faux.pdf', 'texte'), $this->pdf()->size(30000)] as $file) {
            $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload(['file' => $file]))->assertSessionHasErrors('file');
        }
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload(['file' => null, 'kind' => 'online', 'url' => 'javascript:alert(1)']))->assertSessionHasErrors('url');
        $disk = Storage::disk('local');
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $original = $this->pdf();
        $failed = \Mockery::mock(UploadedFile::class, [$original->getPathname(), 'support.pdf', null, null, true])->makePartial();
        $failed->shouldReceive('storeAs')->once()->andReturn(false);
        try {
            app(LearningContent::class)->create($offer, $teacher, $this->payload(), $failed);
            $this->fail('Un fichier non stocké ne doit pas créer de support.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('file', $error->errors());
        }
        $this->assertDatabaseCount('academic_resources', 0);
        $this->assertSame([], $disk->allFiles('learning-content'));
    }

    public function test_sections_and_sessions_are_scoped_and_cancelled_sessions_keep_their_supports(): void
    {
        [$student, $entry, $teacher, $offer] = $this->fixtures();
        $other = $this->offering($entry, $teacher);
        $foreign = $other->sessions()->create(['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour(), 'room' => 'B']);
        $session = $offer->sessions()->create(['starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour(), 'room' => 'A', 'is_published' => true]);
        $this->actingAs($teacher)->post(self::TEACHER.'/offerings/'.$offer->id.'/sections', ['title' => 'Introduction', 'position' => 1])->assertStatus(303);
        $section = ContentSection::sole();
        $this->post(self::TEACHER.'/offerings/'.$other->id.'/sections/'.$section->id, ['title' => 'Déplacé', 'position' => 2, 'revision' => 1])->assertNotFound();
        $this->post(self::TEACHER.'/offerings/'.$offer->id, $this->payload(['academic_session_id' => $foreign->id]))->assertSessionHasErrors('academic_session_id');
        $resource = $this->upload($offer, ['academic_session_id' => $session->id, 'academic_content_section_id' => $section->id, 'kind' => 'syllabus']);
        $this->transition($resource, 'publish')->assertStatus(303);
        $course = '/dashboard/student/courses/'.$offer->course_id;
        $this->actingAs($student)->get($course.'/files?q=Support')->assertInertia(fn (Assert $page) => $page
            ->has('resources', 1)->where('resources.0.section', 'Introduction')->where('resources.0.kind', 'syllabus'));
        $this->get($course.'/files?q=inconnu')->assertInertia(fn (Assert $page) => $page->has('resources', 0));
        $sessionUrl = $course.'/online?academic='.$entry->id.'&session='.$session->id;
        $this->get($sessionUrl)->assertInertia(fn (Assert $page) => $page->has('resources', 1)->where('resource_filters.session', $session->id));
        $session->update(['cancelled_at' => now()]);
        $this->get($sessionUrl)->assertOk()->assertInertia(fn (Assert $page) => $page->has('resources', 1));
        $this->get($course.'/online?session='.$foreign->id)->assertNotFound();
    }

    public function test_reuse_pins_the_original_file_and_requires_rights_on_both_offers(): void
    {
        [, $entry, $teacher, $offer] = $this->fixtures();
        $target = $this->offering($entry, $teacher);
        $foreign = $this->offering($entry, $this->teacher());
        $this->actingAs($teacher);
        $source = $this->upload($offer);
        $data = ['operation_key' => (string) Str::uuid(), 'source_version' => 1, 'reason' => self::REASON];
        $this->post(self::TEACHER.'/'.$source->id.'/reuse', $data + ['destination' => $foreign->id])->assertNotFound();
        $this->post(self::TEACHER.'/'.$source->id.'/reuse', $data + ['destination' => $target->id])->assertStatus(303);
        $copy = $target->resources()->sole();
        $this->assertSame($source->path, $copy->path);
        $this->assertFalse($copy->is_published);
        $this->post(self::TEACHER.'/'.$source->id.'/edition', ['title' => $source->title, 'revision' => 1, 'reason' => self::REASON,
            'file' => $this->pdf('autre.pdf')])->assertStatus(303);
        $this->assertNotSame($source->fresh()->path, $copy->fresh()->path);
        Storage::disk('local')->assertExists($copy->path);
    }

    public function test_assignment_attachment_follows_visibility_and_access_without_rewriting_the_work(): void
    {
        [$student, , $teacher, $offer] = $this->fixtures();
        $work = $offer->resources()->create(['kind' => 'assignment', 'title' => 'Exercice', 'body' => 'Consignes', 'is_published' => true]);
        $this->actingAs($teacher);
        $this->post(self::TEACHER.'/offerings/'.$offer->id.'/sections', ['title' => 'Exercices', 'position' => 5])->assertStatus(303);
        $this->post(self::TEACHER.'/'.$work->id.'/work-placement', ['academic_content_section_id' => ContentSection::sole()->id, 'position' => 3,
            'revision' => 0, 'reason' => self::REASON])->assertStatus(303);
        $this->assertSame('Consignes', $work->fresh()->body);
        $support = $this->upload($offer, ['supplementary_for_id' => $work->id]);
        $this->transition($support, 'publish')->assertStatus(303);
        $this->actingAs($student)->get('/dashboard/student/assignments')->assertInertia(fn (Assert $page) => $page
            ->has('resources.0.supports', 1)->where('resources.0.supports.0.id', $support->id));
        $this->get(self::STUDENT.'/'.$support->id.'/download')->assertDownload();
        AccessRule::where('feature', 'assignments_submit')->update(['mode' => 'hidden']);
        $this->get(self::STUDENT.'/'.$support->id.'/download')->assertForbidden();
        $this->get('/dashboard/student/courses/'.$offer->course_id.'/files')->assertInertia(fn (Assert $page) => $page->has('resources', 0));
        $work->update(['is_published' => false]);
        $this->get(self::STUDENT.'/'.$support->id.'/download')->assertNotFound();
    }

    public function test_publication_notice_is_opt_in_and_retry_does_not_send_it_twice(): void
    {
        [$student, $entry, $teacher, $offer] = $this->fixtures();
        $this->actingAs($teacher);
        $resource = $this->upload($offer);
        $this->assertDatabaseCount('notifications', 0);
        $this->transition($resource, 'publish', true)->assertStatus(303);
        $this->post(self::TEACHER.'/'.$resource->id.'/publication', ['action' => 'publish', 'notify' => true, 'revision' => 1, 'reason' => self::REASON])->assertStatus(303);
        $notice = $student->notifications()->where('type', LearningContentNotice::class)->sole();
        $this->assertSame($entry->id, $notice->data['academic_enrollment_id']);
        $this->assertArrayNotHasKey('filename', $notice->data);
        $this->actingAs($student)->post(route('dashboard.notifications.open', $notice->id))
            ->assertRedirectContains('/dashboard/student/courses/'.$offer->course_id.'/files');
        $this->assertNotNull($notice->fresh()->read_at);
    }

    public function test_missing_file_is_reported_and_orphan_inventory_preserves_referenced_versions(): void
    {
        [, , $teacher, $offer] = $this->fixtures();
        $this->actingAs($teacher);
        $resource = $this->upload($offer);
        $this->post(self::TEACHER.'/'.$resource->id.'/edition', ['title' => 'Version suivante', 'revision' => 1,
            'reason' => self::REASON, 'file' => $this->pdf('revision.pdf')])->assertStatus(303);
        $current = $resource->fresh();
        Storage::disk('local')->delete($current->path);
        Storage::disk('local')->put('learning-content/orphelin.pdf', 'orphelin');
        $this->transition($current, 'publish')->assertSessionHasErrors('file');
        $this->artisan('academic:learning-file-audit')->expectsOutput('Candidat orphelin learning-content/orphelin.pdf')
            ->expectsOutput('2 référence(s) indisponible(s), 1 candidat(s) orphelin(s).')->assertSuccessful();
        Storage::disk('local')->assertExists([$resource->path, 'learning-content/orphelin.pdf']);
    }
}
