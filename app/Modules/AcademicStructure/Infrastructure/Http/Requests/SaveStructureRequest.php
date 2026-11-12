<?php

namespace App\Modules\AcademicStructure\Infrastructure\Http\Requests;

use App\Models\AcademicStructure\AcademicProgram;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', AcademicProgram::class) ?? false;
    }

    public function rules(): array
    {
        $kind = $this->route('kind');
        $common = ['revision' => 'required|integer|min:0', 'reason' => 'required|string|min:5|max:1000'];
        if ($kind === 'group-promotion') {
            return $common + ['academic_promotion_id' => 'required|integer|exists:academic_promotions,id'];
        }
        if (in_array($kind, ['faculty-context', 'year-context'], true)) {
            return $common;
        }
        $rules = $common + ['code' => 'required|string|max:60|regex:/^[A-Za-z0-9][A-Za-z0-9_.-]*$/', 'name' => 'required|string|max:255', 'is_active' => 'required|boolean'];

        return $rules + match ($kind) {
            'university' => ['acronym' => 'nullable|string|max:60', 'site_id' => 'nullable|integer|exists:sites,id', 'address' => 'nullable|string|max:2000', 'contact_email' => 'nullable|email|max:255', 'contact_phone' => 'nullable|string|max:255'],
            'department' => ['faculty_id' => 'required|integer|exists:faculties,id'],
            'cycle' => ['normal_duration' => 'required|integer|min:1|max:100', 'progression_mode' => ['required', Rule::in(['annual', 'credits', 'custom'])], 'weighting_mode' => ['required', Rule::in(['credits', 'coefficients', 'both'])], 'periods' => 'required|array|min:1|max:24', 'periods.*.code' => 'required|string|max:60|distinct|regex:/^[A-Za-z0-9_.-]+$/', 'periods.*.name' => 'required|string|max:255'],
            'program' => ['faculty_id' => 'required|integer|exists:faculties,id', 'academic_department_id' => 'nullable|integer|exists:academic_departments,id', 'academic_cycle_id' => 'required|integer|exists:academic_cycles,id', 'degree' => 'nullable|string|max:255', 'normal_duration' => 'nullable|integer|min:1|max:100', 'level_ids' => 'required|array|min:1', 'level_ids.*' => 'required|integer|distinct|exists:levels,id'],
            'cohort' => ['academic_program_id' => 'required|integer|exists:academic_programs,id', 'academic_year_id' => 'required|integer|exists:academic_years,id'],
            'promotion' => ['academic_program_id' => 'required|integer|exists:academic_programs,id', 'academic_year_id' => 'required|integer|exists:academic_years,id', 'level_id' => 'required|integer|exists:levels,id'],
            default => [],
        };
    }
}
