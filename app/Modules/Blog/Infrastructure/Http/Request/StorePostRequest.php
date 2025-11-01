<?php

namespace App\Modules\Blog\Infrastructure\Http\Request;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['required','string','max:255'],
            'category_id'  => ['nullable','exists:categories,id'],
            'excerpt'      => ['nullable','string','max:300'],
            'content'      => ['nullable','string'],
            'read_time'    => ['nullable','string','max:50'],
            'gradient'     => ['nullable','string','max:255'],
            'featured'     => ['boolean'],
            'status'       => ['required','in:draft,published,archived'],
            'published_at' => ['nullable','date'],

            // uploads
            'main_image_1' => ['nullable','image','max:2048'],
            'main_image_2' => ['nullable','image','max:2048'],

            // galerie: [{file?, path?, alt?, caption?}]
            'gallery'      => ['nullable','array','max:20'],
            'gallery.*.file'    => ['nullable','image','max:2048'],
            'gallery.*.path'    => ['nullable','string'],
            'gallery.*.alt'     => ['nullable','string','max:255'],
            'gallery.*.caption' => ['nullable','string','max:255'],
        ];
    }
}
