<?php


namespace App\Modules\Enrollment\Domain\Services;

use App\Models\Level;
use App\Models\AcademicYear;
use App\Modules\Enrollment\Domain\ValueObjects\Matricule;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;

class MatriculeGenerator
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $repository
    ) {}

    public function generate(Level $level, AcademicYear $year): Matricule
    {
        $yearCode = date('Y', strtotime($year->start_date));
        $facultyId = $level->faculty_id ?? 1;
        
        // Chercher le dernier numéro de séquence
        $lastMatricule = $this->repository->generateMatricule($level->id, $year->id);
        
        $sequence = 1;
        if ($lastMatricule) {
            $sequence = (int)substr($lastMatricule, -5) + 1;
        }
        
        do {
            $matricule = Matricule::generate($yearCode, $facultyId, $sequence);
            $sequence++;
        } while ($this->repository->existsMatricule($matricule->toString()));
        
        return $matricule;
    }
}