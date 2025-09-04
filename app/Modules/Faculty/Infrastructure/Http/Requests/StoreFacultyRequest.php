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
}
