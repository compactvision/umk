<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Student\AcademicAttendance;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

final class AttendanceReportController
{
    public function index(Request $request)
    {
        $actor = $request->user();
        abort_unless($actor->canAny(['publish academic content', 'manage academic access']), 403);
        $filters = $request->validate([
            'year' => 'nullable|integer|exists:academic_years,id', 'course' => 'nullable|integer', 'group' => 'nullable|integer',
            'teacher' => 'nullable|integer', 'student' => 'nullable|integer', 'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from', 'format' => 'nullable|in:csv',
        ]);
        $query = AcademicAttendance::query()
            ->join('academic_sessions as s', 's.id', '=', 'academic_attendances.academic_session_id')
            ->join('academic_offerings as o', 'o.id', '=', 's.academic_offering_id')
            ->join('levels as l', 'l.id', '=', 'o.level_id')
            ->join('courses as c', 'c.id', '=', 'o.course_id')
            ->leftJoin('curriculum_items as ec', 'ec.id', '=', 'o.curriculum_item_id')
            ->leftJoin('academic_absence_justifications as j', 'j.academic_attendance_id', '=', 'academic_attendances.id')
            ->whereNull('s.cancelled_at')->where('s.is_published', true)->where('s.ends_at', '<=', now())
            ->when($actor->academicFaculties()->exists(), fn ($q) => $q->whereIn('l.faculty_id', $actor->academicFaculties()->select('faculties.id')))
            ->when($filters['year'] ?? null, fn ($q, $id) => $q->where('o.academic_year_id', $id))
            ->when($filters['course'] ?? null, fn ($q, $id) => $q->where('o.course_id', $id))
            ->when($filters['group'] ?? null, fn ($q, $id) => $q->where('o.class_id', $id))
            ->when($filters['teacher'] ?? null, fn ($q, $id) => $q->where(function ($scope) use ($id) {
                $scope->whereExists(fn ($a) => $a->selectRaw('1')->from('academic_teaching_assignments as a')
                    ->whereColumn('a.academic_offering_id', 'o.id')->where('a.professor_id', $id)
                    ->where(fn ($w) => $w->whereNull('a.starts_at')->orWhereColumn('a.starts_at', '<=', 's.starts_at'))
                    ->where(fn ($w) => $w->whereNull('a.ends_at')->orWhereColumn('a.ends_at', '>', 's.starts_at')));
                foreach (['lead' => 'professor_id', 'primary_assistant' => 'assistant_professor_id'] as $role => $field) {
                    $scope->orWhere(fn ($legacy) => $legacy->where('o.'.$field, $id)->whereNotExists(fn ($a) => $a->selectRaw('1')
                        ->from('academic_teaching_assignments as h')->whereColumn('h.academic_offering_id', 'o.id')->where('h.role', $role)));
                }
            }))
            ->when($filters['student'] ?? null, fn ($q, $id) => $q->where('academic_attendances.academic_enrollment_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $date) => $q->where('s.starts_at', '>=', CarbonImmutable::parse($date, 'Africa/Kinshasa')->utc()))
            ->when($filters['to'] ?? null, fn ($q, $date) => $q->where('s.starts_at', '<', CarbonImmutable::parse($date, 'Africa/Kinshasa')->addDay()->utc()));
        $counts = "COUNT(*) AS recorded,
            SUM(CASE WHEN academic_attendances.status = 'present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN academic_attendances.status = 'late' THEN 1 ELSE 0 END) AS late,
            SUM(CASE WHEN academic_attendances.status = 'excused' OR (academic_attendances.status = 'absent' AND j.status = 'accepted') THEN 1 ELSE 0 END) AS excused,
            SUM(CASE WHEN academic_attendances.status = 'absent' AND (j.status IS NULL OR j.status <> 'accepted') THEN 1 ELSE 0 END) AS absent";
        $total = (clone $query)->selectRaw($counts)->toBase()->first();
        $rows = $query->selectRaw('s.id, s.starts_at, COALESCE(ec.name, c.title) AS course, '.$counts)
            ->groupBy('s.id', 's.starts_at', 'ec.name', 'c.title')->orderByDesc('s.starts_at')->orderByDesc('s.id')->toBase();
        if (($filters['format'] ?? null) === 'csv') {
            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');
                fputcsv($out, ['seance', 'date_utc', 'cours', 'saisis', 'presents', 'retards', 'justifies', 'absents'], ',', '"', '');
                foreach ($rows->lazy(200) as $row) {
                    $title = preg_match('/^\s*[=+@-]/u', $row->course) ? "'".$row->course : $row->course;
                    fputcsv($out, [$row->id, $row->starts_at, $title, $row->recorded, $row->present, $row->late, $row->excused, $row->absent], ',', '"', '');
                }
                fclose($out);
            }, 'presences.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
        }

        return Inertia::render('dashboard/schedule/Reports', [
            'filters' => $filters, 'total' => $total, 'rows' => $rows->paginate(25)->withQueryString(),
            'years' => AcademicYear::latest('start_date')->get(['id', 'title']),
        ]);
    }
}
