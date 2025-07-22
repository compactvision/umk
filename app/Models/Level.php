<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Level extends Model
{
    //
    protected $table = 'levels';

    protected $fillable = [
        'faculty_id',
        'name',
        'slug',
        'year'
    ];


    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }
}
