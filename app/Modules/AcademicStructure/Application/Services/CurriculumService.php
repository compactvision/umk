<?php

namespace App\Modules\AcademicStructure\Application\Services;

use App\Models\AcademicStructure\AcademicCycle;
use App\Models\AcademicStructure\AcademicProgram;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicStructure\University;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Courses;
use App\Models\Faculty;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicSession;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\DraftCurriculumSchedule;
use App\Modules\Teaching\Application\Services\TeachingScope;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CurriculumService
{
    public function __construct(private StructureService $structure) {}

    public function owned(int $id): CurriculumVersion
    {
        $version = CurriculumVersion::findOrFail($id);
        $this->structure->program($version->academic_program_id);

        return $version;
    }

    private function checkRevision(CurriculumVersion $version, int $revision): void
    {
        if ($version->revision !== $revision) {
            throw ValidationException::withMessages(['revision' => 'La maquette a changé. Rechargez sa dernière version.']);
        }
    }

    private function locked(CurriculumVersion $version): CurriculumVersion
    {
        AcademicProgram::whereKey($version->academic_program_id)->lockForUpdate()->firstOrFail();

        return CurriculumVersion::lockForUpdate()->findOrFail($version->id);
    }

    public function draft(array $data, User $actor): CurriculumVersion
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        $data = Validator::make($data, ['academic_program_id' => 'required|integer', 'code' => 'required|string|max:60|regex:/^[A-Za-z0-9_.-]+$/', 'name' => 'required|string|max:255', 'academic_year_id' => 'nullable|integer', 'admission_cohort_id' => 'nullable|integer', 'clone_id' => 'nullable|integer', 'reason' => 'required|string|min:5|max:1000'])->validate();

        return DB::transaction(function () use ($data, $actor) {
            $program = $this->structure->program($data['academic_program_id']);
            TeachingScope::authorize($actor, (int) $program->faculty_id);
            AcademicProgram::whereKey($program->id)->lockForUpdate()->firstOrFail();

            return $this->createDraft($program, $data, $actor->id);
        });
    }

    private function createDraft(AcademicProgram $program, array $data, ?int $actorId): CurriculumVersion
    {
        $year = $data['academic_year_id'] ?? null;
        $cohort = $data['admission_cohort_id'] ?? null;
        if (($year === null) === ($cohort === null)) {
            throw ValidationException::withMessages(['applicability' => 'Choisissez exactement une année ou une cohorte.']);
        }
        if ($year) {
            $this->structure->year($year);
        }
        if ($cohort) {
            AdmissionCohort::where('academic_program_id', $program->id)->findOrFail($cohort);
        }
        $source = ! empty($data['clone_id']) ? CurriculumVersion::where('academic_program_id', $program->id)->with('units.items')->findOrFail($data['clone_id']) : null;
        $version = CurriculumVersion::create([
            'academic_program_id' => $program->id, 'academic_year_id' => $year, 'admission_cohort_id' => $cohort,
            'code' => strtoupper($data['code']), 'name' => $data['name'], 'status' => 'draft',
            'weighting_mode' => $source?->weighting_mode ?? $program->cycle->weighting_mode,
            'periods' => $source?->periods ?? $program->cycle->periods,
            'program_snapshot' => $source?->program_snapshot ?? ['code' => $program->code, 'name' => $program->name, 'degree' => $program->degree, 'cycle' => $program->cycle->name, 'department' => $program->department?->name, 'faculty' => $program->faculty->name, 'university' => $this->structure->current()->name, 'university_id' => $this->structure->current()->id, 'university_code' => $this->structure->current()->code, 'faculty_id' => $program->faculty_id, 'normal_duration' => $program->normal_duration ?? $program->cycle->normal_duration, 'level_order' => $program->levels()->pluck('levels.id')->all()],
        ]);
        if ($source) {
            foreach ($source->units as $unit) {
                $copy = $version->units()->create(Arr::except($unit->attributesToArray(), ['id', 'curriculum_version_id', 'created_at', 'updated_at']));
                foreach ($unit->items as $item) {
                    $copy->items()->create(Arr::except($item->attributesToArray(), ['id', 'curriculum_unit_id', 'curriculum_version_id', 'created_at', 'updated_at']));
                }
            }
        } else {
            $this->prefillFromCatalog($version, $program);
        }
        Audit::record($actorId, 'curriculum_draft_created', $version, $data['reason'], ['cloned_from' => $source?->id]);

        return $version;
    }

    /** The caller must hold a lock on the program within a transaction. */
    public function ensureAnnualDraft(AcademicProgram $program, AcademicYear $year, ?int $actorId): array
    {
        $versions = $program->versions()->orderByDesc('id')->lockForUpdate()->get(['id', 'code', 'academic_year_id', 'status']);
        $existing = $versions->whereNotIn('status', ['archived', 'replaced'])->firstWhere('academic_year_id', $year->id);
        if ($existing) {
            return ['status' => 'existing', 'version_id' => $existing->id];
        }
        if ($program->levels->isEmpty()) {
            return ['status' => 'skipped', 'message' => 'Aucun niveau rattaché au programme.'];
        }

        $baseCode = 'ANNEE-'.$year->id;
        $codes = $versions->pluck('code')->map(fn ($code) => strtoupper($code))->flip();
        $code = $baseCode;
        for ($suffix = 2; $codes->has($code); $suffix++) {
            $code = $baseCode.'-'.$suffix;
        }

        $draft = $this->createDraft($program, [
            'academic_year_id' => $year->id,
            'code' => $code,
            'name' => 'Maquette '.$year->title,
            'reason' => 'Génération annuelle à partir du catalogue des matières.',
        ], $actorId);

        return ['status' => 'created', 'version_id' => $draft->id];
    }

    public function draftAnnualBatch(int $yearId, User $actor, array $rooms = []): array
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        abort_if($actor->academicFaculties()->exists(), 403, 'La préparation institutionnelle requiert un périmètre global.');
        $institution = $this->structure->current();
        $year = $this->structure->year($yearId);
        $this->prepareFacultyPrograms($institution, $actor);
        $programs = AcademicProgram::openForAdmission()->with('faculty:id,name')
            ->whereHas('faculty', fn ($query) => $query->where('university_id', $institution->id))
            ->orderBy('id')->get();
        $rows = [];

        foreach ($programs as $program) {
            $row = ['faculty' => $program->faculty->name, 'program' => $program->name, 'program_id' => $program->id];
            try {
                $result = DB::transaction(function () use ($program, $year, $actor) {
                    $locked = AcademicProgram::with(['faculty', 'department', 'cycle', 'levels'])->lockForUpdate()->findOrFail($program->id);
                    TeachingScope::authorize($actor, (int) $locked->faculty_id);

                    return $this->ensureAnnualDraft($locked, $year, $actor->id);
                }, 3);
                if (isset($result['version_id'])) {
                    $result['schedule'] = $this->scheduleDraft($result['version_id'], $actor, $rooms);
                }
                $rows[] = $row + $result;
            } catch (ValidationException $error) {
                $rows[] = $row + ['status' => 'skipped', 'message' => Arr::first(Arr::flatten($error->errors()))];
            }
        }

        $facultiesWithoutPrograms = Faculty::where(fn ($query) => $query->where('university_id', $institution->id)->orWhereNull('university_id'))
            ->whereNotIn('id', $programs->pluck('faculty_id'))->orderBy('name')->get(['name', 'university_id']);
        foreach ($facultiesWithoutPrograms as $faculty) {
            $rows[] = [
                'faculty' => $faculty->name,
                'status' => 'skipped',
                'message' => $faculty->university_id === null ? 'Faculté à rattacher à l’établissement.' : 'Aucun programme actif éligible.',
            ];
        }

        return ['year' => $year->title, 'rows' => $rows];
    }

    private function prepareFacultyPrograms(University $institution, User $actor): void
    {
        if (! $institution->is_active) {
            throw ValidationException::withMessages(['academic_year_id' => 'Activez l’établissement avant de générer les maquettes.']);
        }

        DB::transaction(function () use ($institution, $actor) {
            University::whereKey($institution->id)->lockForUpdate()->firstOrFail();
            $faculties = Faculty::where('is_active', true)
                ->where(fn ($query) => $query->where('university_id', $institution->id)->orWhereNull('university_id'))
                ->orderBy('id')->lockForUpdate()->get();

            foreach ($faculties as $faculty) {
                $levels = $faculty->levels()->where('is_active', true)->orderBy('id')->pluck('id');
                if ($levels->isEmpty()) {
                    continue;
                }
                if ($faculty->university_id === null) {
                    $faculty->forceFill(['university_id' => $institution->id])->save();
                    Audit::record($actor->id, 'faculty_linked_for_curriculum_batch', $faculty, 'Génération annuelle des maquettes.');
                }
                $programs = AcademicProgram::openForAdmission()->where('faculty_id', $faculty->id)->with('levels')->get();
                $uncovered = $levels->diff($programs->flatMap(fn ($program) => $program->levels->modelKeys()))->values();
                if ($uncovered->isEmpty()) {
                    continue;
                }

                $cycle = AcademicCycle::firstOrCreate(
                    ['university_id' => $institution->id, 'code' => 'MAQUETTES-AUTO'],
                    [
                        'name' => 'Cycle semestriel', 'is_active' => true, 'normal_duration' => 3, 'progression_mode' => 'annual', 'weighting_mode' => 'credits',
                        'periods' => [['code' => 'S1', 'name' => 'Semestre 1'], ['code' => 'S2', 'name' => 'Semestre 2']],
                    ],
                );
                if (! $cycle->is_active) {
                    throw ValidationException::withMessages(['academic_year_id' => 'Réactivez le cycle semestriel utilisé pour la génération automatique.']);
                }
                $base = 'AUTO-NIVEAU-'.$uncovered->first();
                $code = $base;
                for ($suffix = 2; AcademicProgram::where('faculty_id', $faculty->id)->where('code', $code)->exists(); $suffix++) {
                    $code = $base.'-'.$suffix;
                }
                $program = AcademicProgram::create([
                    'faculty_id' => $faculty->id, 'academic_cycle_id' => $cycle->id, 'code' => $code,
                    'name' => $programs->isEmpty() ? $faculty->name : $faculty->name.' · Niveaux complémentaires',
                ]);
                $program->levels()->attach($uncovered->mapWithKeys(fn ($id, $position) => [$id => ['position' => $position + 1]])->all());
                Audit::record($actor->id, 'curriculum_program_generated', $program, 'Génération annuelle des maquettes.');
            }
        }, 3);
    }

    public function annualFacultyPack(University $institution, int $yearId): array
    {
        $versions = CurriculumVersion::where('academic_year_id', $yearId)->whereNotIn('status', ['archived', 'replaced'])
            ->whereHas('program.faculty', fn ($query) => $query->where('university_id', $institution->id))
            ->with(['program.levels', 'units.items'])->latest('id')->get()->unique('academic_program_id')->groupBy('program.faculty_id');

        return Faculty::where('is_active', true)
            ->where(fn ($query) => $query->where('university_id', $institution->id)->orWhereNull('university_id'))
            ->with(['levels' => fn ($query) => $query->where('is_active', true)])->orderBy('name')->get()
            ->map(function (Faculty $faculty) use ($versions) {
                $reviews = collect();
                $maquettes = $versions->get($faculty->id, collect())->map(function (CurriculumVersion $version) use ($reviews) {
                    $levels = $this->levelWorkspace($version, $version->program);
                    $reviews->push(...$levels);

                    return [
                        'id' => $version->id, 'program_id' => $version->academic_program_id, 'name' => $version->program->name,
                        'levels' => array_map(fn ($level) => Arr::only($level, ['id', 'title', 'approved']), $levels),
                    ];
                });
                $levelIds = $faculty->levels->modelKeys();
                $byLevel = $reviews->groupBy('id');
                $approved = collect($levelIds)->filter(fn ($id) => $byLevel->has($id) && $byLevel->get($id)->every('approved', true))->count();

                return [
                    'id' => $faculty->id, 'name' => $faculty->name, 'total' => count($levelIds), 'approved' => $approved,
                    'versions' => $maquettes->values()->all(),
                ];
            })->all();
    }

    public function scheduleDraft(int $versionId, User $actor, array $rooms = []): ?array
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        $owned = $this->owned($versionId);
        TeachingScope::authorize($actor, (int) $owned->program->faculty_id);

        return DB::transaction(function () use ($owned, $actor, $rooms) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $version = $this->locked($owned);
            if ($version->status !== 'draft') {
                return null;
            }
            $year = $this->structure->year($version->academic_year_id ?? $version->cohort->academic_year_id);

            return app(DraftCurriculumSchedule::class)->generate($version, $year, $actor->id, $rooms);
        }, 3);
    }

    private function prefillFromCatalog(CurriculumVersion $version, AcademicProgram $program): void
    {
        $periods = array_values($version->periods);
        $courses = Courses::where('catalog_status', 'active')->whereIn('level_id', $program->levels->modelKeys())->orderBy('title')->orderBy('id')->limit(1501)->get();
        if ($courses->count() > 1500) {
            throw ValidationException::withMessages(['units' => 'Une maquette peut référencer au plus 1 500 matières.']);
        }
        $coursesByLevel = $courses->groupBy('level_id');
        $position = 0;

        foreach ($program->levels as $level) {
            $byPeriod = $coursesByLevel->get($level->id, collect())->groupBy(
                fn (Courses $course) => isset($periods[(int) $course->semester - 1]) ? (int) $course->semester - 1 : 0
            );
            foreach ($periods as $index => $period) {
                $parts = $byPeriod->get($index, collect())->chunk(200)->values();
                foreach ($parts as $part => $items) {
                    if ($position === 300) {
                        throw ValidationException::withMessages(['units' => 'Une maquette peut contenir au plus 300 unités.']);
                    }
                    $unit = $version->units()->create([
                        'level_id' => $level->id,
                        'level_code' => $level->code,
                        'level_title' => $level->title,
                        'period_code' => $period['code'],
                        'period_name' => $period['name'],
                        'code' => 'CAT-'.($part + 1),
                        'name' => $parts->count() > 1 ? 'Matières du catalogue · '.($part + 1) : 'Matières du catalogue',
                        'position' => ++$position,
                    ]);
                    foreach ($items as $course) {
                        $unit->items()->create(['source_course_id' => $course->id] + $this->courseSnapshot($course));
                    }
                }
            }
        }
    }

    private function courseSnapshot(Courses $course): array
    {
        return [
            'name' => $course->title,
            'code' => $course->code,
            'description' => $course->description,
            'pedagogical_content' => is_array($course->pedagogical_content)
                ? $course->pedagogical_content
                : json_decode($course->pedagogical_content ?? 'null', true),
            'credits' => $course->credits,
            'coefficient' => null,
            'cmi_hours' => $course->cmi_hours ?? 0,
            'td_hours' => $course->td_hours ?? 0,
            'tp_hours' => $course->tp_hours ?? 0,
        ];
    }

    public function saveDraft(int $id, array $data, User $actor): CurriculumVersion
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        $input = Validator::make($data, [
            'revision' => 'required|integer|min:0', 'reason' => 'required|string|min:5|max:1000', 'units' => 'present|array|max:300',
            'units.*.level_id' => 'required|integer', 'units.*.period_code' => 'required|string|max:60', 'units.*.code' => 'required|string|max:60', 'units.*.name' => 'required|string|max:255', 'units.*.expected_credits' => 'nullable|numeric|min:0|max:999999.99|decimal:0,2',
            'units.*.credit_rule' => 'sometimes|in:sum,independent', 'units.*.items.*.is_optional' => 'sometimes|boolean',
            'units.*.items' => 'present|array|max:200', 'units.*.items.*.source_course_id' => 'required|integer', 'units.*.items.*.name' => 'sometimes|string|max:255', 'units.*.items.*.code' => 'nullable|string|max:60', 'units.*.items.*.description' => 'nullable|string|max:50000',
            'units.*.items.*.credits' => 'nullable|numeric|min:0|max:999999.99|decimal:0,2', 'units.*.items.*.coefficient' => 'nullable|numeric|min:0|max:99999.999|decimal:0,3',
            'units.*.items.*.cmi_hours' => 'sometimes|integer|min:0|max:100000', 'units.*.items.*.td_hours' => 'sometimes|integer|min:0|max:100000', 'units.*.items.*.tp_hours' => 'sometimes|integer|min:0|max:100000',
        ])->validate();
        $owned = $this->owned($id);
        TeachingScope::authorize($actor, (int) $owned->program->faculty_id);

        return DB::transaction(function () use ($owned, $input, $actor) {
            $version = $this->locked($owned);
            $this->checkRevision($version, $input['revision']);
            if ($version->status !== 'draft') {
                throw ValidationException::withMessages(['version' => 'Seul un brouillon peut être modifié.']);
            }
            $program = $this->structure->program($version->academic_program_id);
            $periods = collect($version->periods)->keyBy('code');
            $levels = $program->levels->keyBy('id');
            $courseIds = collect($input['units'])->pluck('items')->flatten(1)->pluck('source_course_id')->unique();
            if ($courseIds->count() > 1500) {
                throw ValidationException::withMessages(['units' => 'Une maquette peut référencer au plus 1 500 matières.']);
            }
            $previousCourses = CurriculumItem::where('curriculum_version_id', $version->id)->pluck('source_course_id')->flip();
            $courses = Courses::whereIntegerInRaw('id', $courseIds->all())->get()->keyBy('id');
            $seen = [];
            $unitCodes = [];
            // All reference checks precede replacement; the transaction restores the draft on failure.
            foreach ($input['units'] as $unit) {
                if (! $levels->has($unit['level_id']) || ! $periods->has($unit['period_code'])) {
                    throw ValidationException::withMessages(['units' => 'Le niveau ou la période ne correspond pas au programme.']);
                }
                $unitKey = $unit['level_id'].':'.$unit['period_code'].':'.mb_strtolower(trim($unit['code']));
                if (isset($unitCodes[$unitKey])) {
                    throw ValidationException::withMessages(['units' => 'Le code UE existe déjà dans ce niveau et cette période.']);
                }
                $unitCodes[$unitKey] = true;
                $itemCodes = [];
                foreach ($unit['items'] as $item) {
                    $course = $courses->get($item['source_course_id']);
                    if (! $course || (int) $course->level_id !== (int) $unit['level_id'] || ($course->catalog_status !== 'active' && ! $previousCourses->has($course->id))) {
                        throw ValidationException::withMessages(['units' => 'Une matière ne correspond pas au niveau de son unité.']);
                    }
                    if (isset($seen[$course->id])) {
                        throw ValidationException::withMessages(['units' => 'Une matière ne peut apparaître deux fois dans une maquette.']);
                    }
                    $code = mb_strtolower(trim((string) (array_key_exists('code', $item) ? $item['code'] : $course->code)));
                    if ($code !== '' && isset($itemCodes[$code])) {
                        throw ValidationException::withMessages(['units' => 'Le code EC existe déjà dans cette UE.']);
                    }
                    $itemCodes[$code] = true;
                    $seen[$course->id] = true;
                }
            }
            foreach ($version->units()->with('items')->get() as $old) {
                foreach ($old->items as $item) {
                    $item->delete();
                }
                $old->delete();
            }
            foreach ($input['units'] as $index => $row) {
                $level = $levels->get($row['level_id']);
                $unit = $version->units()->create(Arr::only($row, ['level_id', 'period_code', 'code', 'name', 'expected_credits', 'credit_rule']) + ['level_code' => $level->code, 'level_title' => $level->title, 'period_name' => $periods->get($row['period_code'])['name'], 'position' => $index + 1]);
                foreach ($row['items'] as $item) {
                    $course = $courses->get($item['source_course_id']);
                    $unit->items()->create(Arr::only($item, ['source_course_id', 'name', 'code', 'description', 'credits', 'coefficient', 'cmi_hours', 'td_hours', 'tp_hours', 'is_optional']) + $this->courseSnapshot($course));
                }
            }
            $version->increment('revision');
            Audit::record($actor->id, 'curriculum_draft_updated', $version, $input['reason'], ['revision' => $version->revision]);

            return $version->fresh('units.items');
        });
    }

    public function levelWorkspace(CurriculumVersion $version, AcademicProgram $program): array
    {
        $version->loadMissing('units.items', 'cohort');
        $unitsByLevel = $version->units->groupBy('level_id');
        $yearId = $version->academic_year_id ?? $version->cohort?->academic_year_id;
        $historical = in_array($version->status, ['published', 'replaced', 'archived'], true);
        $offerings = $historical ? collect() : AcademicOffering::whereNull('curriculum_item_id')->whereNull('archived_at')->where('academic_year_id', $yearId)
            ->whereIn('course_id', $version->units->flatMap(fn ($unit) => $unit->items->pluck('source_course_id'))->all())
            ->when($program->academic_department_id, fn ($query, $department) => $query->where(
                fn ($audience) => $audience->whereNull('academic_department_id')->orWhere('academic_department_id', $department)
            ))
            ->with(['sessions' => fn ($query) => $query->whereNull('cancelled_at')->orderBy('starts_at')->orderBy('id'), 'professor', 'department', 'group.intake'])
            ->orderBy('id')->get()->groupBy('level_id');

        $levels = $historical ? $program->levels->whereIn('id', $unitsByLevel->keys()) : $program->levels;

        return $levels->map(function ($level) use ($version, $offerings, $unitsByLevel, $historical) {
            $units = $unitsByLevel->get($level->id, collect());
            $subjects = $units->flatMap(fn ($unit) => $unit->items)->keyBy('source_course_id');
            $review = $version->level_reviews[$level->id] ?? null;
            $schedule = $historical ? ($review['schedule'] ?? []) : $offerings->get($level->id, collect())
                ->map(fn (AcademicOffering $offering) => [
                    'id' => $offering->id,
                    'course_id' => $offering->course_id,
                    'course' => $subjects->get($offering->course_id)?->name,
                    'audience' => implode(' · ', array_filter([$offering->department?->name ?? 'Tronc commun', $offering->group?->intake?->name])),
                    'teacher' => $offering->professor?->full_name,
                    'sessions' => $offering->sessions->map(fn ($session) => [
                        'id' => $session->id, 'starts_at' => $session->starts_at->toISOString(),
                        'ends_at' => $session->ends_at->toISOString(), 'room' => $session->room,
                    ])->all(),
                ])->all();
            $content = $units->map(fn ($unit) => $unit->only(['period_code', 'code', 'name', 'expected_credits']) + ($unit->credit_rule === 'independent' ? ['credit_rule' => 'independent'] : []) + [
                'items' => $unit->items->map(fn ($item) => $item->only([
                    'source_course_id', 'name', 'code', 'description', 'pedagogical_content', 'credits', 'coefficient', 'cmi_hours', 'td_hours', 'tp_hours',
                ]) + ($item->is_optional ? ['is_optional' => true] : []))->all(),
            ])->all();
            $signature = hash('sha256', json_encode([$content, $schedule], JSON_THROW_ON_ERROR));

            return [
                'id' => $level->id, 'title' => $units->first()?->level_title ?? $level->title,
                'subject_count' => $subjects->count(), 'schedule' => $schedule,
                'signature' => $signature,
                'approved' => $review !== null && ($historical || hash_equals($review['signature'], $signature)),
            ];
        })->values()->all();
    }

    public function approveLevel(int $id, int $levelId, int $revision, string $signature, User $actor): CurriculumVersion
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        $owned = $this->owned($id);
        TeachingScope::authorize($actor, (int) $owned->program->faculty_id);

        return DB::transaction(function () use ($owned, $levelId, $revision, $signature, $actor) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $version = $this->locked($owned);
            $this->checkRevision($version, $revision);
            if ($version->status !== 'draft') {
                throw ValidationException::withMessages(['level' => 'Reprenez le brouillon avant de valider ses niveaux.']);
            }
            $levels = collect($this->levelWorkspace($version, $this->structure->program($version->academic_program_id)));
            $level = $levels->firstWhere('id', $levelId);
            abort_unless($level, 404);
            if (! hash_equals($level['signature'], $signature)) {
                throw ValidationException::withMessages(['level' => 'Le contenu ou l’horaire a changé. Rechargez la maquette avant de valider ce niveau.']);
            }
            $this->validateContent($version->units->where('level_id', $levelId), $version->weighting_mode);
            if (! $level['approved']) {
                $reviews = $version->level_reviews ?? [];
                $reviews[$levelId] = Arr::only($level, ['signature', 'schedule']);
                $version->update(['level_reviews' => $reviews]);
                Audit::record($actor->id, 'curriculum_level_approved', $version, 'Validation du niveau '.$level['title'], ['level_id' => $levelId]);
            }

            return $version;
        });
    }

    private function requireLevelReviews(CurriculumVersion $version): array
    {
        $levels = $this->levelWorkspace($version, $this->structure->program($version->academic_program_id));
        $pending = collect($levels)->where('approved', false)->pluck('title');
        if ($pending->isNotEmpty()) {
            throw ValidationException::withMessages(['levels' => 'Validez chaque niveau avant de poursuivre. À revoir : '.$pending->join(', ').'.']);
        }

        return $levels;
    }

    private function validateContent(Collection $units, string $weightingMode): void
    {
        if ($units->isEmpty()) {
            throw ValidationException::withMessages(['units' => 'Ajoutez au moins une unité avec ses matières.']);
        }
        foreach ($units as $unit) {
            if ($unit->items->isEmpty()) {
                throw ValidationException::withMessages(['units' => 'Chaque unité doit contenir au moins une matière.']);
            }
            if ($unit->credit_rule !== 'independent' && $unit->expected_credits !== null && (int) round($unit->items->sum('credits') * 100) !== (int) round((float) $unit->expected_credits * 100)) {
                throw ValidationException::withMessages(['credits' => 'Le total des crédits ne correspond pas au total attendu de l’unité '.$unit->code.'.']);
            }
            foreach ($unit->items as $item) {
                if (in_array($weightingMode, ['credits', 'both'], true) && $item->credits === null) {
                    throw ValidationException::withMessages(['credits' => 'Les crédits doivent être renseignés pour cette maquette.']);
                }
                if (in_array($weightingMode, ['coefficients', 'both'], true) && $item->coefficient === null) {
                    throw ValidationException::withMessages(['coefficient' => 'Les coefficients doivent être renseignés pour cette maquette.']);
                }
            }
        }
    }

    public function transition(int $id, string $action, int $revision, string $reason, User $actor, ?int $replaceId = null): CurriculumVersion
    {
        Gate::forUser($actor)->authorize('curriculum', AcademicProgram::class);
        if (mb_strlen(trim($reason)) < 5) {
            throw ValidationException::withMessages(['reason' => 'Un motif explicite est requis.']);
        }
        $owned = $this->owned($id);
        TeachingScope::authorize($actor, (int) $owned->program->faculty_id);

        return DB::transaction(function () use ($owned, $action, $revision, $reason, $actor, $replaceId) {
            if (in_array($action, ['validate', 'publish'], true)) {
                AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            }
            $version = $this->locked($owned);
            $this->checkRevision($version, $revision);
            $publication = [];
            if ($action === 'validate' && $version->status === 'draft') {
                $this->validateContent($version->load('units.items')->units, $version->weighting_mode);
                $this->requireLevelReviews($version);
                $version->fill(['status' => 'validated', 'validated_at' => now(), 'validated_by' => $actor->id]);
            } elseif ($action === 'reopen' && $version->status === 'validated') {
                $version->fill(['status' => 'draft', 'validated_at' => null, 'validated_by' => null]);
            } elseif ($action === 'publish' && $version->status === 'validated') {
                $this->validateContent($version->load('units.items')->units, $version->weighting_mode);
                $levels = $this->requireLevelReviews($version);
                $program = $this->structure->program($version->academic_program_id);
                if (! $program->is_active || ! $program->cycle->is_active || ! $program->faculty->is_active || ! $this->structure->current()->is_active) {
                    throw ValidationException::withMessages(['program' => 'Le programme et ses référentiels doivent être actifs.']);
                }
                $key = $version->academic_program_id.($version->admission_cohort_id ? ':cohort:'.$version->admission_cohort_id : ':year:'.$version->academic_year_id);
                $previous = CurriculumVersion::where('publication_key', $key)->lockForUpdate()->first();
                if ($previous) {
                    if ($replaceId !== $previous->id) {
                        throw ValidationException::withMessages(['replace_id' => 'Une version est déjà publiée pour ce contexte. Confirmez explicitement son remplacement.']);
                    }
                    $previous->fill(['status' => 'replaced', 'publication_key' => null, 'revision' => $previous->revision + 1])->save();
                    Audit::record($actor->id, 'curriculum_replaced', $previous, $reason, ['replacement_id' => $version->id]);
                } elseif ($replaceId !== null) {
                    throw ValidationException::withMessages(['replace_id' => 'La version à remplacer n’est plus la version publiée.']);
                }
                $scheduledOfferings = collect($levels)->pluck('schedule')->collapse()->filter(fn ($offering) => $offering['sessions'] !== []);
                $sessionIds = $scheduledOfferings->pluck('sessions')->collapse()->pluck('id')->unique()->all();
                $offeringIds = $scheduledOfferings->pluck('id')->unique()->all();
                $publication = [
                    'offerings_published' => AcademicOffering::whereIntegerInRaw('id', $offeringIds)->where('is_published', false)->update(['is_published' => true]),
                    'sessions_published' => 0,
                ];
                $lifecycle = app(\App\Modules\Teaching\Application\Services\SessionLifecycle::class);
                AcademicSession::whereIntegerInRaw('id', $sessionIds)->whereNull('cancelled_at')->where('is_published', false)
                    ->eachById(function ($session) use ($lifecycle, $actor, $reason, &$publication) {
                        $lifecycle->apply($session, $actor, ['action' => 'publish', 'reason' => $reason], false);
                        $publication['sessions_published']++;
                    });
                $version->fill(['status' => 'published', 'publication_key' => $key, 'published_at' => now(), 'published_by' => $actor->id]);
            } elseif ($action === 'archive' && in_array($version->status, ['draft', 'validated', 'published', 'replaced'], true)) {
                $version->fill(['status' => 'archived', 'publication_key' => null]);
            } else {
                throw ValidationException::withMessages(['version' => 'Cette transition n’est pas autorisée.']);
            }
            $version->revision++;
            $version->save();
            Audit::record($actor->id, 'curriculum_'.$action, $version, $reason, ['revision' => $version->revision] + $publication);

            return $version;
        });
    }

    public function bind(int $versionId, int $enrollmentId, User $actor, string $reason): AcademicEnrollment
    {
        Gate::forUser($actor)->authorize('manage', AcademicProgram::class);
        if (mb_strlen(trim($reason)) < 5) {
            throw ValidationException::withMessages(['reason' => 'Le rattachement exige un motif.']);
        }
        $owned = $this->owned($versionId);
        TeachingScope::authorize($actor, (int) $owned->program->faculty_id, 'manage academic access');

        return DB::transaction(function () use ($owned, $enrollmentId, $actor, $reason) {
            $version = $this->locked($owned);
            $entry = AcademicEnrollment::lockForUpdate()->findOrFail($enrollmentId);
            Gate::forUser($actor)->authorize('manage', $entry);
            if ($entry->curriculum_version_id !== null) {
                if ((int) $entry->curriculum_version_id === $version->id) {
                    return $entry;
                }
                throw ValidationException::withMessages(['enrollment' => 'Une maquette est déjà rattachée. Une transition de cursus nécessite une décision distincte.']);
            }
            if ($version->published_at === null || ! in_array($version->status, ['published', 'replaced', 'archived'], true) || ! $version->units()->where('level_id', $entry->level_id)->exists()) {
                throw ValidationException::withMessages(['version' => 'La version doit avoir été publiée et contenir le niveau de cette inscription.']);
            }
            $programId = $entry->promotion?->academic_program_id ?? $entry->admissionCohort?->academic_program_id;
            if ($programId !== null && (int) $programId !== (int) $version->academic_program_id) {
                throw ValidationException::withMessages(['enrollment' => 'La maquette doit correspondre au programme de cette inscription.']);
            }
            $promotion = $entry->class_id ? Classes::lockForUpdate()->findOrFail($entry->class_id)->promotion : null;
            if ($promotion && ((int) $promotion->academic_program_id !== (int) $version->academic_program_id || (int) $promotion->academic_year_id !== (int) $entry->academic_year_id)) {
                throw ValidationException::withMessages(['enrollment' => 'Le groupe est associé à une promotion incompatible avec cette maquette.']);
            }
            if ($version->academic_year_id !== null && (int) $version->academic_year_id !== (int) $entry->academic_year_id) {
                throw ValidationException::withMessages(['academic_year_id' => 'L’année de la maquette ne correspond pas à cette inscription.']);
            }
            if ($version->admission_cohort_id !== null) {
                $cohort = $version->cohort;
                if (($entry->admission_cohort_id !== null && (int) $entry->admission_cohort_id !== $cohort->id) || $entry->academicYear->start_date < $cohort->academicYear->start_date) {
                    throw ValidationException::withMessages(['cohort' => 'Cette cohorte n’est pas compatible avec le dossier.']);
                }
                $entry->admission_cohort_id = $cohort->id;
            }
            $entry->curriculum_version_id = $version->id;
            $entry->save();
            Audit::record($actor->id, 'curriculum_bound', $entry, $reason, ['curriculum_version_id' => $version->id]);

            return $entry;
        });
    }

    public function resolveNew(AcademicEnrollment $entry, User $actor, ?int $programId = null): void
    {
        if (! Gate::forUser($actor)->allows('manage', AcademicProgram::class) || ! University::where('context_key', 'current')->exists() || $entry->curriculum_version_id !== null) {
            return;
        }
        $choice = $programId ?? $entry->application?->form_snapshot['academic_program_id'] ?? null;
        $candidates = CurriculumVersion::where('status', 'published')->when($choice, fn ($q) => $q->where('academic_program_id', (int) $choice))->where('academic_year_id', $entry->academic_year_id)
            ->whereHas('program', fn ($q) => $q->where('is_active', true)->whereHas('cycle', fn ($q) => $q->where('is_active', true))->whereHas('faculty', fn ($q) => $q->where('university_id', $this->structure->current()->id)))
            ->whereHas('units', fn ($q) => $q->where('level_id', $entry->level_id))->limit(2)->get();
        if (! $this->structure->current()->is_active) {
            return;
        }
        if ($candidates->count() !== 1) {
            return;
        }

        DB::transaction(function () use ($candidates, $entry, $actor) {
            $version = $this->locked($candidates->first());
            // Historical versions remain available for explicit assignments only.
            if ($version->status === 'published') {
                $this->bind($version->id, $entry->id, $actor, 'Version annuelle déterminée sans ambiguïté lors de l’activation.');
            }
        });
    }

    public function compare(int $left, int $right): array
    {
        $a = $this->owned($left);
        $b = $this->owned($right);
        abort_unless($a->academic_program_id === $b->academic_program_id, 422);
        $map = fn ($version) => $version->load('units.items')->units->flatMap(fn ($unit) => $unit->items->map(fn ($item) => ['key' => $unit->level_id.':'.$unit->period_code.':'.$unit->code.':'.$item->source_course_id, 'unit' => $unit->name, 'period' => $unit->period_name, 'credit_rule' => $unit->credit_rule, 'unit_expected_credits' => $unit->expected_credits, 'level_code' => $unit->level_code, 'level_title' => $unit->level_title] + $item->only(['source_course_id', 'code', 'name', 'description', 'credits', 'coefficient', 'cmi_hours', 'td_hours', 'tp_hours', 'is_optional'])))->keyBy('key');
        $before = $map($a);
        $after = $map($b);

        return $before->keys()->merge($after->keys())->unique()->map(fn ($key) => ['key' => $key, 'before' => $before->get($key), 'after' => $after->get($key)])->filter(fn ($row) => $row['before'] !== $row['after'])->values()->all();
    }
}
