<?php

namespace App\Http\Requests\Professor;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfessorRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:professors,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'in:M,F'],
            'birth_date' => ['nullable', 'date'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'],
            'faculty_id' => ['required', 'exists:faculties,id'],
            'level_id' => ['required', 'exists:levels,id'],
            'speciality' => ['nullable', 'string', 'max:255'],
            'biography' => ['nullable', 'string'],
            'hire_date' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required' => 'Le nom est obligatoire.',
            'email.required' => 'L\'email est obligatoire.',
            'email.email' => 'L\'email doit être une adresse email valide.',
            'email.unique' => 'L\'email est déjà utilisé.',
            'phone.string' => 'Le téléphone doit être une chaîne de caractères.',
            'phone.max' => 'Le téléphone ne peut contenir que 20 caractères.',
            'gender.in' => 'Le genre doit être M ou F.',
            'birth_date.date' => 'La date de naissance doit être une date valide.',
            'photo.image' => 'La photo doit être une image.',
            'photo.mimes' => 'La photo doit être une image.',
            'photo.max' => 'La photo ne peut contenir que 2048 caractères.',
            'faculty_id.exists' => 'Le faculty_id doit exister.',
            'level_id.exists' => 'Le level_id doit exister.',
            'speciality.string' => 'La spécialité doit être une chaîne de caractères.',
            'speciality.max' => 'La spécialité ne peut contenir que 255 caractères.',
            'biography.string' => 'La biographie doit être une chaîne de caractères.',
            'hire_date.date' => 'La date d\'embauche doit être une date valide.',
            'is_active.required' => 'Le statut est obligatoire.',
            'is_active.boolean' => 'Le statut doit être un booléen.',
        ];
    }
}
