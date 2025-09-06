<?php

namespace App\Modules\Level\Infrastructure\Http\Requests;

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
        return [
            //
            'faculty_id'   => 'required|exists:faculties,id',
            'title'        => 'required|string|max:255',
            'code'         => 'required|string|max:10',
            'image'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'tag'          => 'nullable|string|max:50',
            'description'  => 'nullable|string',
            'is_active'    => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'faculty_id.required' => 'La faculté est requise',
            'faculty_id.exists' => 'La faculté n\'existe pas',
            'title.required' => 'Le nom du niveau est obligatoire.',
            'code.required' => 'Le code du niveau est obligatoire.',
            'code.unique' => 'Le code du niveau existe déjà.',
            'image.image' => 'L\'image doit être une image.',
            'image.max' => 'L\'image doit peser moins de 3 Mo.',
        ];
    }
}
