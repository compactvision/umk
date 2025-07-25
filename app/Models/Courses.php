<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Courses extends Model
{
    //

    public function level()
    {
        return $this->belongsTo(Level::class);
    }
}
