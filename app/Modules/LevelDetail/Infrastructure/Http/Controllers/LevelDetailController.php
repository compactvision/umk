<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Modules\LevelDetail\Application\UseCases\CreateLevelDetail;
use App\Modules\LevelDetail\Application\UseCases\UpdateLevelDetail;
use App\Modules\LevelDetail\Application\UseCases\GetLevelDetailByLevel;

final class LevelDetailController extends Controller
{

    public function show(int $levelId, GetLevelDetailByLevel $getLevelDetailByLevel)
    {
        $levelDetail = $getLevelDetailByLevel->execute($levelId);

        return Inertia::render('dashboard/levels/Show', [
            'levelDetail' => [
                'id' => $levelDetail->id(),
                'price' => $levelDetail->price(),
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
                'faculty_name' => $levelDetail->facultyName(),
                'faculty_code' => $levelDetail->facultyCode(),
            ],
        ]);
    }

    public function store(Request $request, CreateLevelDetail $createDetail)
    {
        $validated = $request->validate([
            'level_id'        => ['required', 'exists:levels,id'],
            'price'           => ['nullable', 'numeric'],
            'has_certificate' => ['required', 'boolean'],
            'language'        => ['nullable', 'string', 'max:50'],
            'duration_years'  => ['required', 'integer'],
            'student_number'  => ['nullable', 'integer'],
            'credit_required' => ['nullable', 'integer'],
            'courses_number'  => ['nullable', 'integer'],
            'illustration_image' => ['nullable', 'string'],
            'course_objective'=> ['nullable', 'string'],
            'fees'            => ['nullable', 'integer'],
            'options'         => ['nullable', 'array'],
        ]);

        $createDetail->execute(
            $validated['level_id'],
            $validated['price'] ?? null,
            $validated['has_certificate'],
            $validated['language'] ?? null,
            $validated['duration_years'],
            $validated['student_number'] ?? null,
            $validated['credit_required'] ?? null,
            $validated['courses_number'] ?? null,
            $validated['illustration_image'] ?? null,
            $validated['course_objective'] ?? null,
            $validated['fees'] ?? null,
            $validated['options'] ?? null
        );

        return back()->with('success', 'Détails du niveau créés avec succès.');
    }

    public function update(Request $request, int $id, UpdateLevelDetail $updateDetail)
    {
        $validated = $request->validate([
            'level_id'        => ['required', 'exists:levels,id'],
            'price'           => ['nullable', 'numeric'],
            'has_certificate' => ['required', 'boolean'],
            'language'        => ['nullable', 'string', 'max:50'],
            'duration_years'  => ['required', 'integer'],
            'student_number'  => ['nullable', 'integer'],
            'credit_required' => ['nullable', 'integer'],
            'courses_number'  => ['nullable', 'integer'],
            'illustration_image' => ['nullable', 'string'],
            'course_objective'=> ['nullable', 'string'],
            'fees'            => ['nullable', 'integer'],
            'options'         => ['nullable', 'array'],
        ]);

        $updateDetail->execute(
            $id,
            $validated['level_id'],
            $validated['price'] ?? null,
            $validated['has_certificate'],
            $validated['language'] ?? null,
            $validated['duration_years'],
            $validated['student_number'] ?? null,
            $validated['credit_required'] ?? null,
            $validated['courses_number'] ?? null,
            $validated['illustration_image'] ?? null,
            $validated['course_objective'] ?? null,
            $validated['fees'] ?? null,
            $validated['options'] ?? null
        );

        return back()->with('success', 'Détails du niveau mis à jour avec succès.');
    }

}
