<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Courses;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicResource;
use App\Models\Student\ContentSection;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentCourseController extends Controller
{
    public function show(Request $request, StudentPortalController $portal, AcademicAccessService $access, int $course, string $section = 'infos')
    {
        $entry = $portal->context($request);
        abort_unless($access->decision($entry, 'courses_view')['allowed'], 403);
        $historical = in_array($section, ['sessions', 'attendance'], true) && $access->sessions($entry)->whereHas('offering', fn ($q) => $q->where('course_id', $course))->where('starts_at', '<=', now())->exists();
        $offerings = $access->offerings($entry)->where('course_id', $course)->with(['professor', 'assistant', 'group.intake', 'academicSemester', 'assignments.professor', 'curriculumItem.unit'])->get();
        abort_unless($historical || $offerings->isNotEmpty() || $access->catalog($entry)->whereKey($course)->exists(), 404);
        $subject = Courses::findOrFail($course);
        $item = $offerings->firstWhere('curriculum_item_id', '!=', null)?->curriculumItem;
        $permissions = $access->permissions($entry);
        $feature = match ($section) { 'files' => 'materials_download', 'evaluations' => 'evaluations_participate', 'sessions', 'attendance' => 'schedule_view', default => 'courses_view' };
        abort_unless($permissions[$feature]['allowed'], 403, $permissions[$feature]['reason'] ?? 'Accès refusé.');
        $input = $request->validate(['week' => 'nullable|date_format:Y-m-d', 'q' => 'nullable|string|max:180', 'session' => 'nullable|integer', 'support' => 'nullable|integer']);
        $week = CarbonImmutable::parse($input['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $sessionQuery = $access->sessions($entry)->whereHas('offering', fn ($offering) => $offering->where('course_id', $course));
        $linkedSession = isset($input['session']) ? (clone $sessionQuery)->findOrFail($input['session']) : null;
        $files = ['material', 'syllabus', 'audio'];
        $contentKinds = $permissions['materials_download']['allowed'] ? AcademicResource::CONTENT_KINDS : ['online', 'video'];
        $resources = AcademicResource::visible()->forStudent($entry)->forLearningPermissions($permissions)
            ->whereIn('academic_offering_id', $offerings->pluck('id'));
        $counts = (clone $resources)->whereIn('kind', [...$contentKinds, 'assignment', 'evaluation'])->selectRaw('kind, count(*) as total')->groupBy('kind')->pluck('total', 'kind');
        $kinds = ['files' => $files, 'online' => ['online'], 'videos' => ['video'], 'evaluations' => ['assignment', 'evaluation']][$section] ?? [];
        if ($linkedSession && $section === 'online') {
            $kinds = $contentKinds;
        }
        $resourcePage = $kinds ? (clone $resources)->whereIn('kind', $kinds)->with(['section:id,title', 'supplementaryFor:id,title'])
            ->when($linkedSession, fn ($q) => $q->where('academic_session_id', $linkedSession->id))
            ->when($input['support'] ?? null, fn ($q, $id) => $q->whereKey($id))
            ->when($input['q'] ?? null, fn ($q, $term) => $q->where('title', 'like', '%'.$term.'%'))
            ->orderByRaw('case when academic_content_section_id is null then 1 else 0 end')
            ->orderBy(ContentSection::select('position')->whereColumn('id', 'academic_resources.academic_content_section_id'))
            ->orderBy('academic_content_section_id')->orderBy('position')->orderBy('title')->orderBy('id')->paginate(25, ['*'], 'resources_page')->withQueryString() : null;
        $pageResources = $resourcePage?->getCollection() ?? collect();
        $sessionIds = $pageResources->pluck('academic_session_id')->filter()->unique();
        $visibleSessions = $sessionIds->isNotEmpty() ? (clone $sessionQuery)->whereKey($sessionIds->all())->get(['id', 'starts_at'])->keyBy('id') : collect();
        $items = $pageResources->map(fn ($r) => [
            'id' => $r->id, 'title' => $r->title, 'body' => $r->body, 'url' => $r->url && preg_match('#^https?://#i', $r->url) ? $r->url : null,
            'filename' => $r->filename, 'kind' => $r->kind, 'opens_at' => $r->opens_at, 'closes_at' => $r->closes_at,
            'section' => $r->section?->title, 'work_title' => $r->supplementaryFor?->title,
            'session_date' => $visibleSessions->get($r->academic_session_id)?->starts_at,
            'preview_url' => $r->path && in_array($r->kind, AcademicResource::CONTENT_KINDS, true) && LearningFiles::previewable($r->disk, $r->mime)
                ? route('dashboard.student.resources.preview', ['resource' => $r->id, 'academic' => $entry->id]) : null,
            'download_url' => $r->path ? route('dashboard.student.resources.download', ['resource' => $r->id, 'academic' => $entry->id]) : null,
            'work_url' => in_array($r->kind, ['assignment', 'evaluation'], true) ? '/dashboard/student/'.($r->kind === 'assignment' ? 'assignments' : 'evaluations').'?academic='.$entry->id.'#resource-'.$r->id : null,
        ]);
        $sessionCount = (clone $sessionQuery)->count();
        $sessions = $section === 'sessions' ? (clone $sessionQuery)->where('starts_at', '<', $week->addWeek()->utc())->where('ends_at', '>', $week->utc())->with('offering.professor', 'offering.assignments.professor', 'successor:id,replaces_session_id,starts_at')->orderBy('starts_at')->get() : collect();
        $sessionContent = $sessions->isNotEmpty() ? (clone $resources)->whereIn('kind', $contentKinds)->whereIn('academic_session_id', $sessions->pluck('id'))
            ->distinct()->pluck('academic_session_id')->flip() : collect();
        $sessions = $sessions->map(fn ($s) => [
            'id' => $s->id, 'course' => $access->reference($entry, $subject, $item)['title'], 'teacher' => \App\Modules\Teaching\Application\Services\TeachingTeam::leadNameAt($s->offering, $s->starts_at) ?? $subject->teacher, 'level_id' => $entry->level_id,
            'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room, 'status' => $s->cancelled_at ? ($s->successor ? 'rescheduled' : 'cancelled') : 'published',
            'resource_url' => $sessionContent->has($s->id) ? route('dashboard.student.courses.show', ['course' => $course, 'section' => 'online', 'academic' => $entry->id, 'session' => $s->id]) : null,
        ]);
        $attendance = $section === 'attendance' ? (clone $sessionQuery)->whereNull('cancelled_at')->where('starts_at', '<=', now())->orderByDesc('starts_at')->paginate(30)->withQueryString() : null;
        if ($attendance) {
            $records = AcademicAttendance::where('academic_enrollment_id', $entry->id)->whereIn('academic_session_id', $attendance->getCollection()->pluck('id'))->with('justification:id,academic_attendance_id,status')->get()->mapWithKeys(fn ($r) => [$r->academic_session_id => $r->justification?->status === 'accepted' ? 'excused' : $r->status]);
            $attendance->through(fn ($s) => ['id' => $s->id, 'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room, 'status' => $records[$s->id] ?? null]);
        }
        $recorded = AcademicAttendance::where('academic_enrollment_id', $entry->id)->whereIn('academic_session_id', (clone $sessionQuery)->whereNull('cancelled_at')->where('ends_at', '<=', now())->select('id'));
        $stats = (clone $recorded)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $accepted = $recorded->where('status', 'absent')->whereHas('justification', fn ($q) => $q->where('status', 'accepted'))->count();
        if ($accepted) {
            $stats['absent'] = $stats['absent'] - $accepted;
            $stats['excused'] = ($stats['excused'] ?? 0) + $accepted;
        }
        $managed = $offerings->firstWhere('curriculum_item_id', '!=', null);
        $period = $managed ? ($managed->academicSemester?->only(['start_date', 'end_date']) ?? ['start_date' => $managed->starts_on, 'end_date' => $managed->ends_on])
            : \App\Models\Student\AcademicSemester::where('academic_year_id', $entry->academic_year_id)->where('number', $subject->semester)->first(['start_date', 'end_date']);
        return Inertia::render('dashboard/student/Course', [
            'period' => $period, 'registered' => $managed !== null,
            'section' => $section, 'academic' => ['id' => $entry->id, 'level' => $entry->level->title, 'faculty' => $entry->level->faculty->name, 'year' => $entry->academicYear->title, 'group' => $entry->group?->intake?->name],
            'course' => $access->reference($entry, $subject, $item),
            'curriculum' => $access->curriculumContext($entry),
            'organization' => $offerings->map(fn ($o) => ['id' => $o->id, 'teacher' => $o->professor?->full_name ?? $subject->teacher,
                'assistant' => collect([$o->assistant?->full_name])->merge($o->assignments->whereNull('ends_at')->where('role', 'assistant')->map(fn ($a) => $a->professor?->full_name))->filter()->unique()->join(', '),
                'instructors' => $o->assignments->whereNull('ends_at')->where('role', 'instructor')->map(fn ($a) => $a->professor?->full_name)->filter()->values(),
                'group' => $o->group?->intake?->name, 'leader' => $o->group_leader_name, 'delivery_mode' => $o->delivery_mode]),
            'counts' => ['sessions' => $sessionCount, 'files' => (int) $counts->only($files)->sum(), 'online' => (int) ($counts['online'] ?? 0), 'videos' => (int) ($counts['video'] ?? 0), 'evaluations' => (int) ($counts['evaluation'] ?? 0) + (int) ($counts['assignment'] ?? 0)],
            'resource_filters' => ['q' => $input['q'] ?? '', 'session' => $linkedSession?->id, 'session_date' => $linkedSession?->starts_at],
            'permissions' => $permissions, 'resources' => $items, 'resource_pagination' => $resourcePage ? ['links' => $resourcePage->linkCollection()] : null, 'week' => $week->toDateString(), 'sessions' => $sessions, 'attendance' => $attendance, 'attendance_stats' => $stats,
        ]);
    }
}
