<?php

namespace App\Modules\LevelDetail\Application\UseCases;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;

final class CreateLevelDetail
{
    public function __construct(private LevelDetailRepository $repo) {}

    public function execute(
        int $levelId,
        ?float $price,
        bool $hasCertificate,
        ?string $language,
        int $durationYears,
        ?int $studentNumber,
        ?int $creditRequired,
        ?int $coursesNumber,
        ?string $illustrationImage,
        ?string $courseObjective,
        ?int $fees,
        ?array $options,
        ?float $priceForeign = null,
        array $installments = []
    ): LevelDetail {
        if (isset($installments['price_national_first'], $installments['price_national_second'])) {
            $price = (float) \App\Modules\Student\Application\Services\Money::decimal(\App\Modules\Student\Application\Services\Money::cents((string)$installments['price_national_first']) + \App\Modules\Student\Application\Services\Money::cents((string)$installments['price_national_second']));
        }
        if (isset($installments['price_foreign_first'], $installments['price_foreign_second'])) {
            $priceForeign = (float) \App\Modules\Student\Application\Services\Money::decimal(\App\Modules\Student\Application\Services\Money::cents((string)$installments['price_foreign_first']) + \App\Modules\Student\Application\Services\Money::cents((string)$installments['price_foreign_second']));
        }

        $detail = new LevelDetail(
            null,
            $levelId,
            $price,
            $hasCertificate,
            $language,
            $durationYears,
            $studentNumber,
            $creditRequired,
            $coursesNumber,
            $illustrationImage,
            $courseObjective,
            $fees,
            $options,
            priceForeign: $priceForeign,
            installments: $installments
        );

        return $this->repo->save($detail);
    }
}
