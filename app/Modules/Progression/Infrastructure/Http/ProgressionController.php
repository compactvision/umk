<?php

namespace App\Modules\Progression\Infrastructure\Http;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicLifecycleCase;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicProgression;
use App\Modules\Progression\Application\AcademicLifecycle;
use App\Modules\Progression\Application\ProgressionEvidence;
use App\Modules\Progression\Application\RetakeAssignments;
use App\Modules\Student\Application\Services\AcademicStaffScope;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

final class ProgressionController
{
    public function index(Request $request, ProgressionEvidence $evidence)
    {
        $actor = $request->user();
        abort_unless($actor->canAny([AcademicLifecycle::MANAGE, AcademicLifecycle::APPROVE, 'publish academic content', 'manage academic access']), 403);
        $filters = $request->validate([
            'academic' => 'nullable|integer|min:1', 'year' => 'nullable|integer|min:1', 'q' => 'nullable|string|max:80',
            'kind' => ['nullable', Rule::in(AcademicLifecycleCase::KINDS)], 'status' => 'nullable|in:open,correction,approved,refused',
        ]);
        $entries = AcademicStaffScope::apply(AcademicEnrollment::query(), $actor);
        $entry = isset($filters['academic']) ? (clone $entries)->with(['profile.user', 'level.faculty', 'academicYear', 'curriculumVersion', 'application'])->findOrFail($filters['academic']) : null;
        $allowed = (clone $entries)->when($filters['year'] ?? null, fn ($q, $year) => $q->where('academic_year_id', $year))
            ->when($entry, fn ($q) => $q->whereKey($entry->id))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where('matricule', 'like', '%'.$term.'%'))->select('academic_enrollments.id');
        $cases = AcademicLifecycleCase::whereIn('academic_enrollment_id', clone $allowed)
            ->when($filters['kind'] ?? null, fn ($q, $kind) => $q->where('kind', $kind));
        $check = $entry ? $evidence->evaluate($entry) : null;
        $progressions = AcademicProgression::whereIn('source_enrollment_id', clone $allowed)->with(['level', 'academicYear', 'target', 'retakeAssignments.registration']);

        return Inertia::render('dashboard/studentAcademic/Progression', [
            'filters' => $filters, 'actor' => $actor->id,
            'abilities' => ['manage' => $actor->can(AcademicLifecycle::MANAGE), 'approve' => $actor->can(AcademicLifecycle::APPROVE),
                'graduation' => $actor->can(AcademicLifecycle::GRADUATE), 'register' => $actor->can('manage academic access')],
            'entry' => $entry ? [
                'id' => $entry->id, 'name' => $entry->profile->user->full_name, 'matricule' => $entry->matricule ?? $entry->profile->matricule,
                'level' => $entry->level->title, 'year' => $entry->academicYear->title,
                'program' => $entry->curriculumVersion?->program_snapshot['name'] ?? null,
                'status' => $check['status'], 'mode' => $check['mode'], 'result' => $check['result']?->reference,
                'can_finish' => ! empty($check['decision']['completion_credits']),
            ] : null,
            'counts' => (clone $cases)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'cases' => $cases->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
                ->latest('id')->paginate(20, ['*'], 'cases_page')->withQueryString()->through(fn ($case) => $case->only(['id', 'reference', 'academic_enrollment_id', 'author_id', 'kind', 'status', 'revision', 'reason', 'response', 'decided_at', 'decided_by', 'target_enrollment_id'])
                    + ['requested' => $case->context['request'], 'completion' => $case->context['completion'] ?? $case->context['prepared_completion'] ?? null]),
            'progressions' => $progressions->latest('id')->paginate(20, ['*'], 'decisions_page')->withQueryString()->through(fn ($decision) => [
                'id' => $decision->id, 'academic' => $decision->source_enrollment_id, 'kind' => $decision->kind, 'level' => $decision->level->title,
                'year' => $decision->academicYear->title, 'target' => $decision->target?->id, 'target_status' => $decision->target?->enrollment_status,
                'retakes' => $decision->decision_snapshot['retakes'] ?? [], 'due_on' => $decision->decision_snapshot['due_on'] ?? null,
                'assigned_items' => $decision->retakeAssignments->filter(fn ($row) => $row->registration->withdrawn_at === null)->pluck('source_item_id')->values(),
            ]),
        ]);
    }

    public function propose(Request $request, AcademicEnrollment $academic, AcademicLifecycle $lifecycle)
    {
        $data = $this->proposal($request, ['operation_key' => 'required|uuid']);
        $lifecycle->propose($academic, $request->user(), $data);

        return back(303)->with('success', 'Dossier de parcours enregistré.');
    }

    public function revise(Request $request, AcademicLifecycleCase $case, AcademicLifecycle $lifecycle)
    {
        $request->merge(['kind' => $case->kind]);
        $data = $this->proposal($request, ['revision' => 'required|integer|min:1']);
        $lifecycle->revise($case, $request->user(), $data);

        return back(303)->with('success', 'Dossier soumis à nouveau.');
    }

    private function proposal(Request $request, array $command): array
    {
        return $request->validate($command + [
            'kind' => ['required', Rule::in(AcademicLifecycleCase::KINDS)], 'reason' => 'required|string|min:10|max:1000',
            'level_id' => 'nullable|required_if:kind,reorientation|integer|min:1',
            'year_id' => 'nullable|required_if:kind,resumption|integer|min:1',
            'version_id' => 'nullable|required_if:kind,resumption,reorientation|integer|min:1',
            'application_id' => 'nullable|required_if:kind,cycle|integer|min:1', 'evidence' => 'nullable|required_if:kind,external_transfer|string|min:5|max:500',
        ]);
    }

    public function decide(Request $request, AcademicLifecycleCase $case, AcademicLifecycle $lifecycle)
    {
        $data = $request->validate(['action' => 'required|in:approve,refuse,correct', 'revision' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:1000']);
        $lifecycle->decide($case, $request->user(), $data);

        return back(303)->with('success', 'Décision de parcours enregistrée.');
    }

    public function retake(Request $request, AcademicProgression $progression, RetakeAssignments $assignments)
    {
        $data = $request->validate(['offering_id' => 'required|integer|min:1', 'item_id' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:1000']);
        $assignments->assign($progression, AcademicOffering::findOrFail($data['offering_id']), $request->user(), (int) $data['item_id'], $data['reason']);

        return back(303)->with('success', 'Matière rattachée à une inscription pédagogique.');
    }
}
