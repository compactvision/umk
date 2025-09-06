<?php

namespace App\Modules\Level\Application\UseCases;

use App\Modules\Level\Domain\Entities\Level;
use App\Modules\Level\Domain\Repositories\LevelRepository;
use App\Modules\Level\Domain\Exceptions\DuplicateLevelCodeException;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

final class UpdateLevel
{
    public function __construct(
        private LevelRepository $repo,
        private ImageService $imageService
    ) {}

    public function execute(
        int $id,
        int $facultyId,
        string $title,
        string $code,
        ?UploadedFile $image,
        ?string $tag = null,
        ?string $description = null,
        bool $isActive = true
    ): Level {
        // ✅ Vérifier que le niveau existe
        $level = $this->repo->findById($id);

        if (!$level) {
            throw new \DomainException("Le niveau avec l'ID {$id} n'existe pas.");
        }

        // ✅ Vérifier la duplication de code (sauf pour le niveau actuel)
        $existing = $this->repo->findByCodeAndFaculty($code, $facultyId);
        
        if ($existing && $existing->id() !== $id) {
            throw new DuplicateLevelCodeException(
                "Le code '{$code}' existe déjà pour cette faculté."
            );
        }

        // ✅ Gestion de l'image
        $imagePath = $level->image(); // Garder l'ancienne par défaut

        if ($image instanceof UploadedFile) {
            try {
                // ✅ Supprimer l'ancienne image si elle existe
                if ($level->image()) {
                    $this->imageService->delete($level->image());
                }

                // ✅ Uploader la nouvelle
                $imagePath = $this->imageService->resizeAndStore(
                    $image,
                    'levels',
                    820,
                    460
                );
            } catch (\Exception $e) {
                Log::error('Erreur upload image niveau (update):', [
                    'id' => $id,
                    'message' => $e->getMessage()
                ]);
                // Garder l'ancienne image en cas d'erreur
                $imagePath = $level->image();
            }
        }

        // ✅ Le tag sera le code si non fourni
        $finalTag = $tag ?? $code;

        // ✅ Créer la nouvelle entité mise à jour
        $updatedLevel = new Level(
            $id,
            $facultyId,
            trim($title),
            strtoupper(trim($code)), // Normaliser le code
            $imagePath,
            $finalTag,
            $description ? trim($description) : null,
            $isActive
        );

        // ✅ Sauvegarder via le repository
        return $this->repo->save($updatedLevel);
    }
}