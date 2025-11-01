<?php

namespace App\Modules\Enrollment\Infrastructure\Persistence;

use App\Models\Enrollment;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\EnrollmentNotFoundException;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EloquentEnrollmentRepository implements EnrollmentRepositoryInterface
{
    public function findById(int $id): ?Enrollment
    {
        return Enrollment::find($id);
    }

    public function findByUuid(string $uuid): ?Enrollment
    {
        return Enrollment::where('uuid', $uuid)->first();
    }

    public function findByIdOrFail(int $id): Enrollment
    {
        $enrollment = $this->findById($id);
        
        if (!$enrollment) {
            throw EnrollmentNotFoundException::withId($id);
        }
        
        return $enrollment;
    }

    public function findByUuidOrFail(string $uuid): Enrollment
    {
        $enrollment = $this->findByUuid($uuid);
        
        if (!$enrollment) {
            throw EnrollmentNotFoundException::withUuid($uuid);
        }
        
        return $enrollment;
    }

    public function findDraftForStudent(int $studentId): ?Enrollment
    {
        return Enrollment::where('student_id', $studentId)
            ->where('status', EnrollmentStatus::DRAFT->value)
            ->where(function ($query) {
                $query->whereNull('draft_expires_at')
                    ->orWhere('draft_expires_at', '>', Carbon::now());
            })
            ->latest()
            ->first();
    }

    public function findByStudent(int $studentId, ?EnrollmentStatus $status = null): Collection
    {
        $query = Enrollment::where('student_id', $studentId);
        
        if ($status) {
            $query->where('status', $status->value);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }

    public function save(Enrollment $enrollment): Enrollment
    {
        $enrollment->save();
        return $enrollment->fresh();
    }

    public function delete(Enrollment $enrollment): bool
    {
        return $enrollment->delete();
    }

    public function generateMatricule(int $levelId, int $yearId): string
    {
        $last = Enrollment::where('level_id', $levelId)
            ->where('academic_year_id', $yearId)
            ->whereNotNull('matricule')
            ->orderBy('matricule', 'desc')
            ->value('matricule');
            
        return $last ?? '';
    }

    public function existsMatricule(string $matricule): bool
    {
        return Enrollment::where('matricule', $matricule)->exists();
    }

    public function getExpiredDrafts(): Collection
    {
        return Enrollment::where('status', EnrollmentStatus::DRAFT->value)
            ->where('draft_expires_at', '<', Carbon::now())
            ->get();
    }
}