<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LevelDetail extends Model
{
    protected $fillable = [
        'level_id',
        'price',
        'price_foreign',
        'price_national_first',
        'price_national_second',
        'price_foreign_first',
        'price_foreign_second',
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
        'price' => 'decimal:2', 'price_foreign' => 'decimal:2',
        'price_national_first' => 'decimal:2', 'price_national_second' => 'decimal:2',
        'price_foreign_first' => 'decimal:2', 'price_foreign_second' => 'decimal:2',
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