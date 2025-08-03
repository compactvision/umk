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
        'duration_years',
        'credit_required',
        'student_number',
        'courses_number',
        'illustration_image',
        'course_objective',
        'options',
        'fees',
    ];

    protected $casts = [
        'options' => 'array',
        'has_certificate' => 'boolean'
    ];

    /**
     * Relation avec le niveau
     */
    public function level()
    {
        return $this->belongsTo(Level::class);
    }

}
