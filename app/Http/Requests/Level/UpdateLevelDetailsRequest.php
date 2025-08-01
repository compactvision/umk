<?php

namespace App\Http\Requests\Level;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLevelDetailsRequest extends FormRequest
{
    public function authorize()
    {
        return true; // ou votre logique d'autorisation
    }

    public function rules(): array
    {
        return [
            'details.price'           => ['required', 'numeric', 'min:0'],
            'details.credit_required' => ['nullable', 'integer', 'min:0'],
            'details.duration_years'  => ['required', 'integer', 'min:1'],
            'details.courses_number'  => ['nullable', 'integer', 'min:0'],
            'details.student_number'  => ['nullable', 'integer', 'min:0'],
            'details.language'        => ['nullable', 'string', 'max:50'],
            'details.has_certificate' => ['required', 'boolean'],
            'details.options'         => ['nullable', 'array'],
            'details.course_objective'=> ['nullable', 'string', 'max:255'],
            'details.illustration_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048']
        ];
    }

    public function prepareForValidation()
    {
        // Convertir les strings en booleans si nécessaire
        if ($this->has('certificate')) {
            $this->merge([
                'details.has_certificate' => $this->boolean('details.has_certificate')
            ]);
        }
    }
}
