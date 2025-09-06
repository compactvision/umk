<?php

namespace App\Modules\AcademicYear\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|unique:academic_years,title,' . $this->route('id'),
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => "Le titre est obligatoire.",
            'title.unique'   => "Cette année académique existe déjà.",
            'end_date.after' => "La date de fin doit être après la date de début.",
        ];
    }
}