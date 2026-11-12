<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('publish academic content');
    }

    public function rules(): array
    {
        return self::courseRules() + [
            'faculty_id' => ['required', 'integer', 'exists:faculties,id'],
            'level_id' => ['required', 'integer', Rule::exists('levels', 'id')->where('faculty_id', $this->integer('faculty_id'))],
            'professor_id' => ['nullable', 'integer', Rule::exists('professors', 'id')->where('is_active', true)],
            'academic_year_id' => ['nullable', 'required_with:professor_id', 'integer', 'exists:academic_years,id'],
        ];
    }

    public static function courseRules(): array
    {
        return [
            'title' => 'required|string|max:180',
            'discipline' => 'nullable|string|max:120',
            'code' => 'nullable|string|max:50',
            'credits' => 'required|integer|min:0|max:60',
            'semester' => 'required|integer|in:1,2',
            'description' => 'nullable|string|max:5000',
            'cmi_hours' => 'nullable|integer|min:0|max:2000',
            'td_hours' => 'nullable|integer|min:0|max:2000',
            'tp_hours' => 'nullable|integer|min:0|max:2000',
            'pedagogical_content' => 'nullable|string|max:30000',
        ];
    }

    public function attributes(): array
    {
        return [
            'faculty_id' => 'faculté',
            'level_id' => 'niveau',
            'professor_id' => 'enseignant',
            'academic_year_id' => 'année académique',
            'title' => 'intitulé du cours',
            'credits' => 'crédits',
            'semester' => 'semestre',
        ];
    }

    public function messages(): array
    {
        return ['level_id.exists' => 'Choisissez un niveau de la faculté sélectionnée.'];
    }
}
