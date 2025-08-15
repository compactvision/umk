<?php

namespace App\Http\Requests\Level;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLevelRequest extends FormRequest
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
        $levelId  = $this->route('level')->id;
        return [
            //
            'level_name' => ['required', 'string'],
            'level_code_id' => ['required', Rule::exists('level_codes', 'id')->where('id', '!=', $levelId)],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:3020'],
            'faculty_id' => ['required', Rule::exists('faculties', 'id')->where('id', '!=', $levelId)],
            'tag' => ['nullable', 'string'],
        ];
    }

    public function messages()
    {
        return [
            'level_name.required' => 'Le nom du niveau est requis',
            'level_code_id.required' => 'Le code du niveau est requis',
            'description.string' => 'La description doit être une chaîne de caractères',
            'image.image' => 'Le fichier doit être une image',
            'image.max' => 'La taille de l\'image ne peut pas excéder 3020 kilobytes',
            'faculty_id.required' => 'La faculté est requise',
            'faculty_id.exists' => 'La faculté n\'existe pas',
            'tag.string' => 'Le tag doit être une chaîne de caractères',
        ];
    }
}
