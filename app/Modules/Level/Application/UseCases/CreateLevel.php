<?php

namespace App\Modules\Level\Application\UseCases;

use App\Modules\Level\Domain\Entities\Level;
use App\Modules\Level\Domain\Repositories\LevelRepository;
use App\Modules\Level\Domain\Exceptions\DuplicateLevelCodeException;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

final class CreateLevel
{
    public function __construct(
        private LevelRepository $repo,
        private ImageService $imageService
    ) {}

    public function execute(
        int $facultyId,
        string $title,
        string $code,
        ?UploadedFile $image,
        ?string $tag = null,
        ?string $description = null,
        bool $isActive = true
    ): Level {
        // ✅ Vérification de duplication avant création
        $existing = $this->repo->findByCodeAndFaculty($code, $facultyId);
        if ($existing) {
            throw new DuplicateLevelCodeException(
                "Le code '{$code}' existe déjà pour cette faculté."
            );
        }

        $imagePath = null;

        // ✅ Gestion de l'image
        if ($image instanceof UploadedFile) {
            try {
                $imagePath = $this->imageService->resizeAndStore(
                    $image,
                    'levels',
                    820,
                    460
                );
            } catch (\Exception $e) {
                Log::error('Erreur upload image niveau:', [
                    'message' => $e->getMessage()
                ]);
                // Continuer sans image plutôt que de planter
                $imagePath = null;
            }
        }

        // ✅ Le tag sera automatiquement le code si non fourni
        $finalTag = $tag ?? $code;

        // ✅ Créer l'entité Level
        $level = new Level(
            null, // ID sera généré par le repo
            $facultyId,
            trim($title),
            strtoupper(trim($code)), // Normaliser le code
            $imagePath,
            $finalTag,
            $description ? trim($description) : null,
            $isActive
        );

        // ✅ Sauvegarder via le repository
        return $this->repo->save($level);
    }
}