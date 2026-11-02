<?php

namespace App\Models\Seo;

use Illuminate\Database\Eloquent\Model;

class SeoSetting extends Model
{
    protected $fillable = ['values'];

    protected $casts = ['values' => 'array'];
}
