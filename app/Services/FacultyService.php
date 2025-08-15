<?php

namespace App\Services;

use App\Models\Faculty;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FacultyService
{
    public function __construct(
        private Faculty $faculty
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
        return Cache::remember('faculties.active', 3600, function () {
            return $this->faculty
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'description', 'duration_years', 'is_active']);
        });
    }

    public function getWithLevels()
    {
        return Faculty::with([
            'levels' => function ($query) {
                $query->orderBy('level_name')
                    ->with('details'); // 🔥 Charger details à ce niveau
            }
        ])
            ->where('is_active', true)
            ->get();
    }



    /**
     * Trouve une faculté par ID
     */
    public function findById(int $id): ?Faculty
    {
        return $this->faculty->find($id);
    }

    /**
     * Trouve une faculté par code
     */
    public function findByCode(string $code): ?Faculty
    {
        return $this->faculty->byCode(strtoupper($code))->first();
    }

    /**
     * Crée une nouvelle faculté
     */
    public function create(array $data): Faculty
    {
        return DB::transaction(function () use ($data) {
            $faculty = $this->faculty->create($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Faculté créée', [
                'faculty_id' => $faculty->id,
                'name' => $faculty->name,
                'user_id' => auth()->id()
            ]);

            return $faculty;
        });
    }

    /**
     * Met à jour une faculté
     */
    public function update(Faculty $faculty, array $data): Faculty
    {
        return DB::transaction(function () use ($faculty, $data) {
            $oldData = $faculty->toArray();

            $faculty->update($data);

            // Invalider le cache
            $this->clearCache();

            Log::info('Faculté mise à jour', [
                'faculty_id' => $faculty->id,
                'changes' => array_diff_assoc($data, $oldData),
                'user_id' => auth()->id()
            ]);

            return $faculty->refresh();
        });
    }

    /**
     * Supprime une faculté (soft delete)
     */
    public function delete(Faculty $faculty): bool
    {
        return DB::transaction(function () use ($faculty) {
            $result = $faculty->delete();

            // Invalider le cache
            $this->clearCache();

            Log::warning('Faculté supprimée', [
                'faculty_id' => $faculty->id,
                'name' => $faculty->name,
                'user_id' => auth()->id()
            ]);

            return $result;
        });
    }

    /**
     * Active/Désactive une faculté
     */
    public function toggleStatus(Faculty $faculty): Faculty
    {
        $newStatus = !$faculty->is_active;

        $this->update($faculty, ['is_active' => $newStatus]);

        return $faculty->refresh();
    }

    /**
     * Construit la requête avec les filtres
     */
    private function buildQuery(array $filters): Builder
    {
        $query = $this->faculty->newQuery();

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
        Cache::forget('faculties.active');
        Cache::tags(['faculties'])->flush();
    }

    /**
     * Statistiques des facultés
     */
    public function getStats(): array
    {
        return Cache::remember('faculties.stats', 1800, function () {
            return [
                'total' => $this->faculty->count(),
                'active' => $this->faculty->active()->count(),
                'inactive' => $this->faculty->inactive()->count(),
                'avg_duration' => $this->faculty->avg('duration_years'),
                'recent' => $this->faculty->where('created_at', '>=', now()->subMonth())->count(),
            ];
        });
    }
}
