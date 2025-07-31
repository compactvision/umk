<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelDetails extends Model
{
    //
    protected $fillable = [
        'level_id',
        'price',
        'has_certificate',
        'language',
        'duration_months',
        'courses_number',
        'illustration_image',
        'course_objective',
        'options',
    ];
    /**
     * Relation avec le niveau
     */
    public function level()
    {
        return $this->belongsTo(Level::class);
    }

}
