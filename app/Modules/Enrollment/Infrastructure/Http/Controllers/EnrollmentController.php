<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;


use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Modules\Enrollment\Application\DTO\CreateEnrollmentDTO;
use App\Modules\Enrollment\Application\DTO\DecisionDTO;
use App\Modules\Enrollment\Application\DTO\ListStudentEnrollmentsQuery;
use App\Modules\Enrollment\Application\UseCases\{CreateEnrollment, SubmitEnrollment, ReviewEnrollment, DecideEnrollment, GetRequirementsFor, ListActiveFaculties, ListActiveYears, ListLevelsByFaculty, ListStudentEnrollments};
use App\Modules\Enrollment\Infrastructure\Http\Requests\{StoreEnrollmentRequest, DecisionRequest};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    public function __construct(
        private CreateEnrollment $create,
        private SubmitEnrollment $submit,
        private ReviewEnrollment $review,
        private DecideEnrollment $decide,
    ) {}

    public function index(Request $request, ListStudentEnrollments $useCase)
    {
        $query = new ListStudentEnrollmentsQuery(
            studentId:  $request->user()->id,
            statuses:   $request->filled('statuses') ? explode(',', $request->string('statuses')) : null,
            levelId:    $request->integer('level_id') ?: null,
            from:       $request->date('from'),
            to:         $request->date('to'),
            search:     $request->string('search')->toString() ?: null,
            dateField:  $request->string('date_field', 'created_at'),
            orderBy:    $request->string('order_by', 'created_at'),
            orderDir:   $request->string('order_dir', 'desc'),
            perPage:    (int) $request->integer('per_page', 15),
            page:       (int) $request->integer('page', 1),
        );

        $enrollments = $useCase->handle($query);

        return Inertia::render('dashboard/enrollments/Index', [
            'enrollments' => $enrollments,
            'filters'     => $request->only([
                'statuses','level_id','from','to','search','date_field','order_by','order_dir'
            ]),
        ]);
    }

    public function bootstrap(
        ListActiveFaculties $facultiesUC,
        ListLevelsByFaculty $levelsUC,
        ListActiveYears $yearsUC
    ) {
        $faculties = ($facultiesUC)();
        $levels = ($levelsUC)();
        $years = ($yearsUC)();

        // Regroupe les niveaux par faculté pour faciliter le front
        $levelsByFaculty = $levels->groupBy('faculty_id')->map->values();

        return Inertia::render('dashboard/enrollments/Enrollment', [
            'faculties' => $faculties,
            'levelsByFaculty' => $levelsByFaculty,
            'years' => $years, // seulement actives
        ]);
    }

    public function requirements(Request $request, GetRequirementsFor $uc)
    {
        $data = $request->validate([
            'faculty_id' => ['nullable','integer','exists:faculties,id'],
            'level_id'   => ['required','integer','exists:levels,id'],
            'year_id'    => ['required','integer','exists:academic_years,id'],
        ]);

        // Vérif année active → message clair (bloque la suite côté front)
        $active = AcademicYear::where('id', $data['year_id'])->where('status', 'open')->exists();
        if (!$active) {
            return response()->json([
                'ok' => false,
                'message' => 'Cette année académique n’est pas active.',
            ], 422);
        }

        $payload = $uc($data['level_id'], $data['year_id'], $data['faculty_id'] ?? null);

        return response()->json([
            'ok' => true,
            'payload' => $payload,
        ]);
    }

    public function show(Request $request, Enrollment $enrollment)
    {
        // $this->authorize('view', $enrollment);

        $enrollment->load(['documents' => function ($q) {
            $q->orderBy('created_at');
        }]);

        $docs = $enrollment->documents->map(function ($d) {
            return [
                'key'      => $d->key,
                'filename' => $d->filename,
                'uuid'     => $d->uuid,
                'mime'     => $d->mime,
                'size'     => (int)$d->size_bytes,
                'url'      => route('dashboard.enrollment.docs.stream', ['uuid' => $d->uuid]), // stream privé
            ];
        })->values();

        // On préremplit depuis snapshot/meta
        $snap = $enrollment->form_snapshot ?? $enrollment->meta ?? [];

        return Inertia::render('dashboard/enrollments/Enrollment', [
            'mode'              => 'view',
            'startFromDraft'    => false, // n’essaye pas de reprendre le draft en “view”
            'enrollment'        => [
                'id'                => $enrollment->id,
                'uuid'              => $enrollment->uuid,
                'status'            => $enrollment->status,
                'level_id'          => $enrollment->level_id,
                'academic_year_id'  => $enrollment->academic_year_id,
                'form_snapshot'     => $enrollment->form_snapshot,
                'meta'              => $enrollment->meta,
                'last_step'         => $enrollment->last_step,
                'documents'         => $docs,
            ],
            // réinjecte aussi tes props de bootstrap si besoin (faculties, levelsByFaculty, years)
        ]);
    }

    // public function create()
    // {
    //     return Inertia::render('dashboard/enrollments/Enrollment');
    // }


    public function store(StoreEnrollmentRequest $request)
    {
        $v = $request->validated();

        // 1) brouillon courant
        $enrollment = Enrollment::firstOrCreate(
            ['student_id'=>Auth::user()->id, 'status'=>'draft'],
            ['uuid'=>Str::uuid()->toString()]
        );

        // 2) hydrater données structurées
        $enrollment->level_id          = (int)$v['level_id'];
        $enrollment->academic_year_id  = (int)$v['year_id'];
        $enrollment->meta = array_merge($enrollment->meta ?? [], [
            'name'    => $v['name']   ?? null,
            'email'   => $v['email']  ?? null,
            'program' => $v['program']?? null,
            // jamais CB/CVV ici
        ]);
        $enrollment->save();

        // 3) basculer fichiers draft → définitifs
        $enrollment->documents()->where('is_temp', true)->update(['is_temp'=>false]);

        // 4) statut (à adapter si tu branches un PSP)
        $enrollment->status = 'submitted';
        $enrollment->save();

        return redirect()->route('dashboard.enrollments.index')->with('success', 'Inscription enregistrée');
    }


    public function submit(int $enrollment)
    {
        $this->submit->handle($enrollment);
        return back()->with('success', 'Submitted');
    }


    public function review(int $enrollment)
    {
        // $this->authorize('review', $enrollment);
        $this->review->handle($enrollment);
        return back();
    }


    public function decision(DecisionRequest $request, int $enrollment)
    {
        $dto = new DecisionDTO(
            enrollmentId: $enrollment,
            decision: $request->string('decision'),
            notes: $request->string('notes')->toString() ?: null,
            requirements: $request->input('requirements'),
            actorId: $request->user()->id,
        );
        $this->decide->handle($dto);
        return back()->with('success', 'Decision saved');
    }
}
