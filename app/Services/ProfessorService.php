<?php

namespace App\Services;

use App\Models\Professor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProfessorService
{
    public function __construct(
        private Professor $professor
    ) {}

    /**
     * Récupère les facultés avec pagination et filtres
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->buildQuery($filters);

        return $query->paginate($perPage);
    }

    /**
     * Récupère toutes les facultés actives (pour les selects)
     */
    public function getActive(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember('professors.active', 3600, function () {
            return $this->professor
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'description', 'duration_years', 'is_active']);
        });
    }

    public function getWithLevels()
    {
        return Professor::with([
            'levels' => function ($query) {
                $query->orderBy('level_code')
                    ->with('details'); // 🔥 Charger details à ce niveau
            }
        ])
            ->where('is_active', true)
            ->get();
    }



    /**
     * Trouve une faculté par ID
     */
    public function findById(int $id): ?Professor
    {
        return $this->professor->find($id);
    }

    /**
     * Trouve une faculté par code
     */
    public function findByCode(string $code): ?Professor
    {
        return $this->professor->byCode(strtoupper($code))->first();
    }

    /**
     * Crée une nouvelle faculté
     */
    public function create(array $data): Professor
    {
        return DB::transaction(function () use ($data) {
            $professor = $this->professor->create($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Professeur créée', [
                'professor_id' => $professor->id,
                'name' => $professor->last_name,
                'user_id' => auth()->id()
            ]);

            return $professor;
        });
    }

    /**
     * Met à jour une faculté
     */
    public function update(Professor $professor, array $data): Professor
    {
        return DB::transaction(function () use ($professor, $data) {
            $oldData = $professor->toArray();

            $professor->update($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Professeur mise à jour', [
                'professor_id' => $professor->id,
                'changes' => array_diff_assoc($data, $oldData),
                'user_id' => auth()->id()
            ]);

            return $professor->refresh();
        });
    }

    /**
     * Supprime une faculté (soft delete)
     */
    public function delete(Professor $professor): bool
    {
        return DB::transaction(function () use ($professor) {
            $result = $professor->delete();

            // Invalider le cache
            $this->clearCache();

            Log::warning('Professeur supprimée', [
                'professor_id' => $professor->id,
                'name' => $professor->last_name,
                'user_id' => auth()->id()
            ]);

            return $result;
        });
    }

    /**
     * Active/Désactive une faculté
     */
    public function toggleStatus(Professor $professor): Professor
    {
        $newStatus = !$professor->is_active;

        $this->update($professor, ['is_active' => $newStatus]);

        return $professor->refresh();
    }

    /**
     * Construit la requête avec les filtres
     */
    private function buildQuery(array $filters): Builder
    {
        $query = $this->professor->newQuery();

        // Filtre par statut
        if (isset($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->active();
            } elseif ($filters['status'] === 'inactive') {
                $query->inactive();
            }
        }

        // Filtre par recherche
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        // Filtre par durée
        if (isset($filters['duration_years'])) {
            $query->where('duration_years', $filters['duration_years']);
        }

        // Tri
        $sortField = $filters['sort_by'] ?? 'name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        $query->orderBy($sortField, $sortDirection);

        return $query;
    }

    /**
     * Vide le cache
     */
    private function clearCache(): void
    {
        Cache::forget('professors.active');
        Cache::tags(['professors'])->flush();
    }

    /**
     * Statistiques des facultés
     */
    public function getStats(): array
    {
        return Cache::remember('professors.stats', 1800, function () {
            return [
                'total' => $this->professor->count(),
                'active' => $this->professor->active()->count(),
                'inactive' => $this->professor->inactive()->count(),
                'avg_duration' => $this->professor->avg('duration_years'),
                'recent' => $this->professor->where('created_at', '>=', now()->subMonth())->count(),
            ];
        });
    }
}
