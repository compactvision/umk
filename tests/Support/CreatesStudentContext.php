<?php

namespace Tests\Support;

use App\Models\Enrollment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

trait CreatesStudentContext
{
    private function studentContext(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Role::findOrCreate('student', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Faculté de test', 'code' => 'TEST']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Niveau de test', 'code' => 'T1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30', 'status' => 'open']);
        $application = Enrollment::create(['student_id' => $user->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => 'validated']);
        $profile = StudentProfile::create(['user_id' => $user->id, 'student_status' => 'active']);
        AcademicEnrollment::create(['student_profile_id' => $profile->id, 'application_id' => $application->id, 'level_id' => $level, 'academic_year_id' => $year, 'enrollment_status' => 'confirmed', 'currency' => 'USD']);

        return $user;
    }
}
