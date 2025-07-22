<?php

namespace App\Http\Requests\Faculty;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255|unique:faculties,name',
            'code' => 'required|string|max:10|unique:faculties,code',
            'description' => 'nullable|string|max:1000',
            'duration_years' => 'required|integer|min:1|max:10',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Le nom de la faculté est obligatoire.',
            'name.unique' => 'Ce nom de faculté existe déjà.',
            'code.required' => 'Le code de la faculté est obligatoire.',
            'code.unique' => 'Ce code de faculté existe déjà.',
            'duration_years.required' => 'La durée est obligatoire.',
            'duration_years.integer' => 'La durée doit être un nombre entier.',
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
