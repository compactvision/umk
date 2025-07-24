<?php

namespace App\Services;

use App\Models\Faculty;
use App\Models\Level;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LevelService
{
    public function __construct(
        private Level $level
    )
    {
    }
    /**
     * Récupère les niveaux avec pagination et filtres
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->buildQuery($filters);

        return $query->paginate($perPage);
    }

    /**
     * Récupère tous les niveaux actifs (pour les selects)
     */
    public function getActive(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember('levels.active', 3600, function () {
            return $this->level
                ->orderBy('level_name')
                ->get(['id', 'level_name', 'level_code', 'description', 'duration_years', 'is_active', 'student_number', 'credit_required', 'courses_number', 'image']);
        });
    }

    /**
     * Trouve un niveau par ID
     */
    public function findById(int $id): ?Level
    {
        return $this->level->find($id);
    }

    /**
     * Trouve un niveau par code
     */
    public function findByCode(string $code): ?Level
    {
        return $this->level->byCode(strtoupper($code))->first();
    }

    /**
     * Crée un nouveau niveau
     */
    public function create(array $data): Level
    {
        return DB::transaction(function () use ($data) {
            $faculty = Faculty::findOrFail($data['faculty_id']);
            $data['tag'] = $faculty->code;
            $level = $this->level->create($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Niveau créé', [
                'faculty_id' => $level->id,
                'level_name' => $level->level_name,
                'user_id' => auth()->id()
            ]);

            return $level;
        });
    }

    /**
     * Met à jour un niveau
     */
    public function update(Level $level, array $data): Level
    {
        return DB::transaction(function () use ($level, $data) {
            $oldData = $level->toArray();

            $level->update($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Niveau mis à jour', [
                'level_id' => $level->id,
                'changes' => array_diff_assoc($data, $oldData),
                'user_id' => auth()->id()
            ]);

            return $level->refresh();
        });
    }

    /**
     * Supprime un niveau (soft delete)
     */
    public function delete(Level $level): bool
    {
        return DB::transaction(function () use ($level) {
            $result = $level->delete();

            // Invalider le cache
            $this->clearCache();

            Log::warning('Niveau supprimée', [
                'level_id' => $level->id,
                'level_name' => $level->level_name,
                'user_id' => auth()->id()
            ]);

            return $result;
        });
    }

    /**
     * Construit la requête avec les filtres
     */
    private function buildQuery(array $filters): Builder
    {
        $query = $this->level->newQuery();

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
        $sortField = $filters['sort_by'] ?? 'level_name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        $query->orderBy($sortField, $sortDirection);

        return $query;
    }

    /**
     * Vide le cache
     */
    private function clearCache(): void
    {
        Cache::forget('levels.active');
        Cache::tags(['levels'])->flush();
    }

    /**
     * Statistiques des facultés
     */
    public function getStats(): array
    {
        return Cache::remember('levels.stats', 1800, function () {
            return [
                'total' => $this->level->count(),
                'active' => $this->level->active()->count(),
                'inactive' => $this->level->inactive()->count(),
                'avg_duration_years' => $this->level->avg('duration_years'),
                'recent' => $this->level->where('created_at', '>=', now()->subMonth())->count(),
            ];
        });
    }
}
