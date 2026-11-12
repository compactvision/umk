<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Modules\Teaching\Application\Services\CourseAudience;
use App\Modules\Teaching\Application\Services\LearningAccess;
use App\Modules\Teaching\Application\Services\LearningContent;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Ramsey\Uuid\Uuid;

final class TeacherWorkspaceController
{
    public function __construct(private LearningAccess $learning) {}

    public function index(Request $request, CourseAudience $audience)
    {
        $input = $request->validate(['offering' => 'nullable|integer', 'week' => 'nullable|date_format:Y-m-d']);
        $teacher = $this->learning->teacher($request->user());
        $relations = ['course', 'academicYear', 'academicSemester', 'level.faculty', 'curriculumItem.unit.version.program', 'requiredUnit', 'group.intake', 'group.promotion', 'department', 'professor', 'assistant'];
        $selected = isset($input['offering']) && $teacher ? $this->learning->teacherOfferings($teacher)->with($relations)->findOrFail($input['offering']) : null;
        $instructor = $selected && $this->learning->instructor($selected, $teacher);
        $canPublish = $selected && $this->learning->canManage($request->user(), $selected);
        $week = CarbonImmutable::parse($input['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $schedule = $teacher ? AcademicSession::whereIn('academic_offering_id', $this->learning->teacherOfferings($teacher)->select('id'))
            ->whereHas('offering', fn ($q) => $q->where('is_published', true))
            ->where('is_published', true)->where('starts_at', '<', $week->addWeek()->utc())->where('ends_at', '>', $week->utc())
            ->with(['offering.course:id,title', 'offering.curriculumItem:id,name', 'offering.group.intake', 'successor:id,replaces_session_id,starts_at'])
            ->orderBy('starts_at')->orderBy('id')->paginate(25, ['*'], 'week_page')->withQueryString()->through(fn ($s) => [
                'id' => $s->id, 'offering_id' => $s->academic_offering_id, 'course' => $s->offering->curriculumItem?->name ?? $s->offering->course->title,
                'group' => $s->offering->group?->intake?->name, 'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room,
                'status' => $s->cancelled_at ? ($s->successor ? 'rescheduled' : 'cancelled') : 'published',
            ]) : null;

        return Inertia::render('dashboard/teaching/Teacher', [
            'photoUrl' => $teacher?->portraitUrl(),
            'linked' => $teacher !== null, 'schedule' => $schedule, 'week' => $week->toDateString(),
            'offerings' => $teacher ? $this->learning->teacherOfferings($teacher)->with($relations)->latest('id')->paginate(15)->withQueryString()->through(TeachingController::row(...)) : null,
            'selected' => $selected ? TeachingController::row($selected) : null,
            'students' => $instructor && $request->user()->can('manage students') ? $audience->roster($selected)->with('profile.user')->orderBy('id')->paginate(20, ['*'], 'students_page')->withQueryString()->through(TeachingController::student(...)) : null,
            'sessions' => $selected?->sessions()->where('is_published', true)->with('successor:id,replaces_session_id,starts_at')->latest('starts_at')->paginate(15, ['id', 'replaces_session_id', 'starts_at', 'ends_at', 'room', 'is_published', 'cancelled_at'], 'sessions_page')->withQueryString()->through(fn ($session) => $session->toArray() + [
                'attendance_url' => $instructor && $request->user()->can('manage students') && ! $session->cancelled_at ? route('dashboard.teaching.attendance', $session->id) : null,
            ]),
            'resources' => $selected?->resources()->whereNull('student_profile_id')->whereIn('kind', AcademicResource::CONTENT_KINDS)->when(! $canPublish, fn ($query) => $query->visible())->latest('id')
                ->paginate(15, ['id', 'title', 'kind', 'url', 'path', 'is_published'], 'resources_page')->withQueryString()->through(fn ($r) => $r->only(['id', 'title', 'kind', 'is_published', 'url']) + [
                    'download_url' => $r->path ? route('dashboard.teaching.file', $r->id) : null,
                ]),
            'canPublish' => $canPublish,
        ]);
    }

    public function link(Request $request, AcademicOffering $offering)
    {
        abort_unless($request->user()->can('manage courses'), 403);
        $data = $request->validate(['title' => 'required|string|max:180', 'url' => 'required|url:http,https|max:2000']);
        $this->learning->read($request->user(), $offering);
        $key = Uuid::uuid5('d18d1274-64ec-4a66-8b25-e0e714117287', json_encode([$offering->id, $request->user()->id, $data], JSON_THROW_ON_ERROR));
        app(LearningContent::class)->create($offering, $request->user(), $data + [
            'kind' => 'online', 'publish' => true, 'legacy_link' => true, 'operation_key' => (string) $key,
        ]);

        return back(303)->with('success', 'Lien pédagogique enregistré.');
    }

    public function file(Request $request, AcademicResource $resource, LearningFiles $files)
    {
        $this->learning->content($request->user(), $resource);

        return $files->stream($resource->only(AcademicResource::EDITION_FIELDS));
    }
}
