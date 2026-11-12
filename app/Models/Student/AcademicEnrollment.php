<?php

namespace App\Models\Student;

use App\Models\AcademicStructure\AcademicDepartment;
use App\Models\AcademicStructure\AcademicPromotion;
use App\Models\AcademicStructure\AdmissionCohort;
use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\Enrollment;
use App\Models\Level;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AcademicEnrollment extends Model
{
    protected $table = 'academic_enrollments';

    protected $fillable = ['student_profile_id', 'application_id', 'level_id', 'academic_department_id', 'admission_cohort_id', 'academic_promotion_id', 'academic_year_id', 'class_id', 'matricule', 'enrollment_status', 'fee_category', 'currency'];

    protected $casts = [];

    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function changes()
    {
        return $this->hasMany(EnrollmentChange::class);
    }

    public function department()
    {
        return $this->belongsTo(AcademicDepartment::class, 'academic_department_id');
    }

    public function curriculumVersion()
    {
        return $this->belongsTo(CurriculumVersion::class);
    }

    public function promotion()
    {
        return $this->belongsTo(AcademicPromotion::class, 'academic_promotion_id');
    }

    public function admissionCohort()
    {
        return $this->belongsTo(AdmissionCohort::class);
    }

    public function courseRegistrations()
    {
        return $this->hasMany(CourseRegistration::class);
    }

    public function courseExceptions()
    {
        return $this->hasMany(CourseException::class);
    }

    public function profile()
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    public function application()
    {
        return $this->belongsTo(Enrollment::class, 'application_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function group()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function cardIssuance(): HasOne
    {
        return $this->hasOne(CardIssuance::class);
    }

    public function cardRequest(): HasOne
    {
        return $this->hasOne(CardRequest::class);
    }

    public function obligations()
    {
        return $this->hasMany(StudentObligation::class);
    }

    public function payments()
    {
        return $this->hasMany(StudentPayment::class);
    }

    public function adjustments()
    {
        return $this->hasMany(FinancialAdjustment::class);
    }
}
