<?php

namespace App\Modules\Blog\Infrastructure\Http\Request;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // À affiner avec une Policy si besoin
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required','string','max:255','unique:categories,name'],
            'color'       => ['nullable','string','max:20','regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'description' => ['nullable','string'],
        ];
    }

    public function messages(): array
    {
        return [
            'color.regex' => 'La couleur doit être un hex valide, ex: #3B82F6',
        ];
    }
}
