<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Level extends Model
{
    use HasFactory;
    //
    protected $table = 'levels';


    protected $fillable = [
        'faculty_id',
        'level_code',
        'level_name',
        'description',
        'duration_years',
        'student_number',
        'credit_required',
        'courses_number',
        'is_active',
        'image',
    ];


    /**
     * Relation avec la faculté
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Scope pour filtrer par code de niveau
     */
    public function scopeByCode($query, string $code)
    {
        return $query->where('level_code', $code);
    }

    /**
     * Scope pour les niveaux de licence
     */
    public function scopeLicence($query)
    {
        return $query->where('level_code', 'LIKE', 'L%');
    }

    /**
     * Scope pour les niveaux de master
     */
    public function scopeMaster($query)
    {
        return $query->where('level_code', 'LIKE', 'M%');
    }

    public function getImageUrlAttribute(): string
    {
        return $this->image
            ? asset('storage/' . $this->image)
            : asset('images/default-level.png');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }
}
