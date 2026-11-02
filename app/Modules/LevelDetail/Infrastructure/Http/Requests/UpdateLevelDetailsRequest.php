<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLevelDetailsRequest extends FormRequest
{
    use ValidatesLevelInstallments;

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
            //
            'price_foreign' => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'level_id'               => ['nullable', 'exists:levels,id'],
            'price'          => ['nullable', 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'has_certificate'=> ['nullable'],
            'language'       => ['nullable', 'string', 'max:50'],
            'duration_years' => ['nullable', 'integer'],
            'student_number' => ['nullable', 'integer'],
            'credit_required'=> ['nullable', 'integer', 'min:0', function ($attribute, $value, $fail) {
                $detail = \App\Models\LevelDetail::find($this->route('id'));
                if ($detail) {
                    $used = (int) \App\Models\Courses::where('level_id', $detail->level_id)->sum('credits');
                    if ((int) $value < $used) $fail("Les cours totalisent déjà {$used} crédits. Le plafond ne peut pas être inférieur.");
                }
            }],
            'courses_number' => ['nullable', 'integer'],
            'illustration_image' => ['nullable'],
            'course_objective'=> ['nullable', 'string'],
            'fees'           => ['nullable', 'integer'],
            'options'        => ['nullable', 'array'],
        ] + $this->installmentRules();
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
