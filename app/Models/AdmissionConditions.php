<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionCondition extends Model
{
    protected $fillable = [
        'faculty_id',
        'level_id',
        'title',
        'description',
        'section',
        'is_required',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    /**
     * Lien vers la faculté (optionnel).
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Lien vers le niveau (optionnel).
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
