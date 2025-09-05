<?php

namespace App\Modules\LevelDetail\Application\UseCases;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;

final class UpdateLevelDetail
{
    public function __construct(private LevelDetailRepository $repo) {}

    public function execute(
        int $id,
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
        ?array $options
    ): LevelDetail {
        $existing = $this->repo->findById($id);

        if (!$existing) {
            throw new \DomainException("Le détail du niveau #$id est introuvable.");
        }

        $updated = new LevelDetail(
            $id,
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
            $options
        );

        return $this->repo->save($updated);
    }
}
