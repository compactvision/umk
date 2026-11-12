<?php

namespace App\Modules\Progression\Application;

use App\Models\AcademicStructure\CurriculumItem;
use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicProgression;
use App\Models\Student\AcademicRetakeAssignment;
use App\Models\User;
use App\Modules\Results\Application\ResultRules;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\CourseRegistrationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class RetakeAssignments
{
    public function __construct(private CourseRegistrationService $registrations) {}

    public function assign(AcademicProgression $decision, AcademicOffering $offering, User $actor, int $sourceItemId, string $reason): void
    {
        Gate::forUser($actor)->authorize('manage', $decision->source);

        DB::transaction(function () use ($decision, $offering, $actor, $sourceItemId, $reason) {
            AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            $decision = AcademicProgression::lockForUpdate()->findOrFail($decision->id);
            $target = $decision->target;
            ResultRules::check($target && collect($decision->decision_snapshot['retakes'] ?? [])->contains('item_id', $sourceItemId),
                'item_id', 'Cette matière ne relève pas du plan de reprise rattaché à la réinscription.');
            Gate::forUser($actor)->authorize('manage', $target);
            $prior = AcademicRetakeAssignment::where('academic_progression_id', $decision->id)->where('source_item_id', $sourceItemId)
                ->whereHas('registration', fn ($q) => $q->whereNull('withdrawn_at'))->with('registration')->first();
            if ($prior?->registration->academic_offering_id === $offering->id) {
                return;
            }
            $due = $decision->decision_snapshot['due_on'] ?? null;
            ResultRules::check(! $prior && (! $due || $due >= today('Africa/Kinshasa')->toDateString()),
                'item_id', 'Une reprise active existe déjà ou son échéance est dépassée.');
            $source = CurriculumItem::findOrFail($sourceItemId);
            $item = $offering->curriculumItem;
            ResultRules::check($item && $item->source_course_id === $source->source_course_id
                && $item->curriculum_version_id === $target->curriculum_version_id
                && $offering->academic_year_id === $target->academic_year_id,
                'offering_id', 'Sélectionnez une offre compatible de l’année et de la maquette cibles. Une correspondance de nom est insuffisante.');
            ResultRules::check(! $target->courseRegistrations()->whereNull('withdrawn_at')
                ->whereHas('offering', fn ($q) => $q->where('curriculum_item_id', $item->id)->whereKeyNot($offering->id))->exists(),
                'offering_id', 'L’étudiant est déjà inscrit à une offre de cet EC.');

            $active = $offering->registrations()->where('academic_enrollment_id', $target->id)->whereNull('withdrawn_at')->first();
            $registration = $this->registrations->register($offering, $target, $actor, $active?->mode ?? 'repeat', $reason, plannedRetake: true);
            $assignment = AcademicRetakeAssignment::create([
                'academic_progression_id' => $decision->id, 'source_item_id' => $sourceItemId, 'course_registration_id' => $registration->id,
            ]);
            Audit::record($actor->id, 'academic_retake_assigned', $assignment, $reason, ['offering_id' => $offering->id]);
        }, 3);
    }
}
