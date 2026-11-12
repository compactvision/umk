<?php

namespace App\Modules\Results\Infrastructure\Http;

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicDeliberation;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\AcademicResultRule;
use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Results\Application\Deliberations;
use App\Modules\Results\Application\ResultAppeals;
use App\Modules\Results\Application\ResultDocuments;
use App\Modules\Results\Application\ResultRules;
use App\Modules\Results\Application\ResultsAccess;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

final class ResultsController
{
    public function __construct(private ResultsAccess $access, private ResultRules $rules, private Deliberations $deliberations) {}

    public function index(Request $request)
    {
        $actor = $request->user();
        $this->access->staff($actor);
        $filters = $request->validate(['version' => 'nullable|integer', 'rule' => 'nullable|integer', 'run' => 'nullable|integer',
            'result' => 'nullable|integer', 'year' => 'nullable|integer', 'q' => 'nullable|string|max:100',
            'state' => 'nullable|in:prepared,open,approved,published,abandoned']);
        $faculties = $actor->academicFaculties()->pluck('faculties.id');
        $versions = CurriculumVersion::whereNotNull('published_at')->whereNotNull('academic_year_id')
            ->when($faculties->isNotEmpty(), fn ($q) => $q->where(function ($scope) use ($faculties) {
                $scope->where(fn ($legacy) => $legacy->whereNull('program_snapshot->faculty_id')
                    ->whereHas('program', fn ($program) => $program->whereIn('faculty_id', $faculties)));
                foreach ($faculties as $faculty) {
                    $scope->orWhereJsonContains('program_snapshot->faculty_id', (int) $faculty);
                }
            }));
        $ruleQuery = AcademicResultRule::whereIn('curriculum_version_id', (clone $versions)->select('id'));
        $version = isset($filters['version']) ? (clone $versions)->with('program', 'academicYear')->findOrFail($filters['version']) : null;
        $rule = isset($filters['rule']) ? (clone $ruleQuery)->with('version.program')->findOrFail($filters['rule']) : null;
        $runQuery = AcademicDeliberation::whereIn('academic_result_rule_id', (clone $ruleQuery)->select('id'))
            ->when(! $actor->canAny([ResultsAccess::MANAGE, ResultsAccess::PUBLISH]), fn ($q) => $q->whereJsonContains('jury->ids', $actor->id));
        $run = isset($filters['run']) ? (clone $runQuery)->with('rule')->withCount('results')->findOrFail($filters['run']) : null;
        $rule ??= $run?->rule;
        $version ??= $rule?->version;
        $result = isset($filters['result']) && $run ? $run->results()->findOrFail($filters['result']) : null;
        $appealQuery = ServiceRequest::whereHas('officialResult.run', fn ($q) => $q->whereIn('academic_result_rule_id', (clone $ruleQuery)->select('id')));
        $pendingAppeals = (clone $appealQuery)->whereIn('status', ['open', 'under_review', 'admissible', 'investigating'])->count();
        $appeals = $actor->canAny([ResultsAccess::MANAGE, ResultsAccess::PUBLISH])
            ? $appealQuery->with('officialResult:id,reference,academic_deliberation_id')->latest('id')->paginate(15, ['*'], 'appeals_page')->withQueryString()
                ->through(fn ($row) => $row->only(['id', 'result_target', 'body', 'status', 'response', 'result_revision', 'assigned_to', 'created_at']) + [
                    'reference' => $row->officialResult->reference,
                    'run_id' => $row->officialResult->academic_deliberation_id,
                    'url' => $row->result_attachment ? route('dashboard.admin.results.appeal-file', $row) : null,
                ])
            : null;
        $levels = $version?->units()->get(['level_id', 'level_title'])->unique('level_id')->values() ?? [];
        $items = $version?->units()->with('items:id,curriculum_unit_id,name')->get()->flatMap(fn ($unit) => $unit->items->map(fn ($item) => [
            'id' => $item->id, 'title' => $item->name, 'level_id' => $unit->level_id,
        ])) ?? collect();
        $assessments = $version ? AcademicAssessment::whereHas('resource.offering.curriculumItem', fn ($q) => $q->where('curriculum_version_id', $version->id))
            ->with('resource.offering')->orderBy('id')->paginate(25, ['*'], 'sources_page')->withQueryString()
            ->through(fn ($item) => ['id' => $item->id, 'title' => $item->resource->title, 'ec' => $item->resource->offering->curriculum_item_id, 'session' => $item->session_code, 'state' => $item->state])
            : null;
        $decisionCount = $run?->results()->whereNull('decision')->count();
        $rows = $run?->results()->when($filters['q'] ?? null, fn ($q, $name) => $q->where(function ($q) use ($name) {
            $q->where('snapshot->matricule', 'like', '%'.$name.'%')->orWhere('snapshot->student', 'like', '%'.$name.'%');
        }))->orderBy('id')->paginate(25, ['*'], 'dossiers_page')->withQueryString()->through(fn ($row) => $this->summary($row));
        $members = User::role('admin')->permission(ResultsAccess::JURY)->whereNotNull('email_verified_at')
            ->when($version, fn ($q) => $q->where(fn ($q) => $q->whereDoesntHave('academicFaculties')->orWhereHas('academicFaculties', fn ($faculty) => $faculty->whereKey($this->access->faculty($version)))))
            ->orderBy('id')->limit(100)->get()->map(fn ($member) => ['id' => $member->id, 'name' => $member->full_name]);

        return Inertia::render('dashboard/results/Administration', [
            'filters' => $filters, 'permissions' => ['manage' => $actor->can(ResultsAccess::MANAGE), 'publish' => $actor->can(ResultsAccess::PUBLISH), 'jury' => $actor->can(ResultsAccess::JURY)],
            'actor' => $actor->id, 'members' => $members, 'versions' => $versions->with('program', 'academicYear')->when($filters['year'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id))
                ->latest('id')->paginate(20, ['*'], 'versions_page')->withQueryString()->through(fn ($v) => ['id' => $v->id, 'title' => $v->program->name.' · '.$v->code.' · '.$v->academicYear->title]),
            'version' => $version?->only(['id', 'code']), 'levels' => $levels, 'items' => $items, 'assessments' => $assessments,
            'rules' => $ruleQuery->when($version, fn ($q) => $q->where('curriculum_version_id', $version->id))->latest('id')->paginate(20, ['*'], 'rules_page')->withQueryString()
                ->through(fn ($row) => $row->only(['id', 'code', 'reference', 'session_code', 'approved_at', 'level_id'])),
            'rule' => $rule?->only(['id', 'code', 'reference', 'session_code', 'approved_at', 'level_id', 'configuration']),
            'runs' => $runQuery->when($rule, fn ($q) => $q->where('academic_result_rule_id', $rule->id))->when($filters['state'] ?? null, fn ($q, $state) => $q->where('state', $state))
                ->latest('id')->paginate(20, ['*'], 'runs_page')->withQueryString(),
            'run' => $run ? $run->toArray() + ['minutes_volumes' => ResultDocuments::volumeCount($run->results_count)] : null, 'dossiers' => $rows, 'undecided' => $decisionCount, 'pending_appeals' => $pendingAppeals,
            'result' => $result ? $this->summary($result) + ['snapshot' => $result->snapshot, 'decision_reason' => $result->decision_reason,
                'eligible_decisions' => array_keys(array_filter($run->context['decisions'], fn ($decision) => ResultRules::permitsDecision($decision, $result->snapshot))),
            ] : null,
            'appeals' => $appeals,
        ]);
    }

    public function storeRule(ResultCommandRequest $request, CurriculumVersion $version)
    {
        $rule = $this->rules->create($version, $request->user(), $request->validated());

        return to_route('dashboard.admin.results.index', ['rule' => $rule->id], 303);
    }

    public function approveRule(ResultCommandRequest $request, AcademicResultRule $rule)
    {
        $this->rules->approve($rule, $request->user(), $request->validated('reason'));

        return back(303);
    }

    public function prepare(ResultCommandRequest $request, AcademicResultRule $rule)
    {
        $run = $this->deliberations->prepare($rule, $request->user(), $request->validated());

        return to_route('dashboard.admin.results.index', ['run' => $run->id], 303);
    }

    public function decision(ResultCommandRequest $request, AcademicDeliberation $run, AcademicOfficialResult $result)
    {
        $this->deliberations->decision($run, $result, $request->user(), $request->validated());

        return back(303);
    }

    public function transition(ResultCommandRequest $request, AcademicDeliberation $run)
    {
        $this->deliberations->transition($run, $request->user(), $request->validated());

        return back(303);
    }

    public function minutes(Request $request, AcademicDeliberation $run, ResultDocuments $documents)
    {
        $actor = $request->user();
        if ($actor->can(ResultsAccess::PUBLISH)) {
            $this->access->staff($actor, $run->context['faculty_id'], ResultsAccess::PUBLISH);
        } else {
            $this->access->staff($actor, $run->context['faculty_id'], ResultsAccess::JURY);
            abort_unless(in_array($actor->id, $run->jury['ids'], true), 403);
        }

        $data = $request->validate(['volume' => 'nullable|integer|min:1']);

        return $documents->issue($run, $request->user(), 'minutes', volume: (int) ($data['volume'] ?? 1));
    }

    public function export(Request $request, AcademicDeliberation $run)
    {
        $this->access->staff($request->user(), $run->context['faculty_id'], ResultsAccess::PUBLISH);
        abort_unless($run->state === 'published', 404);

        return response()->streamDownload(function () use ($run) {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, ['Référence', 'Matricule', 'Étudiant', 'Moyenne annuelle', 'Crédits acquis (centièmes)', 'Décision'], ';', '"', '');
            foreach ($run->results()->orderBy('id')->cursor() as $row) {
                $columns = [$row->reference, $row->snapshot['matricule'], $row->snapshot['student'], $row->snapshot['annual'],
                    $row->snapshot['credits']['earned'], $run->context['decisions'][$row->decision]['label']];
                fputcsv($stream, array_map(fn ($value) => is_string($value) && preg_match('/^(?:[\t\r\n]|\s*[=+@-])/u', $value) ? "'".$value : $value, $columns), ';', '"', '');
            }
            fclose($stream);
        }, 'resultats-'.$run->reference.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
    }

    public function certified(Request $request, AcademicOfficialResult $result)
    {
        $run = $result->run;
        $this->access->staff($request->user(), $run->context['faculty_id'], ResultsAccess::PUBLISH);
        abort_unless($run->state === 'published', 404);
        $snapshot = $result->snapshot;
        $snapshot['units'] = collect($snapshot['units'])->map(fn ($unit) => Arr::except($unit, ['raw', 'items']) + [
            'items' => collect($unit['items'])->map(fn ($item) => Arr::except($item, ['raw', 'sources', 'recognition'])),
        ]);

        return response()->json([
            'schema_version' => 1, 'reference' => $result->reference, 'edition' => $run->edition, 'published_at' => $run->published_at,
            'academic_enrollment_id' => $result->academic_enrollment_id, 'decision' => $result->decision,
            'context' => $run->context, 'snapshot' => Arr::except($snapshot, ['equivalences', 'anomalies', 'registrations']),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function review(ResultCommandRequest $request, ServiceRequest $appeal, ResultAppeals $appeals)
    {
        $appeals->decide($appeal, $request->user(), $request->validated());

        return back(303);
    }

    public function appealFile(Request $request, ServiceRequest $appeal, LearningFiles $files)
    {
        abort_unless($appeal->officialResult, 404);
        $this->access->staff($request->user(), $appeal->officialResult->run->context['faculty_id']);
        abort_unless($request->user()->canAny([ResultsAccess::MANAGE, ResultsAccess::PUBLISH]), 403);

        return $files->stream(['path' => $appeal->result_attachment, 'filename' => 'justificatif-'.basename($appeal->result_attachment ?? '')]);
    }

    private function summary(AcademicOfficialResult $row): array
    {
        return $row->only(['id', 'reference', 'decision', 'academic_enrollment_id']) + Arr::only($row->snapshot, ['student', 'matricule', 'annual', 'credits', 'anomalies', 'eliminatory']);
    }
}
