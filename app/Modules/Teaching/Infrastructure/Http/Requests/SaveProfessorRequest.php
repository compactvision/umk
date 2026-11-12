<?php

namespace App\Modules\Teaching\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProfessorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:255', Rule::unique('professors', 'email')->ignore($this->route('professor'))],
            'phone' => 'nullable|string|max:20',
            'speciality' => 'nullable|string|max:255',
            'biography' => 'nullable|string|max:5000',
            'is_active' => 'required|boolean',
            'send_invitation' => 'sometimes|boolean',
        ];
    }
}
