<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LevelDetail extends Model
{
    protected $fillable = [
        'level_id',
        'price',
        'has_certificate',
        'language',
        'duration_years',
        'student_number',
        'credit_required',
        'courses_number',
        'illustration_image',
        'course_objective',
        'fees',
        'options',
    ];

    protected $casts = [
        'has_certificate' => 'boolean',
        'options' => 'array', // JSON transformé en tableau
    ];

    /**
     * Le niveau auquel appartiennent ces détails.
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}