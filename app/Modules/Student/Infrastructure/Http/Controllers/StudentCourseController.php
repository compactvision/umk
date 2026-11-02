<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Courses;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\AcademicAccessService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentCourseController extends Controller
{
    public function show(Request $request, StudentPortalController $portal, AcademicAccessService $access, int $course, string $section = 'infos')
    {
        $entry = $portal->context($request);
        abort_unless($access->decision($entry, 'courses_view')['allowed'], 403);
        abort_unless($access->courses($entry)->contains('course_id', $course), 404);
        $subject = Courses::where('level_id', $entry->level_id)->findOrFail($course);
        $offerings = $access->offerings($entry)->where('course_id', $course)->with(['professor', 'assistant', 'group.intake'])->get();
        $permissions = $access->permissions($entry);
        $feature = match ($section) { 'files' => 'materials_download', 'evaluations' => 'evaluations_participate', 'sessions', 'attendance' => 'schedule_view', default => 'courses_view' };
        abort_unless($permissions[$feature]['allowed'], 403, $permissions[$feature]['reason'] ?? 'Accès refusé.');
        $resources = AcademicResource::whereIn('academic_offering_id', $offerings->pluck('id'))->where('is_published', true)
            ->where(fn ($q) => $q->whereNull('student_profile_id')->orWhere('student_profile_id', $entry->student_profile_id));
        $counts = (clone $resources)->whereIn('kind', ['material', 'assignment', 'evaluation', 'online', 'video'])->selectRaw('kind, count(*) as total')->groupBy('kind')->pluck('total', 'kind');
        $kind = ['files' => ['material'], 'online' => ['online'], 'videos' => ['video'], 'evaluations' => ['assignment', 'evaluation']][$section] ?? [];
        $items = $kind ? (clone $resources)->whereIn('kind', $kind)->orderBy('title')->get()->map(fn ($r) => [
            'id' => $r->id, 'title' => $r->title, 'body' => $r->body, 'url' => $r->url && preg_match('#^https?://#i', $r->url) ? $r->url : null,
            'filename' => $r->filename, 'kind' => $r->kind, 'opens_at' => $r->opens_at, 'closes_at' => $r->closes_at,
            'download_url' => $r->path ? '/dashboard/student/resources/'.$r->id.'/download?academic='.$entry->id : null,
            'work_url' => in_array($r->kind, ['assignment', 'evaluation']) ? '/dashboard/student/'.($r->kind === 'assignment' ? 'assignments' : 'evaluations').'?academic='.$entry->id.'#resource-'.$r->id : null,
        ]) : [];
        $input = $request->validate(['week' => 'nullable|date_format:Y-m-d']);
        $week = CarbonImmutable::parse($input['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $sessionQuery = AcademicSession::whereIn('academic_offering_id', $offerings->pluck('id'))->where('is_published', true);
        $sessionCount = (clone $sessionQuery)->count();
        $sessions = $section === 'sessions' ? (clone $sessionQuery)->where('starts_at', '<', $week->addWeek()->utc())->where('ends_at', '>', $week->utc())->with('offering.professor')->orderBy('starts_at')->get()->map(fn ($s) => [
            'id' => $s->id, 'course' => $subject->title, 'teacher' => $s->offering->professor?->full_name ?? $subject->teacher, 'level_id' => $entry->level_id,
            'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room,
        ]) : [];
        $attendance = $section === 'attendance' ? (clone $sessionQuery)->where('starts_at', '<=', now())->orderByDesc('starts_at')->paginate(30)->withQueryString() : null;
        if ($attendance) {
            $records = AcademicAttendance::where('academic_enrollment_id', $entry->id)->whereIn('academic_session_id', $attendance->getCollection()->pluck('id'))->pluck('status', 'academic_session_id');
            $attendance->through(fn ($s) => ['id' => $s->id, 'starts_at' => $s->starts_at, 'ends_at' => $s->ends_at, 'room' => $s->room, 'status' => $records[$s->id] ?? null]);
        }
        $stats = AcademicAttendance::where('academic_enrollment_id', $entry->id)->whereIn('academic_session_id', (clone $sessionQuery)->where('starts_at', '<=', now())->select('id'))->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        return Inertia::render('dashboard/student/Course', [
            'period' => \App\Models\Student\AcademicSemester::where('academic_year_id', $entry->academic_year_id)->where('number', $subject->semester)->first(['start_date', 'end_date']),
            'section' => $section, 'academic' => ['id' => $entry->id, 'level' => $entry->level->title, 'faculty' => $entry->level->faculty->name, 'year' => $entry->academicYear->title, 'group' => $entry->group?->intake?->name],
            'course' => $subject->only(['id', 'title', 'code', 'description', 'credits', 'semester', 'cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content']),
            'organization' => $offerings->map(fn ($o) => ['id' => $o->id, 'teacher' => $o->professor?->full_name ?? $subject->teacher,
                'assistant' => $o->assistant?->full_name, 'group' => $o->group?->intake?->name, 'leader' => $o->group_leader_name, 'delivery_mode' => $o->delivery_mode]),
            'counts' => ['sessions' => $sessionCount, 'files' => (int) ($counts['material'] ?? 0), 'online' => (int) ($counts['online'] ?? 0), 'videos' => (int) ($counts['video'] ?? 0), 'evaluations' => (int) ($counts['evaluation'] ?? 0) + (int) ($counts['assignment'] ?? 0)],
            'permissions' => $permissions, 'resources' => $items, 'week' => $week->toDateString(), 'sessions' => $sessions, 'attendance' => $attendance, 'attendance_stats' => $stats,
        ]);
    }
}
