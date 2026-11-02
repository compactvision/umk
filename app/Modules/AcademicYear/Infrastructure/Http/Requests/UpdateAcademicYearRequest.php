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

    public function after(): array
    {
        return [function (\Illuminate\Validation\Validator $validator) {
            if ($validator->errors()->any()) return;
            $start = $this->date('start_date')->toDateString();
            $end = $this->date('end_date')->toDateString();
            $outside = \App\Models\Student\AcademicSemester::where('academic_year_id', $this->route('id'))
                ->where(fn ($q) => $q->whereDate('start_date', '<', $start)->orWhereDate('end_date', '>', $end))->exists();
            if ($outside) $validator->errors()->add('end_date', 'Les semestres existants doivent rester compris dans les dates de l’année académique.');
        }];
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