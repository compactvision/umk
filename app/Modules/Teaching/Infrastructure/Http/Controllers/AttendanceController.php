<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicSession;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    private function roster(AcademicSession $session)
    {
        $offering = $session->offering;
        return AcademicEnrollment::where('level_id', $offering->level_id)->where('academic_year_id', $offering->academic_year_id)
            ->where('enrollment_status', 'confirmed')->whereHas('profile', fn ($q) => $q->where('student_status', 'active'))
            ->when($offering->class_id, fn ($q, $group) => $q->where('class_id', $group))
            ->whereDoesntHave('courseExceptions', fn ($q) => $q->where('academic_offering_id', $offering->id)->where('action', 'exclude'))
            ->when($offering->is_optional, fn ($q) => $q->whereHas('courseExceptions', fn ($q) => $q->where('academic_offering_id', $offering->id)->where('action', 'include')));
    }

    public function show(Request $request, AcademicSession $session)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $session->load(['offering.course', 'offering.level', 'offering.academicYear']);
        $students = $this->roster($session)->with('profile.user')->orderBy('matricule')->get();
        $records = AcademicAttendance::where('academic_session_id', $session->id)->pluck('status', 'academic_enrollment_id');
        return Inertia::render('dashboard/schedule/Attendance', [
            'session' => ['id' => $session->id, 'title' => $session->offering->course->title, 'level' => $session->offering->level->title, 'year' => $session->offering->academicYear->title, 'starts_at' => $session->starts_at, 'ends_at' => $session->ends_at, 'room' => $session->room],
            'canRecord' => $session->starts_at->lte(now()),
            'students' => $students->map(fn ($e) => ['id' => $e->id, 'name' => trim($e->profile->user->first_name.' '.$e->profile->user->last_name), 'matricule' => $e->matricule, 'status' => $records[$e->id] ?? '']),
        ]);
    }

    public function save(Request $request, AcademicSession $session)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate(['records' => 'required|array|min:1|max:1000', 'records.*.id' => 'required|integer|distinct', 'records.*.status' => 'required|in:present,absent,late,excused']);
        DB::transaction(function () use ($session, $request, $data) {
            $locked = AcademicSession::lockForUpdate()->findOrFail($session->id);
            abort_if($locked->starts_at->isFuture(), 422, 'L’appel sera disponible au début de la séance.');
            $eligible = $this->roster($locked)->pluck('id');
            foreach ($data['records'] as $record) {
                if (!$eligible->contains($record['id'])) throw ValidationException::withMessages(['records' => 'Un étudiant ne fait pas partie de cet enseignement.']);
                AcademicAttendance::updateOrCreate(['academic_session_id' => $locked->id, 'academic_enrollment_id' => $record['id']], ['status' => $record['status'], 'recorded_by' => $request->user()->id]);
            }
            Audit::record($request->user()->id, 'attendance_recorded', $locked, null, ['count' => count($data['records'])]);
        });
        return back()->with('success', 'Présences enregistrées.');
    }
}
