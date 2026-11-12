<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\Professor;
use App\Modules\LevelDetail\Application\Services\CourseCatalog;
use App\Modules\LevelDetail\Infrastructure\Http\Requests\SaveCourseRequest;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\TeachingAssignmentService;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class CourseCatalogController
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:100',
            'faculty' => 'nullable|integer|exists:faculties,id',
            'level' => 'nullable|integer|exists:levels,id',
            'semester' => 'nullable|in:1,2,unassigned',
            'status' => 'nullable|in:active,inactive,archived',
        ]);

        $term = $filters['q'] ?? '';
        $faculty = isset($filters['faculty']) ? (int) $filters['faculty'] : null;
        $level = isset($filters['level']) ? (int) $filters['level'] : null;
        $semester = $filters['semester'] ?? '';
        $status = $filters['status'] ?? '';
        $scope = $request->user()->academicFaculties();
        $restricted = $scope->exists();
        $pattern = '%'.strtr($term, ['!' => '!!', '%' => '!%', '_' => '!_']).'%';

        $courses = Courses::query()
            ->with('level.faculty:id,name')
            ->when($restricted, fn ($q) => $q->whereHas('level', fn ($l) => $l->whereIn('faculty_id', $scope->select('faculties.id'))))
            ->when($status, fn ($q) => $q->where('catalog_status', $status))
            ->when($term !== '', fn ($query) => $query->where(fn ($search) => $search
                ->whereRaw("LOWER(title) LIKE LOWER(?) ESCAPE '!'", [$pattern])
                ->orWhereRaw("LOWER(code) LIKE LOWER(?) ESCAPE '!'", [$pattern])))
            ->when($faculty, fn ($query) => $query->whereHas('level', fn ($levels) => $levels->where('faculty_id', $faculty)))
            ->when($level, fn ($query) => $query->where('level_id', $level))
            ->when($semester !== '', fn ($query) => $semester === 'unassigned'
                ? $query->whereNull('semester')
                : $query->where('semester', (int) $semester))
            ->orderBy('title')->orderBy('id')
            ->paginate(25, ['id', 'level_id', 'title', 'code', 'semester', 'credits', 'catalog_status'])
            ->appends($filters)
            ->through(fn (Courses $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'code' => $course->code,
                'credits' => (int) $course->credits,
                'status' => $course->catalog_status,
                'semester' => $course->semester === null ? null : (int) $course->semester,
                'level' => $course->level?->only(['id', 'title']),
                'faculty' => $course->level?->faculty?->name,
            ]);

        $canCreate = $request->user()->can('publish academic content');

        return Inertia::render('dashboard/courseCatalog/Index', [
            'courses' => $courses,
            'faculties' => Faculty::when($restricted, fn ($q) => $q->whereIn('id', $scope->select('faculties.id')))->orderBy('name')->get(['id', 'name']),
            'levels' => Level::when($restricted, fn ($q) => $q->whereIn('faculty_id', $scope->select('faculties.id')))->when($canCreate, fn ($query) => $query->with('detail:id,level_id,credit_required'))
                ->orderBy('title')->orderBy('id')->get(['id', 'title', 'faculty_id']),
            'canCreate' => $canCreate,
            'professors' => $canCreate ? Professor::where('is_active', true)->orderBy('last_name')->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'is_active']) : [],
            'years' => $canCreate ? AcademicYear::orderByDesc('start_date')->orderByDesc('id')->get(['id', 'title']) : [],
            'success' => $request->session()->get('success'),
            'filters' => compact('term', 'faculty', 'level', 'semester', 'status'),
        ]);
    }

    public function store(SaveCourseRequest $request, CourseCatalog $catalog, TeachingAssignmentService $assignments): RedirectResponse
    {
        $data = $request->validated();
        $actorId = $request->user()->id;
        TeachingScope::authorize($request->user(), (int) $data['faculty_id']);
        $professorId = $data['professor_id'] ?? null;

        DB::transaction(function () use ($catalog, $assignments, $data, $actorId, $professorId) {
            if ($professorId !== null) {
                // Match the lock order used when saving an annual teaching assignment.
                AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            }
            $level = Level::where('faculty_id', $data['faculty_id'])->lockForUpdate()->find($data['level_id']);
            if (! $level) {
                throw ValidationException::withMessages(['level_id' => 'Choisissez un niveau de la faculté sélectionnée.']);
            }

            $course = $catalog->save($level->id, Arr::only($data, array_keys(SaveCourseRequest::courseRules())));
            Audit::record($actorId, 'course_created', $course);

            if ($professorId !== null) {
                $assignments->save([
                    'course_id' => $course->id,
                    'academic_year_id' => $data['academic_year_id'],
                    'professor_id' => $professorId,
                    'is_published' => false,
                ], $actorId);
            }
        });

        return to_route('dashboard.admin.course-catalog.index', [
            'faculty' => $data['faculty_id'],
            'level' => $data['level_id'],
            'semester' => $data['semester'],
        ])->with('success', $professorId === null ? 'Cours ajouté au catalogue.' : 'Cours ajouté et enseignant affecté. L’offre reste à publier.');
    }

    public function show(Request $request, Courses $course): Response
    {
        abort_unless(TeachingScope::allows($request->user(), (int) $course->level->faculty_id), 403);

        return Inertia::render('dashboard/courseCatalog/Show', [
            'course' => $course->only(['id', 'code', 'title', 'description', 'discipline', 'semester', 'credits', 'cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content', 'catalog_status']),
            'level' => $course->level->title, 'canEdit' => $request->user()->can('publish academic content'),
            'uses' => $course->curriculumItems()->with('unit.version')->latest('id')->paginate(15, ['*'], 'versions_page')->withQueryString()->through(fn ($item) => [
                'id' => $item->id, 'unit' => $item->unit->name, 'title' => $item->name, 'version' => $item->unit->version->code, 'status' => $item->unit->version->status,
            ]),
            'offerings' => $course->offerings()->with('academicYear')->withCount('sessions', 'resources')->latest('id')->paginate(15)->withQueryString()->through(fn ($offer) => [
                'id' => $offer->id, 'year' => $offer->academicYear->title, 'sessions' => $offer->sessions_count, 'resources' => $offer->resources_count,
            ]),
        ]);
    }

    public function update(Request $request, Courses $course, CourseCatalog $catalog): RedirectResponse
    {
        TeachingScope::authorize($request->user(), (int) $course->level->faculty_id);
        $data = $request->validate(SaveCourseRequest::courseRules() + ['reason' => 'required|string|min:10|max:1000']);
        DB::transaction(function () use ($request, $course, $catalog, $data) {
            $saved = $catalog->save($course->level_id, Arr::except($data, ['reason']), $course->id);
            Audit::record($request->user()->id, 'course_updated', $saved, $data['reason'], ['fields' => array_keys($saved->getChanges())]);
        });

        return back(303)->with('success', 'Définition mise à jour. Les maquettes publiées conservent leur instantané.');
    }

    public function status(Request $request, Courses $course): RedirectResponse
    {
        TeachingScope::authorize($request->user(), (int) $course->level->faculty_id);
        $data = $request->validate(['status' => 'required|in:active,inactive,archived', 'reason' => 'required|string|min:10|max:1000']);
        DB::transaction(function () use ($request, $course, $data) {
            $course = Courses::lockForUpdate()->findOrFail($course->id);
            $previous = $course->catalog_status;
            if ($previous === $data['status']) {
                return;
            }
            if ($previous === 'archived') {
                throw ValidationException::withMessages(['status' => 'Une matière archivée reste disponible dans l’historique.']);
            }
            $course->forceFill(['catalog_status' => $data['status']])->save();
            Audit::record($request->user()->id, 'course_status_changed', $course, $data['reason'], ['from' => $previous, 'to' => $data['status']]);
        }, 3);

        return back(303)->with('success', 'Statut du catalogue enregistré.');
    }
}
