<?php

namespace App\Modules\LevelDetail\Application\UseCases;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

final class UpdateLevelDetail
{
    public function __construct(
        private LevelDetailRepository $repo,
        private ImageService $imageService
    ) {}

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
        ?UploadedFile $illustrationImage,
        ?string $courseObjective,
        ?int $fees,
        ?array $options
    ): LevelDetail {
        $existing = $this->repo->findById($id);

        if (!$existing) {
            throw new \DomainException("Le détail du niveau #$id est introuvable.");
        }

        $imagePath = $existing->illustrationImage();

        // ✅ Gestion de l'image
        if ($illustrationImage instanceof UploadedFile) {
            try {
                if ($existing->illustrationImage()) {
                    $this->imageService->delete($existing->illustrationImage());
                }
                
                $imagePath = $this->imageService->resizeAndStore(
                    $illustrationImage,
                    'level_illustrations',
                    1290,
                    515
                );
            } catch (\Exception $e) {
                Log::error('Erreur upload image niveau:', [
                    'message' => $e->getMessage()
                ]);
                // Continuer sans image plutôt que de planter
                $imagePath = $existing->illustrationImage();
            }
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
            $imagePath,
            $courseObjective,
            $fees,
            $options
        );

        return $this->repo->save($updated);
    }
}
