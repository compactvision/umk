<?php

namespace App\Modules\Assessment\Application;

use App\Models\AcademicYear;
use App\Models\Student\AcademicAssessment;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\ContentSection;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\CourseAudience;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Support\Facades\DB;

final class AssessmentWorkflow
{
    public function __construct(private AssessmentAccess $access, private CourseAudience $audience) {}

    public function draft(AcademicOffering $offer, User $actor, array $input, ?AcademicResource $resource = null): AcademicResource
    {
        return DB::transaction(function () use ($offer, $actor, $input, $resource) {
            $offer = AcademicOffering::lockForUpdate()->findOrFail($offer->id);
            $this->access->write($actor, $offer);
            $resource = $resource ? $offer->resources()->lockForUpdate()->findOrFail($resource->id) : $offer->resources()->make([
                'kind' => $input['modality'] === 'in_person' || $input['category'] === 'exam' ? 'evaluation' : 'assignment',
                'author_id' => $actor->id, 'is_published' => false,
            ]);
            $assessment = $resource->exists ? $resource->assessment()->lockForUpdate()->firstOrFail() : null;
            if ($assessment) {
                AssessmentRules::require($assessment->state === 'draft' && ! $assessment->records()->exists(), 'state', 'Le contexte est figé dès la publication ou la constitution d’un groupe.');
                AssessmentRules::revision($assessment->revision, $input['revision']);
            }
            $session = isset($input['academic_session_id']) ? $offer->sessions()->find($input['academic_session_id']) : null;
            AssessmentRules::require(! isset($input['academic_session_id']) || ($session && ! $session->cancelled_at), 'academic_session_id', 'Choisissez une séance de cette offre.');
            if ($input['modality'] === 'in_person') {
                AssessmentRules::require($session !== null && ! $input['group_work'], 'academic_session_id', 'Une épreuve en présentiel nécessite une séance et des participants individuels.');
            }
            if (isset($input['academic_content_section_id'])) {
                AssessmentRules::require(ContentSection::where('academic_offering_id', $offer->id)->whereKey($input['academic_content_section_id'])->exists(),
                    'academic_content_section_id', 'Choisissez une section de cette offre.');
            }
            $opens = $this->date($input['opens_at'] ?? null);
            $closes = $this->date($input['closes_at'] ?? null);
            if ($input['modality'] === 'submission') {
                AssessmentRules::require($opens !== null && $closes !== null && $opens->lt($closes), 'closes_at', 'Indiquez une ouverture et une échéance postérieure.');
            } else {
                $opens = $session->starts_at;
                $closes = $session->ends_at;
            }
            $endWithGrace = $closes->copy()->addMinutes($input['modality'] === 'submission' ? $input['late_minutes'] : 0);
            $this->assertPeriod($offer, $opens, $endWithGrace);

            $max = AssessmentRules::points($input['maximum_points'] ?? null, 'maximum_points');
            $weight = AssessmentRules::points($input['weight'] ?? null, 'weight');
            AssessmentRules::require($max !== 0, 'maximum_points', 'Le barème doit être strictement positif.');
            AssessmentRules::require($weight === null || $weight <= 10000, 'weight', 'La pondération est un pourcentage de 0 à 100.');
            $rubric = [];
            foreach ($input['rubric'] ?? [] as $criterion) {
                $points = AssessmentRules::points($criterion['maximum'], 'rubric');
                AssessmentRules::require($points > 0 && ! in_array($criterion['label'], array_column($rubric, 'label'), true), 'rubric', 'Chaque critère doit avoir un libellé unique et un maximum positif.');
                $rubric[] = ['label' => $criterion['label'], 'maximum' => $points];
            }
            AssessmentRules::require($rubric === [] || array_sum(array_column($rubric, 'maximum')) === $max, 'rubric', 'La somme des critères doit correspondre au barème.');
            $resource->fill([
                'title' => $input['title'], 'body' => $input['body'] ?? null, 'opens_at' => $opens, 'closes_at' => $closes,
                'academic_session_id' => $session?->id, 'academic_content_section_id' => $input['academic_content_section_id'] ?? null,
            ])->save();
            $values = [
                'category' => $input['category'], 'session_code' => $input['session_code'], 'modality' => $input['modality'],
                'maximum_points' => $max, 'weight' => $weight === null ? null : sprintf('%d.%02d', intdiv($weight, 100), $weight % 100), 'rubric' => $rubric,
                'objectives' => $input['objectives'] ?? null, 'attempt_limit' => $input['modality'] === 'in_person' ? 1 : $input['attempt_limit'],
                'late_minutes' => $input['modality'] === 'in_person' ? 0 : $input['late_minutes'],
                'accepts_until' => $input['modality'] === 'submission' ? $endWithGrace : null,
                'group_work' => $input['group_work'], 'feedback_policy' => $input['feedback_policy'],
            ];
            $old = $assessment?->only(['maximum_points', 'weight', 'rubric']);
            if ($assessment) {
                $assessment->update($values + ['revision' => $assessment->revision + 1]);
            } else {
                $assessment = $resource->assessment()->create($values);
            }
            Audit::record($actor->id, $old ? 'assessment_draft_updated' : 'assessment_created', $assessment, $input['reason'] ?? null, [
                'previous_grading' => $old, 'grading' => array_intersect_key($values, array_flip(['maximum_points', 'weight', 'rubric'])),
            ]);

            return $resource;
        });
    }

    public function lifecycle(AcademicResource $resource, User $actor, array $input): void
    {
        $this->locked($resource, $actor, function (AcademicAssessment $assessment, AcademicResource $resource) use ($actor, $input) {
            $action = $input['action'];
            $next = ['publish' => 'published', 'close' => 'closed', 'cancel' => 'cancelled'][$action];
            if ($assessment->state === $next) {
                return;
            }
            AssessmentRules::revision($assessment->revision, $input['revision']);
            $session = $resource->session()->sharedLock()->first();
            $resource->setRelation('session', $session);
            if ($action === 'publish') {
                AssessmentRules::require($assessment->state === 'draft' && $resource->offering->is_published
                    && $resource->offering->academicYear->status === 'open', 'state', 'Publiez une évaluation en brouillon dans une offre ouverte et publiée.');
                if ($assessment->modality === 'in_person') {
                    AssessmentRules::require($session && $session->is_published && ! $session->cancelled_at && $session->starts_at->isFuture(),
                        'academic_session_id', 'Publiez et validez d’abord le créneau à venir dans la planification.');
                    $this->assertPeriod($resource->offering, $session->starts_at, $session->ends_at);
                    $resource->fill(['opens_at' => $session->starts_at, 'closes_at' => $session->ends_at]);
                }
                AssessmentRules::require($resource->closes_at->isFuture(), 'closes_at', 'L’échéance doit être à venir.');
                $resource->fill(['is_published' => true, 'published_at' => now()])->save();
                if ($input['notify'] ?? false) {
                    $this->notifyAudience($assessment, $resource, 'published');
                }
            } elseif ($action === 'close') {
                AssessmentRules::require($assessment->state === 'published', 'state', 'Publiez l’évaluation avant de la clôturer.');
                if ($assessment->modality === 'in_person') {
                    AssessmentRules::require($session && ! $session->cancelled_at && $session->ends_at->isPast(), 'academic_session_id', 'La séance doit être terminée et maintenue.');
                } else {
                    AssessmentRules::require(now()->gte($assessment->accepts_until), 'closes_at', 'La fenêtre de remise est encore ouverte.');
                }
                $this->freezeParticipants($assessment, $resource);
                $assessment->closed_at = now();
            } else {
                AssessmentRules::require(in_array($assessment->state, ['draft', 'published'], true), 'state', 'Une évaluation clôturée conserve ses corrections.');
                $resource->update(['is_published' => false, 'published_at' => null]);
                if ($assessment->state === 'published' && ($input['notify'] ?? false)) {
                    $this->notifyAudience($assessment, $resource, 'cancelled');
                }
            }
            $assessment->fill(['state' => $next, 'revision' => $assessment->revision + 1])->save();
            Audit::record($actor->id, 'assessment_'.$next, $assessment, $input['reason']);
        });
    }

    public function group(AcademicResource $resource, User $actor, array $input): void
    {
        $this->locked($resource, $actor, function (AcademicAssessment $assessment, AcademicResource $resource) use ($actor, $input) {
            AssessmentRules::revision($assessment->revision, $input['revision']);
            AssessmentRules::require($assessment->group_work && in_array($assessment->state, ['draft', 'published'], true), 'group', 'Cette évaluation n’accepte plus de nouveaux groupes.');
            $members = array_map('intval', $input['members']);
            AssessmentRules::require(in_array((int) $input['leader'], $members, true), 'leader', 'Désignez un membre du groupe.');
            AssessmentRules::require(! $assessment->groups()->where('label', $input['label'])->exists(), 'label', 'Ce nom de groupe est déjà utilisé.');
            $entries = AcademicEnrollment::with(['profile.user', 'application', 'academicYear'])->whereKey($members)->get();
            AssessmentRules::require($entries->count() === count($members) && ! $assessment->records()->whereIn('academic_enrollment_id', $members)->exists()
                && $entries->every(fn ($entry) => $this->access->eligible($entry, $resource)), 'members', 'Chaque membre doit être admissible et sans groupe pour cette évaluation.');
            $group = $assessment->groups()->create(['label' => $input['label'], 'leader_enrollment_id' => $input['leader']]);
            foreach ($entries as $entry) {
                $assessment->records()->create(['academic_enrollment_id' => $entry->id, 'academic_assessment_group_id' => $group->id,
                    'academic_course_registration_id' => $this->access->registration($entry, $resource)]);
            }
            $assessment->increment('revision');
            Audit::record($actor->id, 'assessment_group_formed', $group, $input['reason'], ['member_count' => count($members)]);
        });
    }

    public function locked(AcademicResource $resource, User $actor, Closure $change, bool $serializeTransmission = false): mixed
    {
        return DB::transaction(function () use ($resource, $actor, $change, $serializeTransmission) {
            if ($serializeTransmission) {
                // Publish cursor IDs in commit order even when different offers validate concurrently.
                AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
            }
            $offer = AcademicOffering::lockForUpdate()->findOrFail($resource->academic_offering_id);
            $this->access->write($actor, $offer);
            $resource = $offer->resources()->lockForUpdate()->findOrFail($resource->id);
            $resource->setRelation('offering', $offer);
            $assessment = $resource->assessment()->lockForUpdate()->firstOrFail();
            $assessment->setRelation('resource', $resource);

            return $change($assessment, $resource);
        });
    }

    private function freezeParticipants(AcademicAssessment $assessment, AcademicResource $resource): void
    {
        if ($assessment->group_work) {
            $assessment->records()->where('participation', 'unassessed')->update(['participation' => 'not_submitted']);

            return;
        }
        if ($assessment->modality === 'in_person') {
            $session = $resource->session;
            AcademicAttendance::where('academic_session_id', $session->id)->with('justification')->eachById(function ($attendance) use ($assessment) {
                $assessment->records()->firstOrCreate(['academic_enrollment_id' => $attendance->academic_enrollment_id], [
                    'academic_course_registration_id' => $attendance->academic_course_registration_id,
                    'participation' => $attendance->justification?->status === 'accepted' ? 'excused' : $attendance->status,
                ]);
            }, 100);
        }
        $this->eachEligible($resource, function ($entry) use ($assessment, $resource) {
            $assessment->records()->firstOrCreate(['academic_enrollment_id' => $entry->id], [
                'academic_course_registration_id' => $this->access->registration($entry, $resource),
                'participation' => $assessment->modality === 'in_person' ? 'unassessed' : 'not_submitted',
            ]);
        }, $assessment->modality === 'in_person' ? $resource->session->starts_at : null);
    }

    private function notifyAudience(AcademicAssessment $assessment, AcademicResource $resource, string $event): void
    {
        $this->eachEligible($resource, function ($entry) use ($assessment, $resource, $event) {
            if (! $assessment->group_work || $assessment->records()->where('academic_enrollment_id', $entry->id)->whereNotNull('academic_assessment_group_id')->exists()) {
                AssessmentNotices::send($entry, $resource, $event, (string) $assessment->id);
            }
        });
    }

    private function eachEligible(AcademicResource $resource, Closure $visit, ?CarbonInterface $at = null): void
    {
        $this->audience->roster($resource->offering, $at)->with(['profile.user', 'application', 'academicYear'])->eachById(function ($entry) use ($resource, $visit) {
            if ($this->access->eligible($entry, $resource)) {
                $visit($entry);
            }
        }, 100);
    }

    private function assertPeriod(AcademicOffering $offer, CarbonInterface $opens, CarbonInterface $closes): void
    {
        $semester = $offer->academicSemester;
        $firstDay = $offer->starts_on ?? $semester?->start_date ?? $offer->academicYear->start_date;
        $lastDay = $offer->ends_on ?? $semester?->end_date ?? $offer->academicYear->end_date;
        AssessmentRules::require($opens->copy()->timezone('Africa/Kinshasa')->toDateString() >= substr((string) $firstDay, 0, 10)
            && $closes->copy()->timezone('Africa/Kinshasa')->toDateString() <= substr((string) $lastDay, 0, 10),
            'closes_at', 'La période doit appartenir aux dates de cette offre.');
    }

    private function date(?string $value): ?CarbonImmutable
    {
        return $value ? CarbonImmutable::parse($value, 'Africa/Kinshasa')->utc() : null;
    }
}
