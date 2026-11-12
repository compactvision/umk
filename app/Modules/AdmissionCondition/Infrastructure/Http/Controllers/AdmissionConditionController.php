<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AdmissionCondition;
use App\Models\Level;
use App\Modules\AdmissionCondition\Application\UseCases\CopyPreviousLevelConditions;
use App\Modules\AdmissionCondition\Application\UseCases\CreateAdmissionCondition;
use App\Modules\AdmissionCondition\Application\UseCases\UpdateAdmissionCondition;
use App\Modules\AdmissionCondition\Application\UseCases\DeleteAdmissionCondition;
use App\Modules\AdmissionCondition\Application\UseCases\ListAdmissionCondition;
use App\Modules\AdmissionCondition\Infrastructure\Http\Requests\CreateAdmissionConditionRequest;
use App\Modules\AdmissionCondition\Infrastructure\Http\Requests\UpdateAdmissionConditionRequest;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class AdmissionConditionController extends Controller
{
    /**
     * Liste toutes les conditions pour un level + une faculté
     */
    public function index(
        int $facultyId,
        int $levelId,
        ListAdmissionCondition $useCase
    ) {
        $conditions = $useCase->execute($facultyId, $levelId);

        // On mappe en array pour Inertia (évite problème Entity non JSON serializable)
        $conditionsArray = array_map(fn ($c) => [
            'id'          => $c->getId(),
            'faculty_id'  => $c->getFacultyId(),
            'level_id'    => $c->getLevelId(),
            'title'       => $c->getTitle(),
            'description' => $c->getDescription(),
            'section'     => $c->getSection(),
            'is_required' => $c->isRequired(),
        ], $conditions);

        return Inertia::render('AdmissionConditions/Index', [
            'conditions' => $conditionsArray,
            'faculty_id' => $facultyId,
            'level_id'   => $levelId,
        ]);
    }

    /**
     * Crée une condition
     */
    public function store(
        CreateAdmissionConditionRequest $request,
        CreateAdmissionCondition $useCase
    ) {
        $useCase->execute(
            $request->input('faculty_id'),
            $request->input('level_id'),
            $request->input('title'),
            $request->input('description'),
            $request->input('section'),
            $request->boolean('is_required')
        );

        return $this->conditionsTab($request->integer('level_id'))->with('success', 'Condition ajoutée avec succès.');
    }

    /**
     * Met à jour une condition
     */
    public function update(
        int $id,
        UpdateAdmissionConditionRequest $request,
        UpdateAdmissionCondition $useCase
    ) {
        $useCase->execute(
            $id,
            $request->input('faculty_id'),
            $request->input('level_id'),
            $request->input('title'),
            $request->input('description'),
            $request->input('section'),
            $request->boolean('is_required')
        );

        return $this->conditionsTab($request->integer('level_id'))->with('success', 'Condition mise à jour avec succès.');
    }

    /**
     * Supprime une condition
     */
    public function destroy(
        int $id,
        DeleteAdmissionCondition $useCase
    ) {
        $levelId = AdmissionCondition::findOrFail($id)->level_id;
        $useCase->execute($id);

        return ($levelId ? $this->conditionsTab($levelId) : back())->with('success', 'Condition supprimée avec succès.');
    }

    public function copyPrevious(Level $level, CopyPreviousLevelConditions $useCase): RedirectResponse
    {
        $added = $useCase->execute($level);

        return $this->conditionsTab($level->id)->with('success', match ($added) {
            0 => 'Aucune nouvelle condition à reprendre.',
            1 => 'Une condition reprise du niveau précédent.',
            default => "$added conditions reprises du niveau précédent.",
        });
    }

    private function conditionsTab(int $levelId): RedirectResponse
    {
        return to_route('dashboard.admin.levels.details.show', ['id' => $levelId, 'tab' => 'conditions'], 303);
    }
}
