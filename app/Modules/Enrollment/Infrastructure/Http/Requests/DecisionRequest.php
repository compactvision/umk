<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Requests;


use Illuminate\Foundation\Http\FormRequest;


class DecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:validated,rejected,pending_documents'],
            'notes' => ['nullable', 'string'],
            'requirements' => ['array'],
            'requirements.*.code' => ['required_with:requirements', 'string', 'max:80'],
            'requirements.*.message' => ['nullable', 'string'],
            'requirements.*.deadline_at' => ['nullable', 'date'],
        ];
    }
}
