<?php

namespace App\Models\AcademicStructure;

use App\Models\Faculty;
use App\Models\Site;
use Illuminate\Database\Eloquent\Model;

class University extends Model
{
    protected $fillable = ['context_key', 'code', 'name', 'acronym', 'site_id', 'is_active', 'revision'];

    protected $casts = ['is_active' => 'boolean', 'revision' => 'integer'];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function faculties()
    {
        return $this->hasMany(Faculty::class);
    }
}
