<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLevelDetailsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'level_id'        => ['required', 'exists:levels,id'],
            'price'           => ['nullable', 'numeric'],
            'has_certificate' => ['required', 'boolean'],
            'language'        => ['nullable', 'string', 'max:50'],
            'duration_years'  => ['required', 'integer'],
            'student_number'  => ['nullable', 'integer'],
            'credit_required' => ['nullable', 'integer'],
            'courses_number'  => ['nullable', 'integer'],
            'illustration_image' => ['nullable', 'image', 'max:2048', 'mimes:jpeg,jpg,png'],
            'course_objective'=> ['nullable', 'string'],
            'fees'            => ['nullable', 'integer'],
            'options'         => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'level_id.required' => 'Le niveau est obligatoire.',
            'price.numeric' => 'Le prix doit être un nombre.',
            'has_certificate.boolean' => 'Le statut de certificat doit être un booléen.',
            'language.max' => 'Le langage doit contenir au plus 50 caractères.',
            'duration_years.required' => 'L\'année de début est obligatoire.',
            'student_number.integer' => 'Le nombre d\'étudiants doit être un entier.',
            'credit_required.integer' => 'Le nombre de crédits requis doit être un entier.',
            'courses_number.integer' => 'Le nombre de cours doit être un entier.',
            'illustration_image.max' => 'L\'image doit peser moins de 2 Mo.',
            'illustration_image.mimes' => 'L\'image doit être au format JPEG, JPG, PNG.',
            'course_objective.max' => 'L\'objectif du cours doit contenir au plus 255 caractères.',
            'fees.integer' => 'Les frais doivent être un entier.',
            'options.array' => 'Les options doivent être un tableau.',
        ];
    }
}
