<?php

namespace App\Modules\Faculty\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ou ajouter une policy
    }

    public function rules(): array
    {
        return [
            'name'           => 'required|string|max:255|unique:faculties,name',
            'code'           => 'required|string|max:10|unique:faculties,code',
            'description'    => 'nullable|string|max:1000',
            'duration_years' => 'required|integer|min:1|max:10',
            'is_active'      => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Le nom est obligatoire.',
            'name.unique'             => 'Le nom de la faculté existe déjà.',
            'code.required'           => 'Le code est obligatoire.',
            'code.unique'             => 'Le code de la faculté existe déjà.',
            'description.max'         => 'La description ne peut pas contenir plus de 1000 caractères.',
            'duration_years.required' => 'L\'année de début est obligatoire.',
            'duration_years.min'      => 'L\'année de début doit être supérieure ou égale à 1.',
            'duration_years.max'      => 'L\'année de début doit être inférieure ou égale à 10.',
            'is_active.boolean'       => 'Le statut doit être un booléen.',
        ];
    }
}
