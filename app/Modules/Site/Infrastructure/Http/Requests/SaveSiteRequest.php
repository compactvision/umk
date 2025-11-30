<?php

namespace App\Modules\Site\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'siteName' => ['required', 'string', 'max:255'],
            'siteTagline' => ['nullable', 'string', 'max:255'],
            'contactEmail' => ['nullable', 'email', 'max:255'],
            'contactPhone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'logoUrl' => ['nullable', 'string', 'max:255'],
            'faviconUrl' => ['nullable', 'string', 'max:255'],
            'socialLinks' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
        ];
    }
}
