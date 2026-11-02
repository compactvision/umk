<?php

namespace App\Models\Seo;

use Illuminate\Database\Eloquent\Model;

class LegalPage extends Model
{
    protected $fillable = ['key', 'title', 'content', 'status', 'approved_at', 'approved_by'];

    protected $casts = ['approved_at' => 'datetime'];
}
