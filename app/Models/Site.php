<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $fillable = [
        'site_name',
        'site_tagline',
        'contact_email',
        'contact_phone',
        'address',
        'logo_url',
        'favicon_url',
        'social_links',
        'description',
    ];

    protected $casts = [
        'social_links' => 'array',
    ];
}
