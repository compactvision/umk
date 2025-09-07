<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdmissionConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'faculty_id'  => 'required|exists:faculties,id',
            'level_id'    => 'required|exists:levels,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'section'     => 'required|string|max:255',
            'is_required' => 'required|boolean',
        ];
    }

    public function messages(): array   
    {
        return [
            'faculty_id.required'  => 'La faculté est obligatoire.',
            'level_id.required'    => 'Le niveau est obligatoire.',
            'title.required'       => 'Le titre est obligatoire.',
            'section.required'     => 'La section est obligatoire.',
            'is_required.required' => 'Le statut est obligatoire.',
        ];
    }
}
