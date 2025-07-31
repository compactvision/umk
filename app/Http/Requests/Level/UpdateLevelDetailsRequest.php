<?php

namespace App\Http\Requests\Level;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLevelDetailsRequest extends FormRequest
{
    public function authorize()
    {
        return true; // ou votre logique d'autorisation
    }

    public function rules()
    {
        return [
//            'level_name' => 'sometimes|required|string|max:255',
//            'level_code' => 'sometimes|required|string|max:10',
//            'description' => 'sometimes|nullable|string',
//            'image' => 'sometimes|nullable|string',
//            'credit_required' => 'sometimes|nullable|integer|min:0',
//            'duration_years' => 'sometimes|nullable|integer|min:1',
            'details.courses_number' => 'sometimes|nullable|integer|min:0',
            'details.price' => 'sometimes|nullable|numeric|min:0',
//            'language' => 'sometimes|nullable|string|max:100',
//            'certificate' => 'sometimes|boolean',
//            'options' => 'sometimes|nullable|string', // JSON string
        ];
    }

    public function prepareForValidation()
    {
        // Convertir les strings en booleans si nécessaire
//        if ($this->has('certificate')) {
//            $this->merge([
//                'certificate' => $this->boolean('certificate')
//            ]);
//        }
    }
}
