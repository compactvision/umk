<?php

namespace App\Modules\LevelDetail\Application\UseCases;

use App\Modules\LevelDetail\Domain\Entities\LevelDetail;
use App\Modules\LevelDetail\Domain\Repositories\LevelDetailRepository;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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

        $previousImage = $existing->illustrationImage();
        $imagePath = $previousImage;

        // ✅ Gestion de l'image
        if ($illustrationImage instanceof UploadedFile) {
            try {
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
                throw ValidationException::withMessages(['illustration_image' => 'L’illustration n’a pas pu être enregistrée.']);
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
            $price = (float) \App\Modules\Student\Application\Services\Money::decimal(\App\Modules\Student\Application\Services\Money::cents((string)$installments['price_national_first']) + \App\Modules\Student\Application\Services\Money::cents((string)$installments['price_national_second']));
        }
        if (isset($installments['price_foreign_first'], $installments['price_foreign_second'])) {
            $priceForeign = (float) \App\Modules\Student\Application\Services\Money::decimal(\App\Modules\Student\Application\Services\Money::cents((string)$installments['price_foreign_first']) + \App\Modules\Student\Application\Services\Money::cents((string)$installments['price_foreign_second']));
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

        try {
            $saved = $this->repo->save($updated);
        } catch (\Throwable $exception) {
            if ($imagePath && $imagePath !== $previousImage) {
                $this->imageService->delete($imagePath);
            }

            throw $exception;
        }

        if ($imagePath !== $previousImage && $previousImage && str_starts_with($previousImage, 'level_illustrations/')) {
            DB::afterCommit(fn () => $this->imageService->delete($previousImage));
        }

        return $saved;
    }
}
