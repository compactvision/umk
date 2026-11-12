<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

use App\Models\AcademicStructure\AdmissionCampaign;
use App\Models\Level;
use App\Modules\AdmissionCondition\Domain\Repositories\AdmissionConditionRepository;
use Illuminate\Support\Str;

final class GetRequirementsFor
{
    public function __construct(
        private AdmissionConditionRepository $conditions
    ) {}

    /**
     * @return array{
     *   personal_info: array<int, array{key:string,label:string,required:bool,accept:string}>,
     *   academic_info: array<int, array{key:string,label:string,required:bool,accept:string}>,
     *   payment: array{required:bool,amount:int,currency:string}|null
     * }
     */
    public function __invoke(int $levelId, ?int $facultyId = null, ?int $yearId = null, ?int $programId = null): array
    {
        $owner = (int) Level::findOrFail($levelId)->faculty_id;
        abort_if($facultyId !== null && $facultyId !== $owner, 422, 'Le niveau n’appartient pas à cette faculté.');
        $rows = $this->conditions->findByLevelAndFaculty($owner, $levelId);

        $personal = [];
        $academic = [];
        $payment = null;

        foreach ($rows as $cond) {
            $key = Str::slug($cond->getTitle() ?? ('condition_'.($cond->getId() ?? 'x')), '_');

            $dto = [
                'key' => $key,
                'label' => $cond->getTitle() ?? $key,
                'required' => $cond->isRequired(),
                'accept' => 'image/*,.pdf', // TODO: si tu stockes un "accept" en DB, mappe-le ici
            ];

            switch ($cond->getSection()) {
                case 'personal_info':
                    $personal[] = $dto;
                    break;
                case 'academic_info':
                    $academic[] = $dto;
                    break;
                case 'payment':
                    // Aucun montant de candidature n’est défini par ce référentiel.
                    break;
                default:
                    // Les formalités non documentaires restent affichées dans le catalogue public.
                    break;
            }
        }

        if ($yearId && $programId) {
            $campaign = AdmissionCampaign::forContext($programId, $yearId, $levelId);
            foreach ($campaign?->additional_documents ?? [] as $label) {
                $academic[] = ['key' => 'campaign_'.substr(hash('sha256', $label), 0, 24), 'label' => $label, 'required' => true, 'accept' => 'image/*,.pdf'];
            }
        }

        return [
            'personal_info' => $personal,
            'academic_info' => $academic,
            'payment' => $payment,
        ];
    }
}
