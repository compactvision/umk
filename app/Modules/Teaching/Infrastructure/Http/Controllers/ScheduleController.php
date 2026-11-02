<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\Student\AcademicSemester;
use App\Modules\Teaching\Application\Services\SemesterService;
use App\Modules\Teaching\Application\Services\ScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $filters = $request->validate(['level_id' => 'nullable|integer|exists:levels,id', 'academic_year_id' => 'nullable|integer|exists:academic_years,id', 'semester' => 'nullable|integer|in:1,2', 'week' => 'nullable|date_format:Y-m-d']);
        $today = now('Africa/Kinshasa')->toDateString();
        $currentYear = AcademicYear::where('status', 'open')->where('start_date', '<=', $today)->where('end_date', '>=', $today)->orderByDesc('start_date')->first()
            ?? AcademicYear::where('status', 'open')->orderByDesc('start_date')->first()
            ?? AcademicYear::orderByDesc('start_date')->first();
        if (!isset($filters['academic_year_id']) && $currentYear) $filters['academic_year_id'] = $currentYear->id;
        $week = CarbonImmutable::parse($filters['week'] ?? now('Africa/Kinshasa')->toDateString(), 'Africa/Kinshasa')->startOfWeek();
        $scope = fn ($q) => $q->when($filters['level_id'] ?? null, fn ($q, $id) => $q->where('level_id', $id))
            ->when($filters['academic_year_id'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
            ->when($filters['semester'] ?? null, fn ($q, $semester) => $q->whereHas('course', fn ($q) => $q->where('semester', $semester)));
        return Inertia::render('dashboard/schedule/Index', [
            'filters' => array_merge($filters, ['week' => $week->toDateString()]),
            'levels' => Level::with('faculty:id,name')->orderBy('faculty_id')->orderBy('code')->get(['id', 'faculty_id', 'title']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title', 'start_date', 'end_date', 'status']),
            'semesters' => AcademicSemester::orderBy('academic_year_id')->orderBy('number')->get(),
            'offerings' => $scope(AcademicOffering::query())->with(['course:id,title,code,semester', 'professor:id,first_name,last_name', 'level.faculty:id,name', 'academicYear:id,title,start_date,end_date', 'group.intake'])->orderBy('course_id')->get(),
            'sessions' => AcademicSession::whereHas('offering', $scope)
                ->where('starts_at', '<', $week->addWeek()->utc())->where('ends_at', '>', $week->utc())
                ->with(['offering.course', 'offering.professor', 'offering.level.faculty', 'offering.academicYear', 'offering.group.intake'])
                ->orderBy('starts_at')->get(),
        ]);
    }

    public function save(Request $request, ScheduleService $service, ?int $session = null)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_offering_id' => 'required|integer|exists:academic_offerings,id',
            'starts_at' => 'required|date_format:Y-m-d\TH:i',
            'ends_at' => 'required|date_format:Y-m-d\TH:i|after:starts_at',
            'room' => 'required|string|max:180', 'is_published' => 'required|boolean',
            'repeat_count' => 'required|integer|min:1|max:'.($session ? '1' : '26'),
        ]);
        $count = $service->save($data, $request->user()->id, $session);
        return back()->with('success', $count > 1 ? "{$count} séances hebdomadaires enregistrées." : 'Séance enregistrée.');
    }

    public function saveSemester(Request $request, SemesterService $service)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_year_id' => 'required|integer|exists:academic_years,id', 'number' => 'required|integer|in:1,2',
            'start_month' => 'required|date_format:Y-m', 'end_month' => 'required|date_format:Y-m|after_or_equal:start_month',
        ]);
        $service->save($data, $request->user()->id);
        return back()->with('success', 'Période du semestre enregistrée. Elle sera reprise automatiquement pour les horaires.');
    }

    public function semester(Request $request, ScheduleService $service)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'academic_offering_id' => 'required|integer|exists:academic_offerings,id',
            'semester_id' => 'required|integer|exists:academic_semesters,id',
            'slots' => 'required_without:weekdays|array|min:1|max:21',
            'slots.*.weekday' => 'required|integer|between:1,7',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i|after:slots.*.start_time',
            'slots.*.room' => 'required|string|max:180',
            'weekdays' => 'required_without:slots|array|min:1|max:7',
            'weekdays.*' => 'required|integer|between:1,7|distinct',
            'start_time' => 'required_without:slots|date_format:H:i',
            'end_time' => 'required_without:slots|date_format:H:i|after:start_time',
            'room' => 'required_without:slots|string|max:180', 'is_published' => 'required|boolean',
        ]);
        $count = $service->semester($data, $request->user()->id);
        return back()->with('success', "Horaire du semestre enregistré : {$count} séances planifiées.");
    }

    public function destroy(Request $request, ScheduleService $service, int $session)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $service->delete($session, $request->user()->id);
        return back()->with('success', 'Séance supprimée.');
    }
}
