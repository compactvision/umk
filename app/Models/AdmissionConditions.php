<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmissionConditions extends Model
{
    //
    protected $fillable = [
        'faculty_id',
        'level_id',
        'title',
        'description'
    ];


}
