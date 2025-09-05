<?php

namespace App\Modules\Faculty\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $facultyId = $this->route('faculty'); // récupère l'id depuis la route

        return [
            'name'           => "required|string|max:255",
            'code'           => "required|string|max:10",
            'description'    => 'nullable|string|max:1000',
            'duration_years' => 'required|integer|min:1|max:10',
            'is_active'      => 'boolean',
        ];
    }
}
