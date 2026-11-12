<?php

namespace App\Models\AcademicStructure;

use Illuminate\Database\Eloquent\Model;

class AdmissionCampaign extends Model
{
    protected $fillable = ['academic_program_id', 'academic_year_id', 'level_id', 'is_open', 'opens_on', 'closes_on', 'additional_documents'];

    protected $casts = ['is_open' => 'boolean', 'additional_documents' => 'array'];

    public static function forContext(int $program, int $year, int $level): ?self
    {
        return static::where('academic_program_id', $program)->where('academic_year_id', $year)->where('level_id', $level)->first();
    }

    public function acceptsApplications(): bool
    {
        $today = today('Africa/Kinshasa')->toDateString();

        return $this->is_open && (! $this->opens_on || $this->opens_on <= $today) && (! $this->closes_on || $this->closes_on >= $today);
    }
}
