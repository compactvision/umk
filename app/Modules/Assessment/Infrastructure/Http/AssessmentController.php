<?php

namespace App\Modules\Assessment\Infrastructure\Http;

use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\AssessmentHandoff;
use App\Models\Student\AssessmentRecord;
use App\Models\Student\ContentSection;
use App\Modules\Assessment\Application\AssessmentAccess;
use App\Modules\Assessment\Application\AssessmentCopies;
use App\Modules\Assessment\Application\AssessmentCorrections;
use App\Modules\Assessment\Application\AssessmentWorkflow;
use App\Modules\Teaching\Application\Services\CourseAudience;
use App\Modules\Teaching\Application\Services\LearningAccess;
use App\Modules\Teaching\Application\Services\LearningFiles;
use App\Support\DocumentUploadLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

final class AssessmentController
{
    private const REASON = 'required|string|min:5|max:1000';

    private const REVISION = 'required|integer|min:1';

    public function __construct(private AssessmentAccess $access, private AssessmentWorkflow $workflow, private AssessmentCorrections $corrections) {}

    public function index(Request $request)
    {
        $actor = $request->user();
        $filter = $request->validate([
            'q' => 'nullable|string|max:180', 'year' => 'nullable|integer', 'offering' => 'nullable|integer',
            'resource' => 'nullable|integer', 'record' => 'nullable|integer', 'copy_version' => 'nullable|integer|min:1',
            'state' => 'nullable|in:draft,published,closed,cancelled', 'category' => 'nullable|string|max:60',
            'correction' => 'nullable|in:draft,finalized,validated', 'participation' => ['nullable', Rule::in(AssessmentRecord::PARTICIPATION)],
        ]);
        $scope = $this->access->scope($actor);
        $offer = isset($filter['offering']) ? (clone $scope)->findOrFail($filter['offering']) : null;
        $resource = isset($filter['resource']) ? AcademicResource::with(['offering.course', 'session', 'assessment'])->findOrFail($filter['resource']) : null;
        if ($resource) {
            $this->access->read($actor, $resource->offering);
            abort_unless($resource->assessment && (! $offer || $offer->id === $resource->academic_offering_id), 404);
            $offer = $resource->offering;
        }
        $assessment = $resource?->assessment;
        $prefix = $request->routeIs('dashboard.admin.*') ? 'dashboard.admin.assessments.' : 'dashboard.teaching.assessments.';
        $offerList = (clone $scope)->when($filter['year'] ?? null, fn ($q, $id) => $q->where('academic_year_id', $id));
        $list = AcademicAssessment::whereHas('resource', fn ($q) => $q->whereIn('academic_offering_id', (clone $offerList)->select('id'))
            ->when($offer, fn ($q) => $q->where('academic_offering_id', $offer->id))
            ->when($filter['q'] ?? null, fn ($q, $term) => $q->where('title', 'like', '%'.$term.'%')))
            ->when($filter['category'] ?? null, fn ($q, $category) => $q->where('category', $category));
        $records = $assessment?->records()->with(['group', 'enrollment.profile.user'])
            ->when($filter['correction'] ?? null, fn ($q, $state) => $q->where('correction_state', $state))
            ->when($filter['participation'] ?? null, fn ($q, $state) => $q->where('participation', $state));
        $record = isset($filter['record']) && $assessment ? $assessment->records()->with(['group', 'enrollment.profile.user'])->findOrFail($filter['record']) : null;
        $copy = $record ? AcademicSubmission::where('academic_resource_id', $resource->id)
            ->where('academic_enrollment_id', $record->group?->leader_enrollment_id ?? $record->academic_enrollment_id)->first() : null;
        $history = $record?->history()->orderByDesc('revision')->paginate(10, ['*'], 'history_page')->withQueryString()
            ->through(fn ($version) => [
                'revision' => $version->revision, 'created_at' => $version->created_at,
                'snapshot' => Arr::except($version->snapshot, ['feedback_path']),
                'file_url' => empty($version->snapshot['feedback_path']) ? null : route($prefix.'feedback', [$resource, $record, 'version' => $version->revision]),
            ]);
        $recordRow = fn ($row) => $row->only(['id', 'participation', 'correction_state', 'revision', 'points', 'adjustment',
            'criterion_points', 'feedback', 'feedback_filename', 'released_at', 'academic_enrollment_id']) + [
                'name' => $row->enrollment?->profile?->user?->full_name,
                'group' => $row->group?->label, 'group_points' => $row->group?->shared_points,
            ];
        $copyVersion = $copy ? (int) ($filter['copy_version'] ?? $copy->version) : null;
        $snapshot = $copy ? app(AssessmentCopies::class)->snapshot($copy, $copyVersion) : null;
        $groupCandidates = $assessment && $assessment->group_work && in_array($assessment->state, ['draft', 'published'], true)
            ? app(CourseAudience::class)->roster($offer)->whereNotIn('id', $assessment->records()->select('academic_enrollment_id'))
                ->with('profile.user')->orderBy('id')->paginate(25, ['*'], 'candidates_page')->withQueryString()
                ->through(fn ($entry) => ['id' => $entry->id, 'name' => $entry->profile?->user?->full_name])
            : null;
        $stateCounts = (clone $list)->selectRaw('state, count(*) as total')->groupBy('state')->pluck('total', 'state');
        $workCounts = ($assessment ? $assessment->records() : AssessmentRecord::whereIn('academic_assessment_id', (clone $list)->select('id')))
            ->selectRaw('correction_state, count(*) as total')->groupBy('correction_state')->pluck('total', 'correction_state');
        $published = (clone $list)->where('state', 'published');
        $upcoming = (clone $published)->whereHas('resource', fn ($q) => $q->where('opens_at', '>', now()))->count();
        $open = $published->whereHas('resource', fn ($q) => $q->where('opens_at', '<=', now())->where('closes_at', '>=', now()))->count();
        $canEdit = $offer && app(LearningAccess::class)->canManage($actor, $offer);

        return Inertia::render('dashboard/teaching/Assessments', [
            'prefix' => $prefix, 'admin' => $actor->hasRole('admin'), 'canEdit' => $canEdit, 'filters' => $filter, 'offering' => $offer?->id,
            'categories' => config('assessment.categories'), 'participation' => AssessmentRecord::PARTICIPATION,
            'state_counts' => $stateCounts, 'work_counts' => $workCounts, 'upcoming_count' => $upcoming, 'open_count' => $open,
            'offers' => $offerList->with(['course', 'academicYear', 'group.intake'])->orderByDesc('academic_year_id')->orderBy('id')
                ->paginate(20, ['*'], 'offers_page')->withQueryString()->through(fn ($offer) => [
                    'id' => $offer->id, 'title' => implode(' · ', array_filter([$offer->course?->title, $offer->academicYear?->title, $offer->group?->intake?->name])),
                ]),
            'sessions' => $canEdit ? $offer->sessions()->whereNull('cancelled_at')->orderByDesc('starts_at')->paginate(25, ['id', 'room', 'starts_at', 'is_published'], 'sessions_page')->withQueryString() : null,
            'sections' => $canEdit ? ContentSection::where('academic_offering_id', $offer->id)->orderBy('position')->get(['id', 'title']) : [],
            'items' => $list->when($filter['state'] ?? null, fn ($q, $state) => $q->where('state', $state))->with('resource.offering.course')
                ->latest('id')->paginate(20)->withQueryString()->through(fn ($item) => $this->summary($item)),
            'selected' => $assessment ? $this->summary($assessment) + [
                'body' => $resource->body, 'objectives' => $assessment->objectives, 'attempt_limit' => $assessment->attempt_limit,
                'late_minutes' => $assessment->late_minutes, 'maximum_points' => $assessment->maximum_points, 'weight' => $assessment->weight,
                'group_work' => $assessment->group_work, 'feedback_policy' => $assessment->feedback_policy, 'rubric' => $assessment->rubric,
                'academic_session_id' => $resource->academic_session_id, 'academic_content_section_id' => $resource->academic_content_section_id,
                'session' => $resource->session?->only(['id', 'starts_at', 'ends_at', 'room', 'is_published', 'cancelled_at']),
            ] : null,
            'groups' => $assessment?->groups()->orderBy('id')->paginate(20, ['*'], 'groups_page')->withQueryString(),
            'records' => $records?->orderBy('id')->paginate(25, ['*'], 'records_page')->withQueryString()->through($recordRow),
            'record' => $record ? $recordRow($record) : null, 'history' => $history, 'candidates' => $groupCandidates,
            'copy' => $snapshot ? Arr::except($snapshot, ['path']) + [
                'version' => $copyVersion, 'current_version' => $copy->version,
                'download_url' => $snapshot['path'] ? route($prefix.'copy', [$resource, $record, 'version' => $copyVersion]) : null,
            ] : null,
        ]);
    }

    public function store(Request $request, AcademicOffering $offering)
    {
        $resource = $this->workflow->draft($offering, $request->user(), $request->validate($this->draftRules()));

        return to_route($request->routeIs('dashboard.admin.*') ? 'dashboard.admin.assessments.index' : 'dashboard.teaching.assessments.index',
            ['offering' => $offering->id, 'resource' => $resource->id], 303);
    }

    public function edit(Request $request, AcademicResource $resource)
    {
        $this->workflow->draft($resource->offering, $request->user(), $request->validate($this->draftRules() + [
            'revision' => self::REVISION, 'reason' => self::REASON,
        ]), $resource);

        return back(303);
    }

    public function lifecycle(Request $request, AcademicResource $resource)
    {
        $this->workflow->lifecycle($resource, $request->user(), $request->validate([
            'action' => 'required|in:publish,close,cancel', 'revision' => self::REVISION, 'reason' => self::REASON, 'notify' => 'boolean',
        ]));

        return back(303);
    }

    public function group(Request $request, AcademicResource $resource)
    {
        $this->workflow->group($resource, $request->user(), $request->validate([
            'label' => 'required|string|max:120', 'leader' => 'required|integer|min:1', 'members' => 'required|array|min:2|max:50',
            'members.*' => 'required|integer|min:1|distinct', 'revision' => self::REVISION, 'reason' => self::REASON,
        ]));

        return back(303);
    }

    public function groupScore(Request $request, AcademicResource $resource, int $group)
    {
        $this->corrections->groupScore($resource, $request->user(), $group, $request->validate([
            'points' => 'nullable|string|max:12', 'feedback' => 'nullable|string|max:20000', 'revision' => self::REVISION, 'reason' => self::REASON,
        ]));

        return back(303);
    }

    public function correct(Request $request, AcademicResource $resource, AssessmentRecord $record)
    {
        $this->access->write($request->user(), $resource->offering);
        $this->corrections->save($resource, $request->user(), $record, $request->validate([
            'participation' => ['required', Rule::in(AssessmentRecord::PARTICIPATION)], 'points' => 'nullable|string|max:12',
            'adjustment' => 'nullable|string|max:12', 'criteria' => 'nullable|array|max:20', 'criteria.*' => 'nullable|string|max:12',
            'feedback' => 'nullable|string|max:20000', 'file' => 'nullable|file|max:'.DocumentUploadLimit::kilobytes(),
            'revision' => self::REVISION, 'reason' => self::REASON,
        ]), $request->file('file'));

        return back(303);
    }

    public function record(Request $request, AcademicResource $resource, AssessmentRecord $record)
    {
        $this->corrections->record($resource, $request->user(), $record, $request->validate([
            'action' => 'required|in:finalize,reopen', 'revision' => self::REVISION, 'reason' => self::REASON,
        ]));

        return back(303);
    }

    public function batch(Request $request, AcademicResource $resource)
    {
        $this->corrections->batch($resource, $request->user(), $request->validate([
            'action' => 'required|in:validate,release', 'revision' => self::REVISION, 'reason' => self::REASON, 'notify' => 'boolean',
        ]));

        return back(303);
    }

    public function copy(Request $request, AcademicResource $resource, AssessmentRecord $record, AssessmentCopies $copies)
    {
        $this->access->read($request->user(), $resource->offering);
        $record = $resource->assessment()->firstOrFail()->records()->with('group')->findOrFail($record->id);
        $data = $request->validate(['version' => 'nullable|integer|min:1']);
        $submission = AcademicSubmission::where('academic_resource_id', $resource->id)
            ->where('academic_enrollment_id', $record->group?->leader_enrollment_id ?? $record->academic_enrollment_id)->firstOrFail();

        return $copies->download($submission, isset($data['version']) ? (int) $data['version'] : null);
    }

    public function feedback(Request $request, AcademicResource $resource, AssessmentRecord $record, LearningFiles $files)
    {
        $this->access->read($request->user(), $resource->offering);
        $record = $resource->assessment()->firstOrFail()->records()->findOrFail($record->id);
        $data = $request->validate(['version' => 'nullable|integer|min:1']);
        $edition = isset($data['version']) ? $record->history()->where('revision', $data['version'])->firstOrFail()->snapshot
            : $record->only(['feedback_path', 'feedback_filename']);

        return $files->stream(['path' => $edition['feedback_path'], 'filename' => $edition['feedback_filename']]);
    }

    public function handoff(Request $request)
    {
        $actor = $request->user();
        abort_unless($actor->hasRole('admin'), 403);
        $scope = $this->access->scope($actor);
        $data = $request->validate(['after' => 'nullable|integer|min:0']);

        return response()->json(AssessmentHandoff::where('id', '>', $data['after'] ?? 0)
            ->whereHas('record.assessment.resource', fn ($query) => $query->whereIn('academic_offering_id', $scope->select('id')))
            ->orderBy('id')->limit(100)->get(['id', 'payload']))
            ->header('Cache-Control', 'private, no-store');
    }

    private function summary(AcademicAssessment $item): array
    {
        return $item->only(['id', 'state', 'category', 'session_code', 'modality', 'revision']) + [
            'resource_id' => $item->academic_resource_id, 'offering_id' => $item->resource->academic_offering_id,
            'title' => $item->resource->title, 'course' => $item->resource->offering->course?->title,
            'opens_at' => $item->resource->opens_at, 'closes_at' => $item->resource->closes_at,
        ];
    }

    private function draftRules(): array
    {
        return [
            'title' => 'required|string|max:180', 'body' => 'nullable|string|max:20000', 'objectives' => 'nullable|string|max:5000',
            'category' => ['required', Rule::in(array_keys(config('assessment.categories')))], 'session_code' => 'required|alpha_dash:ascii|max:60',
            'modality' => 'required|in:submission,in_person', 'opens_at' => 'nullable|date', 'closes_at' => 'nullable|date',
            'academic_session_id' => 'nullable|integer|min:1', 'academic_content_section_id' => 'nullable|integer|min:1',
            'maximum_points' => 'nullable|string|max:12', 'weight' => 'nullable|string|max:12',
            'attempt_limit' => 'required|integer|between:1,20', 'late_minutes' => 'required|integer|between:0,10080',
            'group_work' => 'required|boolean', 'feedback_policy' => 'required|in:finalized,validated',
            'rubric' => 'nullable|array|max:20', 'rubric.*.label' => 'required|string|max:120', 'rubric.*.maximum' => 'required|string|max:12',
        ];
    }
}
