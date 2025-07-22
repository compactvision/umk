<?php

namespace App\Http\Requests\Faculty;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class UpdateFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $facultyId = $this->route('faculty')->id;

        return [
            'name' => [
                'required',
                'string',
                'min:3',
                'max:255',
                Rule::unique('faculties', 'name')->ignore($facultyId)
            ],
            'code' => [
                'required',
                'string',
                'min:2',
                'max:10',
                'alpha_num',
                Rule::unique('faculties', 'code')->ignore($facultyId)
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000'
            ],
            'duration_years' => [
                'required',
                'integer',
                'min:1',
                'max:10'
            ],
            'is_active' => [
                'boolean'
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la faculté est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 3 caractères.',
            'name.max' => 'Le nom ne peut pas dépasser 255 caractères.',
            'name.unique' => 'Cette faculté existe déjà.',
            'code.required' => 'Le code est obligatoire.',
            'code.unique' => 'Ce code est déjà utilisé.',
            'code.alpha_num' => 'Le code ne peut contenir que des lettres et des chiffres.',
            'duration_years.required' => 'La durée est obligatoire.',
            'duration_years.min' => 'La durée minimum est de 1 an.',
            'duration_years.max' => 'La durée maximum est de 10 ans.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper(trim($this->code)),
            'name' => trim($this->name),
            'is_active' => $this->boolean('is_active', true)
        ]);
    }
}
