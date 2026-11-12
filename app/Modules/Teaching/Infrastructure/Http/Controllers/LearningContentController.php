<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\ContentSection;
use App\Modules\Teaching\Application\Services\LearningAccess;
use App\Modules\Teaching\Application\Services\LearningContent;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

final class LearningContentController
{
    public function __construct(private LearningAccess $access, private LearningContent $content, private LearningFiles $files) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:180', 'offering' => 'nullable|integer', 'resource' => 'nullable|integer',
            'year' => 'nullable|integer', 'faculty' => 'nullable|integer', 'program' => 'nullable|integer',
            'teacher' => 'nullable|integer', 'course' => 'nullable|integer',
            'status' => 'nullable|in:draft,published,archived', 'kind' => ['nullable', Rule::in(AcademicResource::CONTENT_KINDS)],
        ]);
        $actor = $request->user();
        $prefix = $request->routeIs('dashboard.admin.*') ? 'dashboard.admin.learning.' : 'dashboard.teaching.learning.';
        $scope = $this->access->scope($actor);
        $offer = isset($filters['offering']) ? (clone $scope)->findOrFail($filters['offering']) : null;
        $selected = isset($filters['resource']) ? AcademicResource::findOrFail($filters['resource']) : null;
        if ($selected) {
            $this->access->content($actor, $selected);
            abort_if($offer && $offer->id !== $selected->academic_offering_id, 404);
            $offer = $selected->offering;
        }

        $offers = clone $scope;
        foreach (['year' => 'academic_year_id', 'course' => 'course_id'] as $filter => $column) {
            $offers->when($filters[$filter] ?? null, fn ($q, $value) => $q->where($column, $value));
        }
        $offers->when($filters['program'] ?? null, fn ($q, $value) => $q->whereHas('curriculumItem.unit.version', fn ($version) => $version->where('academic_program_id', $value)));
        $offers->when($filters['faculty'] ?? null, fn ($q, $value) => $q->whereHas('level', fn ($level) => $level->where('faculty_id', $value)));
        $offers->when($filters['teacher'] ?? null, fn ($q, $value) => $q->where(fn ($q) => $q->where('professor_id', $value)
            ->orWhere('assistant_professor_id', $value)->orWhereHas('assignments', fn ($team) => $team->where('professor_id', $value)->whereNull('ends_at'))));
        $query = AcademicResource::whereNull('student_profile_id')->whereIn('kind', AcademicResource::CONTENT_KINDS)
            ->whereIn('academic_offering_id', (clone $offers)->select('id'))
            ->when($offer, fn ($q) => $q->where('academic_offering_id', $offer->id));
        if (! $actor->hasRole('admin')) {
            $teacher = $this->access->teacher($actor);
            $editable = (clone $scope)->whereNull('archived_at')->whereHas('academicYear', fn ($year) => $year->where('status', 'open'))
                ->where(fn ($q) => $q->where('professor_id', $teacher->id)
                    ->orWhereHas('assignments', fn ($team) => $team->where('professor_id', $teacher->id)->where('role', 'instructor')->whereNull('ends_at')));
            $query->where(fn ($q) => $q->visible()->when($actor->can('manage courses'), fn ($q) => $q->orWhereIn('academic_offering_id', $editable->select('id'))));
        }
        $query->when($filters['q'] ?? null, fn ($q, $value) => $q->where('title', 'like', '%'.$value.'%'))
            ->when($filters['kind'] ?? null, fn ($q, $value) => $q->where('kind', $value));
        match ($filters['status'] ?? null) {
            'published' => $query->where('is_published', true)->whereNull('archived_at'),
            'draft' => $query->where('is_published', false)->whereNull('archived_at'),
            'archived' => $query->whereNotNull('archived_at'),
            default => null,
        };

        $canManage = $offer && $this->access->canManage($actor, $offer);
        $canReadHistory = $selected && ($canManage || $actor->hasRole('admin'));
        $serialize = fn (AcademicResource $resource) => $resource->only([
            'id', 'kind', 'title', 'body', 'url', 'position', 'revision', 'is_published', 'published_at', 'archived_at',
            'academic_offering_id', 'academic_content_section_id', 'academic_session_id', 'supplementary_for_id',
            'filename', 'size_bytes', 'download_count', 'current_version', 'updated_at',
        ]) + [
            'course' => $resource->offering->course?->title,
            'section' => $resource->section?->title,
            'download_url' => $resource->path ? route($prefix.'file', $resource) : null,
            'preview_url' => $resource->path && LearningFiles::previewable($resource->disk, $resource->mime) ? route($prefix.'preview', $resource) : null,
        ];

        return Inertia::render('dashboard/teaching/Learning', [
            'prefix' => $prefix, 'filters' => $filters, 'offering' => $offer?->id, 'canManage' => $canManage,
            'resources' => (clone $query)->with(['offering.course', 'section'])->orderBy('position')->orderBy('id')->paginate(25)->withQueryString()->through($serialize),
            'downloads' => $actor->hasRole('admin') ? (int) (clone $query)->sum('download_count') : null,
            'offers' => $offers->with(['course', 'academicYear', 'group.intake'])->orderByDesc('academic_year_id')->orderBy('id')
                ->paginate(20, ['*'], 'offers_page')->withQueryString()->through(fn ($o) => [
                    'id' => $o->id, 'title' => implode(' · ', array_filter([$o->course?->title, $o->academicYear?->title, $o->group?->intake?->name])),
                ]),
            'selected' => $selected ? $serialize($selected) : null,
            'sections' => $offer ? ContentSection::where('academic_offering_id', $offer->id)->orderBy('position')->orderBy('id')->get(['id', 'title', 'position', 'revision']) : [],
            'sessions' => $canManage ? $offer->sessions()->orderByDesc('starts_at')->paginate(30, ['id', 'starts_at', 'room'], 'sessions_page')->withQueryString() : null,
            'works' => $canManage ? $offer->resources()->whereNull('student_profile_id')->whereIn('kind', ['assignment', 'evaluation'])->select(['id', 'title', 'revision', 'position', 'academic_content_section_id', 'academic_session_id'])->withExists('assessment')->orderBy('title')->orderBy('id')->paginate(30, ['*'], 'works_page')->withQueryString() : null,
            'file_status' => $selected?->path && $canReadHistory ? $this->files->status($selected->only(AcademicResource::EDITION_FIELDS)) : null,
            'versions' => $canReadHistory ? $selected->versions()->orderByDesc('number')->paginate(15, ['*'], 'versions_page')->withQueryString()->through(fn ($v) => [
                'number' => $v->number, 'reason' => $v->reason, 'author_id' => $v->author_id, 'created_at' => $v->created_at,
                'edition' => Arr::only($v->snapshot, ['title', 'body', 'url', 'filename', 'size_bytes', 'sha256']),
                'download_url' => empty($v->snapshot['path']) ? null : route($prefix.'version', [$selected, $v->number]),
            ]) : null,
        ]);
    }

    public function store(Request $request, AcademicOffering $offering)
    {
        $data = $request->validate($this->editionRules() + [
            'kind' => ['required', Rule::in(AcademicResource::CONTENT_KINDS)], 'operation_key' => 'required|uuid',
        ]);
        $resource = $this->content->create($offering, $request->user(), $data, $request->file('file'));

        return $this->open($request, $resource);
    }

    public function edit(Request $request, AcademicResource $resource)
    {
        $this->access->content($request->user(), $resource);
        $data = $request->validate($this->editionRules() + ['revision' => 'required|integer|min:0', 'reason' => 'required|string|min:5|max:1000']);
        $this->content->edit($resource, $request->user(), $data, $request->file('file'));

        return back(303);
    }

    public function transition(Request $request, AcademicResource $resource)
    {
        $this->access->content($request->user(), $resource);
        $data = $request->validate(['action' => 'required|in:publish,withdraw,archive', 'revision' => 'required|integer|min:0',
            'reason' => 'required|string|min:5|max:1000', 'notify' => 'boolean']);
        $this->content->transition($resource, $request->user(), $data);

        return back(303);
    }

    public function section(Request $request, AcademicOffering $offering, ?ContentSection $section = null)
    {
        $data = $request->validate(['title' => 'required|string|max:180', 'position' => 'required|integer|between:0,100000', 'revision' => $section ? 'required|integer|min:1' : 'nullable|integer']);
        $this->content->saveSection($offering, $request->user(), $data, $section);

        return back(303);
    }

    public function reuse(Request $request, AcademicResource $resource)
    {
        $this->access->content($request->user(), $resource);
        $data = $request->validate(['destination' => 'required|integer', 'source_version' => 'nullable|integer|min:1',
            'operation_key' => 'required|uuid', 'reason' => 'required|string|min:5|max:1000']);
        $destination = $this->access->scope($request->user())->findOrFail($data['destination']);
        $copy = $this->content->create($destination, $request->user(), $data + ['kind' => $resource->kind], source: $resource);

        return $this->open($request, $copy);
    }

    public function workPlacement(Request $request, AcademicResource $resource)
    {
        $data = $request->validate(Arr::only($this->editionRules(), ['academic_content_section_id', 'academic_session_id', 'position']) + [
            'revision' => 'required|integer|min:0', 'reason' => 'required|string|min:5|max:1000',
        ]);
        $this->content->placeWork($resource, $request->user(), $data);

        return back(303);
    }

    public function file(Request $request, AcademicResource $resource)
    {
        $this->access->content($request->user(), $resource);

        return $this->files->stream($resource->only(AcademicResource::EDITION_FIELDS));
    }

    public function preview(Request $request, AcademicResource $resource)
    {
        $this->access->content($request->user(), $resource);

        return $this->files->stream($resource->only(AcademicResource::EDITION_FIELDS), true);
    }

    public function version(Request $request, AcademicResource $resource, int $number)
    {
        $this->access->content($request->user(), $resource);
        abort_unless($request->user()->hasRole('admin') || $this->access->canManage($request->user(), $resource->offering), 403);

        return $this->files->stream($resource->versions()->where('number', $number)->firstOrFail()->snapshot);
    }

    private function open(Request $request, AcademicResource $resource)
    {
        return redirect()->route($request->routeIs('dashboard.admin.*') ? 'dashboard.admin.learning.index' : 'dashboard.teaching.learning.index', [
            'offering' => $resource->academic_offering_id, 'resource' => $resource->id,
        ], 303);
    }

    private function editionRules(): array
    {
        return ['title' => 'required|string|max:180', 'body' => 'nullable|string|max:30000', 'url' => 'nullable|url:http,https|max:2000',
            'file' => 'nullable|file', 'position' => 'sometimes|required|integer|between:0,100000',
            'academic_content_section_id' => 'nullable|integer', 'academic_session_id' => 'nullable|integer', 'supplementary_for_id' => 'nullable|integer'];
    }
}
