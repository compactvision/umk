<?php

namespace App\Modules\Enrollment\Interfaces\Http\Requests;


use Illuminate\Foundation\Http\FormRequest;


class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'max:80'],
            'file' => ['required', 'file', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:20480'],
        ];
    }
}
