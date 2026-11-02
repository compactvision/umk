<?php

namespace App\Models\Seo;

use Illuminate\Database\Eloquent\Model;

class SeoPage extends Model
{
    protected $fillable = ['path', 'title', 'description', 'image', 'canonical_path', 'indexable'];

    protected $casts = ['indexable' => 'boolean'];
}
