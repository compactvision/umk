<?php

namespace App\Modules\Student\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('student') && $this->user()->studentProfile;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100', 'last_name' => 'required|string|max:100', 'post_name' => 'nullable|string|max:100',
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($this->user()->id)],
            'email_current_password' => [Rule::requiredIf(fn () => $this->input('email') !== $this->user()->email), 'nullable', 'current_password'],
            'birth_date' => 'nullable|date_format:Y-m-d|before_or_equal:'.today('Africa/Kinshasa')->toDateString(), 'birth_place' => 'nullable|string|max:150',
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed', 'other'])],
            'phone' => 'nullable|string|max:30|regex:/^[+0-9 () .-]+$/',
            'province' => ['nullable', Rule::in([...config('student_profile.provinces'), 'other'])],
            'other_province' => 'required_if:province,other|nullable|string|max:150',
            'territory' => 'nullable|string|max:150', 'sector' => 'nullable|string|max:150', 'residence_commune' => 'nullable|string|max:150',
            'home_address' => 'nullable|string|max:500', 'description' => 'nullable|string|max:2000',
            'emergency_name' => 'required_with:emergency_phone|nullable|string|max:150', 'emergency_relationship' => 'nullable|string|max:100',
            'emergency_phone' => 'required_with:emergency_name|nullable|string|max:30|regex:/^[+0-9 () .-]+$/', 'emergency_address' => 'nullable|string|max:500',
            'diploma_type' => ['nullable', Rule::in(['state_diploma', 'baccalaureate', 'other'])], 'other_diploma' => 'required_if:diploma_type,other|nullable|string|max:150',
            'diploma_number' => 'nullable|string|max:100', 'diploma_section' => 'nullable|string|max:150', 'diploma_school' => 'nullable|string|max:200',
            'diploma_year' => 'nullable|integer|min:1900|max:'.now('Africa/Kinshasa')->year,
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_photo' => 'sometimes|boolean',
            'curriculum_version_id' => 'prohibited', 'admission_cohort_id' => 'prohibited', 'academic_program_id' => 'prohibited', 'matricule' => 'prohibited', 'student_status' => 'prohibited', 'user_id' => 'prohibited', 'student_profile_id' => 'prohibited',
        ];
    }

    public function attributes(): array
    {
        return ['first_name' => 'prénom', 'last_name' => 'nom', 'post_name' => 'postnom', 'email' => 'adresse email', 'email_current_password' => 'mot de passe actuel', 'birth_date' => 'date de naissance', 'birth_place' => 'lieu de naissance', 'phone' => 'téléphone', 'other_province' => 'autre province', 'emergency_name' => 'nom du contact d’urgence', 'emergency_phone' => 'téléphone d’urgence', 'other_diploma' => 'autre diplôme', 'diploma_year' => 'année d’obtention', 'photo' => 'photo de profil'];
    }
}
