<?php

namespace App\Http\Requests\Level;

use Illuminate\Foundation\Http\FormRequest;

class StoreLevelRequest extends FormRequest
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
            'faculty_id' => 'required',
            'level_name' => 'required|string',
            'level_code_id' => 'required|exists:level_codes,id',
            'description' => 'nullable|string',
            'image' => 'required|image|max:3020'
        ];
    }

    public function messages()
    {
        return [
          'name.required' => 'Le nom du niveau est obligatoire.',
          'level_code_id.required' => 'Le code du niveau est obligatoire.',
          'level_code_id.exists' => 'Le code du niveau n\'existe pas.',
          'image.required' => 'L\'image est obligatoire.',
          'image.image' => 'L\'image doit être une image.',
          'image.max' => 'L\'image doit peser moins de 3 Mo.',
        ];
    }
}
