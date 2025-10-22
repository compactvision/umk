<?php

namespace App\Modules\Enrollment\Infrastructure\Persistence;


use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class EloquentEnrollmentRepository implements EnrollmentRepository
{
    public function create(array $data): Enrollment
    {
        return Enrollment::create($data);
    }
    public function findById(int $id): ?Enrollment
    {
        return Enrollment::with(['documents', 'requirements'])->find($id);
    }
    public function findByUuid(string $uuid): ?Enrollment
    {
        return Enrollment::where('uuid', $uuid)->first();
    }
    public function save(Enrollment $e): void
    {
        $e->save();
    }

    public function paginateByStudent(
        int $studentId,
        array $filters = [],
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $q = Enrollment::query()
            ->with(['level.faculty','documents'])
            ->where('student_id', $studentId);

        // Filtres
        if (!empty($filters['statuses']) && is_array($filters['statuses'])) {
            $q->whereIn('status', $filters['statuses']); // valeurs string des enums
        }

        if (!empty($filters['level_id'])) {
            $q->where('level_id', (int) $filters['level_id']);
        }

        $dateField = $filters['date_field'] ?? 'created_at';
        if (!in_array($dateField, ['created_at','enrolled_at'], true)) {
            $dateField = 'created_at';
        }

        if (!empty($filters['from'])) {
            $q->where($dateField, '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $q->where($dateField, '<=', $filters['to']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $q->where(function ($qq) use ($search) {
                $qq->where('matricule', 'like', "%{$search}%")
                   ->orWhere('notes', 'like', "%{$search}%")
                   ->orWhere('uuid', 'like', "%{$search}%");
            });
        }

        $orderBy  = $filters['order_by'] ?? 'created_at';
        $orderDir = strtolower($filters['order_dir'] ?? 'desc');
        $orderDir = in_array($orderDir, ['asc','desc'], true) ? $orderDir : 'desc';

        $q->orderBy($orderBy, $orderDir);

        return $q->paginate($perPage, ['*'], 'page', $page);
    }
}
