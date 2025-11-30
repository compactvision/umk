<?php

namespace App\Modules\Site\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        // Decode socialLinks if it's a JSON string (from FormData)
        if ($this->has('socialLinks') && is_string($this->socialLinks)) {
            $this->merge([
                'socialLinks' => json_decode($this->socialLinks, true),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'siteName' => ['required', 'string', 'max:255'],
            'siteTagline' => ['nullable', 'string', 'max:255'],
            'contactEmail' => ['nullable', 'email', 'max:255'],
            'contactPhone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'logo' => ['nullable', 'file', 'image', 'max:2048'], // 2MB max
            'favicon' => ['nullable', 'file', 'image', 'max:512'], // 512KB max
            'logoUrl' => ['nullable', 'string', 'max:255'],
            'faviconUrl' => ['nullable', 'string', 'max:255'],
            'socialLinks' => ['nullable', 'array'],
            'socialLinks.facebook' => ['nullable', 'string', 'url'],
            'socialLinks.twitter' => ['nullable', 'string', 'url'],
            'socialLinks.linkedin' => ['nullable', 'string', 'url'],
            'description' => ['nullable', 'string'],
        ];
    }
}
