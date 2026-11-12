<?php

namespace App\Modules\Results\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\LearningFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class ResultAppeals
{
    public function __construct(private ResultsAccess $access, private LearningFiles $files, private ResultNotices $notices) {}

    public function deadline(AcademicOfficialResult $result)
    {
        $days = $result->run->rule->configuration['appeal_days'];

        return $days > 0 ? $result->run->published_at?->copy()->addDays($days) : null;
    }

    public function submit(AcademicOfficialResult $result, AcademicEnrollment $entry, User $actor, array $input, ?UploadedFile $file): ServiceRequest
    {
        abort_unless($result->academic_enrollment_id === $entry->id && $result->run->state === 'published', 404);
        $target = $input['target'];
        $targets = collect($result->snapshot['units'])->flatMap(fn ($unit) => $unit['items'])->map(fn ($item) => 'ec:'.$item['id']);
        ResultRules::check($target === 'decision' || $targets->contains($target), 'target', 'Choisissez la décision ou un EC du résultat.');
        $facts = $file ? $this->files->inspect($file, 'material') : [];
        $written = null;
        try {
            return DB::transaction(function () use ($result, $entry, $actor, $input, $file, $facts, $target, &$written) {
                AcademicEnrollment::lockForUpdate()->findOrFail($entry->id);
                $existing = $entry->serviceRequests()->where('academic_official_result_id', $result->id)->where('result_target', $target)->first();
                if ($existing) {
                    return $existing;
                }
                $deadline = $this->deadline($result);
                ResultRules::check($deadline !== null && now()->lte($deadline), 'target', 'La période de recours est fermée.');
                if ($file) {
                    $this->files->store($file, $facts, $written, 'official-result-appeals/'.$result->id);
                }
                $request = $entry->serviceRequests()->create([
                    'academic_official_result_id' => $result->id, 'result_target' => $target, 'result_attachment' => $written,
                    'category' => 'appeal', 'subject' => 'Recours sur résultat officiel · '.$result->reference, 'body' => $input['body'], 'status' => 'open',
                ]);
                Audit::record($actor->id, 'official_result_appeal_filed', $request, data: ['result_id' => $result->id, 'target' => $target]);

                return $request;
            });
        } catch (Throwable $error) {
            if ($written) {
                Storage::disk('local')->delete($written);
            }
            throw $error;
        }
    }

    public function decide(ServiceRequest $appeal, User $actor, array $input): void
    {
        abort_unless($appeal->academic_official_result_id, 404);
        $result = $appeal->officialResult;
        $faculty = $result->run->context['faculty_id'];
        $this->access->staff($actor, $faculty, in_array($input['action'], ['accept', 'reject', 'inadmissible'], true) ? ResultsAccess::PUBLISH : ResultsAccess::MANAGE);
        $state = DB::transaction(function () use ($appeal, $actor, $input, $faculty) {
            $appeal = ServiceRequest::lockForUpdate()->findOrFail($appeal->id);
            ResultRules::check($appeal->result_revision === (int) $input['revision'], 'revision', 'Rechargez le recours.');
            $transition = [
                'review' => ['open', 'under_review'], 'admit' => ['under_review', 'admissible'], 'inadmissible' => ['under_review', 'inadmissible'],
                'investigate' => ['admissible', 'investigating'], 'accept' => ['investigating', 'accepted'], 'reject' => ['investigating', 'rejected'],
            ][$input['action']];
            ResultRules::check($appeal->status === $transition[0], 'action', 'Cette transition est indisponible.');
            if ($input['action'] === 'investigate') {
                $assigned = User::findOrFail($input['assigned_to']);
                $this->access->staff($assigned, $faculty, ResultsAccess::MANAGE);
                $appeal->assigned_to = $assigned->id;
            }
            $final = in_array($input['action'], ['accept', 'reject', 'inadmissible'], true);
            $appeal->fill(['status' => $transition[1], 'result_revision' => $appeal->result_revision + 1]);
            if ($final) {
                $appeal->fill(['responded_by' => $actor->id, 'response' => $input['reason']]);
            }
            $appeal->save();
            Audit::record($actor->id, 'official_result_appeal_'.$appeal->status, $appeal, $input['reason'], ['previous' => $transition[0]]);

            return $final ? $appeal->status : null;
        });
        if ($state) {
            $this->notices->send($appeal->enrollment, 'appeal_decided', (string) $appeal->id);
        }
    }
}
