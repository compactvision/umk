<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AdmissionCondition\Application\DTOs\AdmissionConditionDTO;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Modules\LevelDetail\Application\UseCases\CreateLevelDetail;
use App\Modules\LevelDetail\Application\UseCases\UpdateLevelDetail;
use App\Modules\LevelDetail\Application\UseCases\GetLevelDetailByLevel;
use App\Modules\LevelDetail\Infrastructure\Http\Requests\UpdateLevelDetailsRequest;
use App\Modules\LevelDetail\Infrastructure\Http\Requests\SaveCourseRequest;
use App\Modules\LevelDetail\Infrastructure\Http\Requests\CreateLevelDetailsRequest;
use App\Modules\AdmissionCondition\Application\UseCases\ListAdmissionCondition;
use App\Modules\AdmissionCondition\Application\UseCases\CopyPreviousLevelConditions;

final class LevelDetailController extends Controller
{

    public function show(int $levelId, GetLevelDetailByLevel $getLevelDetailByLevel, ListAdmissionCondition $listAdmissionCondition)
    {
        $level = \App\Models\Level::with('faculty')->findOrFail($levelId);
        $levelDetail = $getLevelDetailByLevel->execute($levelId);
        $admissionConditions = $listAdmissionCondition->execute($levelDetail->facultyId(), $levelDetail->levelId());
        $conditionsArray = array_map(fn ($c) => AdmissionConditionDTO::fromEntity($c), $admissionConditions);

        return Inertia::render('dashboard/levels/Show', [
            'levelDetail' => [
                'id' => $levelDetail->id(),
                'level_id' => $levelDetail->levelId(),
                'price' => $levelDetail->price(),
                'price_foreign' => $levelDetail->priceForeign(),
                ...$levelDetail->installments(),
                'has_certificate' => $levelDetail->hasCertificate(),
                'language' => $levelDetail->language(),
                'duration_years' => $levelDetail->durationYears(),
                'student_number' => $levelDetail->studentNumber(),
                'credit_required' => $levelDetail->creditRequired(),
                'courses_number' => $levelDetail->coursesNumber(),
                'illustration_image' => $levelDetail->illustrationImage(),
                'course_objective' => $levelDetail->courseObjective(),
                'fees' => $levelDetail->fees(),
                'options' => $levelDetail->options(),

                // Relations
                'level_title' => $levelDetail->levelTitle(),
                'level_code' => $levelDetail->levelCode(),
                'level_description' => $levelDetail->levelDescription(),
                'faculty_name' => $levelDetail->facultyName(),
                'faculty_code' => $levelDetail->facultyCode(),
                'faculty_id' => $levelDetail->facultyId(),
            ],
            'courses' => \App\Models\Courses::where('level_id', $levelId)->orderBy('title')->get(['id', 'title', 'code', 'credits', 'description', 'semester', 'cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content', 'catalog_status']),
            'departmentOptions' => $level->departmentOptions()->where('is_active', true)->orderBy('name')->get(['academic_departments.id', 'name'])->makeHidden('pivot'),
            'teachingAssignments' => \App\Models\Student\AcademicOffering::where('level_id', $levelId)->with(['professor:id,first_name,last_name,is_active', 'academicYear:id,title', 'group.intake', 'assistant:id,first_name,last_name,is_active', 'course:id,title,code,semester', 'department:id,name'])->orderByDesc('academic_year_id')->get(),
            'professors' => \App\Models\Professor::where('is_active', true)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'is_active']),
            'academicYears' => \App\Models\AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'initialTab' => match (request()->query('tab')) {
                'conditions' => 'conditions',
                'prof' => 'prof',
                'cours' => 'cours',
                default => 'infos',
            },
            'canManageAdmissionCampaigns' => request()->user()->can('manage academic access'),
            'canManageCourses' => request()->user()->can('publish academic content')
                && \App\Modules\Teaching\Application\Services\TeachingScope::allows(request()->user(), (int) $level->faculty_id),
            'admissionConditions' => $conditionsArray,
            'previousConditionLevel' => app(CopyPreviousLevelConditions::class)->source($level)?->only(['code']),
            'level' => array_merge($level->only(['id', 'faculty_id', 'title', 'code', 'tag', 'description', 'image']), ['is_active' => (bool) $level->is_active]),
            'faculties' => ['data' => $level->faculty ? [$level->faculty->only(['id', 'name'])] : []],
        ]);
    }

    public function storeCourse(Request $request, int $id)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $level = \App\Models\Level::findOrFail($id);
        \App\Modules\Teaching\Application\Services\TeachingScope::authorize($request->user(), (int) \App\Models\Level::findOrFail($id)->faculty_id);
        $data = $request->validate(SaveCourseRequest::courseRules());
        $course = app(\App\Modules\LevelDetail\Application\Services\CourseCatalog::class)->save($level->id, $data);
        \App\Modules\Student\Application\Services\Audit::record($request->user()->id, 'course_created', $course);

        return back()->with('success', 'Cours ajouté au programme du niveau.');
    }

    public function updateCourse(Request $request, int $id, int $courseId)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $course = \App\Models\Courses::where('level_id', $id)->findOrFail($courseId);
        \App\Modules\Teaching\Application\Services\TeachingScope::authorize($request->user(), (int) \App\Models\Level::findOrFail($id)->faculty_id);
        $data = $request->validate(SaveCourseRequest::courseRules());
        $course = app(\App\Modules\LevelDetail\Application\Services\CourseCatalog::class)->save($id, $data, $courseId);
        \App\Modules\Student\Application\Services\Audit::record($request->user()->id, 'course_updated', $course);

        return back()->with('success', 'Cours mis à jour.');
    }

    public function store(CreateLevelDetailsRequest $request, CreateLevelDetail $createDetail)
    {
        $validated = $request->validated();

        $createDetail->execute(
            $validated['level_id'],
            $validated['price'] ?? null,
            $validated['has_certificate'] ?? true,
            $validated['language'] ?? null,
            $validated['duration_years'] ?? null,
            $validated['student_number'] ?? null,
            $validated['credit_required'] ?? null,
            $validated['courses_number'] ?? null,
            $validated['illustration_image'] ?? null,
            $validated['course_objective'] ?? null,
            $validated['fees'] ?? null,
            $validated['options'] ?? null,
            $validated['price_foreign'] ?? null,
            array_intersect_key($validated, array_flip(['price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second']))
        );

        return back()->with('success', 'Détails du niveau créés avec succès.');
    }

    public function update(UpdateLevelDetailsRequest $request, int $id, UpdateLevelDetail $updateDetail)
    {
        $validated = $request->validated();
        
        $updateDetail->execute(
            $id,
            $validated['level_id'],
            $validated['price'] ?? null,
            $validated['has_certificate'] ?? true,
            $validated['language'] ?? null,
            $validated['duration_years'] ?? null,
            $validated['student_number'] ?? null,
            $validated['credit_required'] ?? null,
            $validated['courses_number'] ?? null,
            $request->file('illustration_image') ?? null,
            $validated['course_objective'] ?? null,
            $validated['fees'] ?? null,
            $validated['options'] ?? null,
            $validated['price_foreign'] ?? null,
            array_key_exists('price_foreign', $validated),
            array_intersect_key($validated, array_flip(['price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second']))
        );

        return back()->with('success', 'Détails du niveau mis à jour avec succès.');
    }

}
