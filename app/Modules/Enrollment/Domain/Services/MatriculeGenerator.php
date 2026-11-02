<?php

namespace App\Modules\Enrollment\Domain\Services;

use App\Models\AcademicYear;
use App\Models\Level;
use App\Models\Student\StudentProfile;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepositoryInterface;
use App\Modules\Enrollment\Domain\ValueObjects\Matricule;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatriculeGenerator
{
    public function __construct(private readonly EnrollmentRepositoryInterface $repository) {}

    public function generate(Level $level, AcademicYear $year): Matricule
    {
        $code = strtoupper(trim((string) $level->faculty()->value('code')));
        if (! preg_match('/^[A-Z]{1,12}$/', $code)) {
            throw ValidationException::withMessages(['level_id' => 'La faculté doit avoir un code de 1 à 12 lettres pour attribuer un matricule.']);
        }

        return DB::transaction(function () use ($code) {
            DB::table('faculty_matricule_sequences')->insertOrIgnore(['faculty_code' => $code, 'last_number' => 0]);
            $counter = DB::table('faculty_matricule_sequences')->where('faculty_code', $code)->lockForUpdate()->first();
            $sequence = (int) $counter->last_number;
            // Bootstrap from identifiers already issued in this format, across all levels/years.
            if ($sequence === 0) {
                foreach (['enrollments', 'student_profiles', 'academic_enrollments'] as $table) {
                    foreach (DB::table($table)->where('matricule', 'like', $code.'%')->pluck('matricule') as $existing) {
                        if (preg_match('/^'.preg_quote($code, '/').'(\\d{4,8})$/', $existing, $matches)) {
                            $sequence = max($sequence, (int) $matches[1]);
                        }
                    }
                }
            }
            do {
                $sequence++;
                $matricule = Matricule::generate($code, $sequence);
            } while ($this->repository->existsMatricule($matricule->toString()) || StudentProfile::where('matricule', $matricule->toString())->exists() || DB::table('academic_enrollments')->where('matricule', $matricule->toString())->exists());
            DB::table('faculty_matricule_sequences')->where('faculty_code', $code)->update(['last_number' => $sequence]);

            return $matricule;
        });
    }
}
