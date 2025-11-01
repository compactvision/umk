<?php

namespace App\Modules\AdmissionCondition\Application\UseCases;

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
    public function __invoke(int $levelId, ?int $facultyId = null): array
    {
        // ⚠️ Assure-toi que l’ordre des params est (levelId, facultyId) partout (interface + impl)
        $rows = $this->conditions->findByLevelAndFaculty($levelId, $facultyId);

        $personal = [];
        $academic = [];
        $payment  = null;

        foreach ($rows as $cond) {
            $key = Str::slug($cond->getTitle() ?? ('condition_' . ($cond->getId() ?? 'x')), '_');

            $dto = [
                'key'      => $key,
                'label'    => $cond->getTitle() ?? $key,
                'required' => $cond->isRequired(),
                'accept'   => 'image/*,.pdf', // TODO: si tu stockes un "accept" en DB, mappe-le ici
            ];

            switch ($cond->getSection()) {
                case 'personal_info':
                    $personal[] = $dto;
                    break;
                case 'academic_info':
                    $academic[] = $dto;
                    break;
                case 'payment':
                    // Si tu as des montants en DB, mappe-les ici
                    $payment ??= ['required' => true, 'amount' => 50000, 'currency' => 'CDF'];
                    break;
                default:
                    // section inconnue → on range côté académique par défaut
                    $academic[] = $dto;
                    break;
            }
        }

        return [
            'personal_info' => $personal,
            'academic_info' => $academic,
            'payment'       => $payment,
        ];
    }
}
