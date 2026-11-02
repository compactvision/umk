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
        ?array $options,
        ?float $priceForeign = null,
        bool $replacePriceForeign = false,
        array $installments = []
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

        $submittedInstallments = $installments;
        if (array_key_exists('price_national_first', $submittedInstallments) && array_key_exists('price_national_second', $submittedInstallments)
            && $submittedInstallments['price_national_first'] === null && $submittedInstallments['price_national_second'] === null) {
            $price = $existing->price();
        }
        if (array_key_exists('price_foreign_first', $submittedInstallments) && array_key_exists('price_foreign_second', $submittedInstallments)
            && $submittedInstallments['price_foreign_first'] === null && $submittedInstallments['price_foreign_second'] === null) {
            $priceForeign = $existing->priceForeign();
            $replacePriceForeign = true;
        }
        $installments = array_replace($existing->installments(), $installments);
        $priceForeign = $replacePriceForeign ? $priceForeign : $existing->priceForeign();
        if (isset($installments['price_national_first'], $installments['price_national_second'])) {
            $price = (round((float) $installments['price_national_first'] * 100) + round((float) $installments['price_national_second'] * 100)) / 100;
        }
        if (isset($installments['price_foreign_first'], $installments['price_foreign_second'])) {
            $priceForeign = (round((float) $installments['price_foreign_first'] * 100) + round((float) $installments['price_foreign_second'] * 100)) / 100;
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
            $options,
            priceForeign: $priceForeign,
            installments: $installments
        );

        return $this->repo->save($updated);
    }
}
