<?php

namespace App\Modules\AdmissionCondition\Infrastructure\Http\Requests;

use App\Models\Level;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class CreateAdmissionConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'faculty_id'  => 'required|exists:faculties,id',
            'level_id'    => ['required', 'integer', Rule::exists('levels', 'id')->where('faculty_id', $this->integer('faculty_id'))],
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'section'     => 'required|string|max:255',
            'is_required' => 'required|boolean',
        ];
    }

    protected function getRedirectUrl(): string
    {
        $levelId = $this->integer('level_id');
        if ($levelId > 0 && Level::whereKey($levelId)->exists()) {
            return route('dashboard.admin.levels.details.show', ['id' => $levelId, 'tab' => 'conditions']);
        }

        return parent::getRedirectUrl();
    }

    public function messages(): array   
    {
        return [
            'faculty_id.required'  => 'La faculté est obligatoire.',
            'level_id.required'    => 'Le niveau est obligatoire.',
            'title.required'       => 'Le titre est obligatoire.',
            'section.required'     => 'La section est obligatoire.',
            'is_required.required' => 'Le statut est obligatoire.',
        ];
    }
}
