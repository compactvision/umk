<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\Student\AbsenceJustification;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\TeachingScope;
use App\Notifications\AcademicScheduleNotice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

final class AbsenceController
{
    public function student(Request $request)
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $records = AcademicAttendance::where('status', 'absent')->whereHas('enrollment.profile', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereHas('session', fn ($q) => $q->where('is_published', true)->whereNull('cancelled_at')->where('ends_at', '<=', now()))
            ->with(['session.offering.course', 'session.offering.curriculumItem', 'justification'])->latest('id')->paginate(20)->through($this->row(...));

        return Inertia::render('dashboard/schedule/Absences', ['staff' => false, 'records' => $records, 'status' => null]);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->can('manage academic access'), 403);
        $filters = $request->validate(['status' => 'nullable|in:submitted,in_review,correction,accepted,refused']);
        $actor = $request->user();
        $records = AcademicAttendance::whereHas('justification', fn ($q) => $q->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status)))
            ->whereHas('session.offering.level', fn ($q) => $q->when($actor->academicFaculties()->exists(), fn ($l) => $l->whereIn('faculty_id', $actor->academicFaculties()->select('faculties.id'))))
            ->with(['session.offering.course', 'session.offering.curriculumItem', 'enrollment.profile.user', 'justification'])
            ->latest('id')->paginate(20)->withQueryString()->through(fn ($a) => $this->row($a, true));

        return Inertia::render('dashboard/schedule/Absences', ['staff' => true, 'records' => $records, 'status' => $filters['status'] ?? null]);
    }

    private function row(AcademicAttendance $record, bool $staff = false): array
    {
        $case = $record->justification;

        return ['id' => $record->id, 'course' => $record->session->offering->curriculumItem?->name ?? $record->session->offering->course->title,
            'date' => $record->session->starts_at, 'student' => $staff ? $record->enrollment->profile->user->full_name : null,
            'case' => $case ? $case->only(['id', 'status', 'reason', 'decision_reason', 'revision', 'decided_at']) + [
                'download_url' => $case->path ? route($staff ? 'dashboard.admin.schedule.absences.file' : 'dashboard.student.absences.file', $case) : null,
            ] : null];
    }

    public function submit(Request $request, AcademicAttendance $attendance)
    {
        $this->own($request, $attendance);
        $input = $request->validate(['reason' => 'required|string|min:5|max:2000', 'revision' => 'nullable|integer|min:0', 'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120']);
        $path = null;
        try {
            DB::transaction(function () use ($request, $attendance, $input, &$path) {
                $session = AcademicSession::lockForUpdate()->findOrFail($attendance->academic_session_id);
                $attendance = AcademicAttendance::lockForUpdate()->findOrFail($attendance->id);
                abort_unless($attendance->status === 'absent' && $session->is_published && ! $session->cancelled_at && $session->ends_at <= now(), 422);
                $case = $attendance->justification()->lockForUpdate()->first();
                if ($case && $case->status !== 'correction') {
                    if ($case->status === 'submitted' && $case->reason === $input['reason'] && ! $request->hasFile('file')) {
                        return;
                    }
                    throw ValidationException::withMessages(['reason' => 'La demande a déjà été transmise.']);
                }
                if ($case && (int) ($input['revision'] ?? -1) !== $case->revision) {
                    throw ValidationException::withMessages(['revision' => 'Rechargez la demande avant de la corriger.']);
                }
                if ($request->hasFile('file')) {
                    $path = $request->file('file')->store('absence-justifications', 'local');
                    abort_unless($path, 500);
                }
                $history = $case?->submission_history ?? [];
                if ($case) {
                    $history[] = $case->only(['revision', 'reason', 'path', 'decision_reason', 'reviewed_by', 'decided_at']);
                }
                $case ??= new AbsenceJustification(['academic_attendance_id' => $attendance->id]);
                $case->fill(['status' => 'submitted', 'reason' => $input['reason'], 'path' => $path ?? $case->path,
                    'submission_history' => $history, 'decision_reason' => null, 'reviewed_by' => null, 'decided_at' => null, 'revision' => (int) $case->revision + 1])->save();
                Audit::record($request->user()->id, 'absence_justification_submitted', $case, data: ['revision' => $case->revision]);
                $faculty = $session->offering->level->faculty_id;
                User::role('admin')->permission('manage academic access')->where(fn (Builder $q) => $q->whereDoesntHave('academicFaculties')
                    ->orWhereHas('academicFaculties', fn ($f) => $f->whereKey($faculty)))->eachById(fn ($reviewer) => (new AcademicScheduleNotice([
                        'status' => 'absence_submitted', 'reference' => 'Demande de justification',
                    ]))->deliver($reviewer));
            }, 1);
        } catch (\Throwable $error) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $error;
        }

        return back(303)->with('success', 'Justification transmise.');
    }

    public function decide(Request $request, AbsenceJustification $case)
    {
        $this->reviewer($request, $case);
        $data = $request->validate(['status' => 'required|in:in_review,correction,accepted,refused', 'reason' => 'required|string|min:5|max:2000', 'revision' => 'required|integer|min:1']);
        DB::transaction(function () use ($request, $case, $data) {
            $case = AbsenceJustification::lockForUpdate()->findOrFail($case->id);
            $this->reviewer($request, $case);
            if ($case->status === $data['status'] && $case->decision_reason === $data['reason'] && $case->revision === (int) $data['revision'] + 1) {
                return;
            }
            if ((int) $data['revision'] !== $case->revision || ! in_array($case->status, ['submitted', 'in_review'], true)) {
                throw ValidationException::withMessages(['status' => 'La demande a changé ou sa décision est définitive.']);
            }
            $before = $case->status;
            $case->update(['status' => $data['status'], 'decision_reason' => $data['reason'], 'reviewed_by' => $request->user()->id,
                'decided_at' => now(), 'revision' => $case->revision + 1]);
            Audit::record($request->user()->id, 'absence_justification_reviewed', $case, data: ['from' => $before, 'to' => $case->status, 'revision' => $case->revision]);
            $entry = $case->attendance->enrollment;
            (new AcademicScheduleNotice(['status' => 'absence_'.$case->status, 'reference' => 'Justification d’absence',
                'absence' => true, 'academic_enrollment_id' => $entry->id]))->deliver($entry->profile->user);
        }, 3);

        return back(303)->with('success', 'Décision enregistrée.');
    }

    public function file(Request $request, AbsenceJustification $case)
    {
        if ($request->routeIs('dashboard.admin.*')) {
            $this->reviewer($request, $case);
        } else {
            $this->own($request, $case->attendance);
        }
        abort_unless($case->path && Storage::disk('local')->exists($case->path), 404);

        return Storage::disk('local')->download($case->path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function own(Request $request, AcademicAttendance $attendance): void
    {
        abort_unless($request->user()->hasRole('student') && (int) $attendance->enrollment->profile->user_id === $request->user()->id, 404);
    }

    private function reviewer(Request $request, AbsenceJustification $case): void
    {
        TeachingScope::authorize($request->user(), (int) $case->attendance->session->offering->level->faculty_id, 'manage academic access');
    }
}
