<?php

namespace App\Modules\Documents\Application;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\ServiceRequest;
use App\Modules\Progression\Application\GraduationEvidence;
use App\Modules\Results\Application\ResultInputs;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\CardEligibility;
use Illuminate\Support\Facades\Storage;

final class DocumentFacts
{
    public function __construct(private AcademicAccessService $access, private CardEligibility $cards, private ResultInputs $results) {}

    public function eligible(AcademicEnrollment $entry, OfficialDocumentType $type, bool $student = false): ?AcademicOfficialResult
    {
        DocumentAccess::check($type->active && $type->faculty_id === $entry->level->faculty_id
            && $type->university_id === $entry->level->faculty->university_id && $type->university->is_active,
            'type', 'Ce document est indisponible pour cette inscription.');
        DocumentAccess::check($entry->application?->status?->value === 'validated'
            && in_array($entry->enrollment_status, ['confirmed', 'completed'], true)
            && in_array($entry->profile->student_status, ['active', 'graduated'], true)
            && filled($entry->matricule ?? $entry->profile->matricule) && filled($entry->profile->user->full_name),
            'academic', 'L’inscription et l’identité doivent être validées avec un matricule.');
        if ($student || $type->policy['financial_gate']) {
            $decision = $this->access->decision($entry, 'documents_request');
            DocumentAccess::check($decision['allowed'], 'type', $decision['reason'] ?? 'La règle de délivrance refuse cette demande.');
        }
        if ($type->kind === 'schooling') {
            DocumentAccess::check($entry->enrollment_status === 'confirmed' && $entry->academicYear->status === 'open'
                && $entry->profile->student_status === 'active', 'type', 'Le certificat de scolarité exige une inscription en cours.');
        }
        if ($type->kind === 'card') {
            $eligibility = $this->cards->summary($this->cards->query()->findOrFail($entry->id));
            DocumentAccess::check($eligibility['ready'], 'type', implode(' ', $eligibility['reasons']));
        }
        if (! in_array($type->kind, ['success', 'diploma'], true)) {
            return null;
        }

        $result = $this->results->latest($entry);
        $policy = $type->policy;
        DocumentAccess::check($result !== null && in_array($result->decision, $policy['decision_codes'], true)
            && $result->run->context['faculty_id'] === $type->faculty_id
            && ($policy['program_id'] === null || $result->run->context['program_id'] === $policy['program_id'])
            && ($result->snapshot['anomalies'] ?? []) === [] && ! ($result->snapshot['eliminatory'] ?? true)
            && ($type->kind === 'diploma' || $result->snapshot['credits']['earned'] >= $policy['minimum_credits']),
            'result', 'Aucun résultat officiel ne remplit les conditions de ce document.');
        if ($type->kind === 'diploma') {
            $completion = app(GraduationEvidence::class)->approved($entry, $result);
            DocumentAccess::check($completion && $completion->context['completion']['credits'] >= $policy['minimum_credits']
                && $entry->enrollment_status === 'completed'
                && filled($entry->curriculumVersion?->program_snapshot['degree']) && filled($policy['regulation'])
                && ! empty($policy['program_id']) && $policy['minimum_credits'] > 0,
                'result', 'La fin de cursus, le grade historique et le règlement de délivrance doivent être certifiés.');
        }

        return $result;
    }

    public function snapshot(ServiceRequest $request): array
    {
        $entry = $request->enrollment;
        $type = $request->documentType;
        $result = $this->eligible($entry, $type);
        DocumentAccess::check($result?->id === $request->document_source_result_id, 'result', 'Le résultat officiel a changé. Ouvrez une nouvelle demande.');
        $template = $request->documentTemplate;
        DocumentAccess::check($template && $template->approved_at !== null && $template->withdrawn_at === null
            && $template->official_document_type_id === $type->id, 'template', 'Le modèle doit être approuvé et disponible.');
        if ($type->kind === 'diploma') {
            DocumentAccess::check(filled($request->document_mandate), 'mandate', 'Consignez le mandat de délivrance approuvé.');
        }
        $prior = $request->previousDocument;
        $lineage = ['issuance_action' => $request->document_action, 'previous_number' => $prior?->number];
        if ($request->document_action === 'duplicate' && $prior) {
            return array_replace($prior->snapshot, [
                'signer' => $template->signer->full_name, 'capacity' => $template->capacity,
            ] + $lineage);
        }

        $photo = null;
        if ($type->kind === 'card') {
            $path = $entry->profile->photo_path;
            $bytes = $path ? Storage::disk('local')->get($path) : null;
            $image = is_string($bytes) ? @getimagesizefromstring($bytes) : false;
            DocumentAccess::check($image && in_array($image['mime'], ['image/jpeg', 'image/png', 'image/webp'], true), 'photo', 'La photo validée est indisponible.');
            $photo = ['path' => $path, 'hash' => hash('sha256', $bytes), 'mime' => $image['mime']];
        }

        return $lineage + [
            'student' => $result?->snapshot['student'] ?? $entry->profile->user->full_name,
            'matricule' => $result?->snapshot['matricule'] ?? $entry->matricule ?? $entry->profile->matricule,
            'institution' => $result?->run->context['university'] ?? $type->university->name,
            'faculty' => $result?->run->context['faculty'] ?? $entry->level->faculty->name,
            'level' => $result?->run->context['level'] ?? $entry->level->title,
            'program' => $result?->run->context['program'] ?? $entry->curriculumVersion?->program_snapshot['name'] ?? '',
            'year' => $result?->run->context['year'] ?? $entry->academicYear->title,
            'degree' => $entry->curriculumVersion?->program_snapshot['degree'] ?? '',
            'decision' => $result ? $result->run->context['decisions'][$result->decision]['label'] : '',
            'credits' => $result ? number_format(($type->kind === 'diploma'
                ? app(GraduationEvidence::class)->approved($entry, $result)->context['completion']['credits']
                : $result->snapshot['credits']['earned']) / 100, 2, ',', ' ') : '',
            'session' => $result?->run->context['session'] ?? '', 'official_result_reference' => $result?->reference,
            'signer' => $template->signer->full_name, 'capacity' => $template->capacity, 'mandate' => $request->document_mandate,
            'photo' => $photo,
        ];
    }
}
