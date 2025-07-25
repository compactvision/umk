<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelDetails extends Model
{
    //
    protected $fillable = [

    ];
    /**
     * Relation avec le niveau
     */
    public function level()
    {
        return $this->belongsTo(Level::class);
    }

}
