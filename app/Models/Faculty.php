<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faculty extends Model
{
    use HasFactory;
    //
    protected $table = 'faculties';

    protected $fillable = [
        'name',
        'code',
        'description',
        'duration_years',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration_years' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $attributes = [
        'is_active' => true,
        'duration_years' => 4
    ];

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    public function scopeByCode(Builder $query, string $code): Builder
    {
        return $query->where('code', $code);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('code', 'LIKE', "%{$search}%")
                ->orWhere('description', 'LIKE', "%{$search}%");
        });
    }

    // Accesseurs
    public function getFormattedDurationAttribute(): string
    {
        return $this->duration_years . ' ' . str($this->duration_years > 1 ? 'années' : 'année')->value();
    }

    public function getStatusAttribute(): string
    {
        return $this->is_active ? 'Actif' : 'Inactif';
    }

    // Mutateurs
    public function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = strtoupper(trim($value));
    }

    public function setNameAttribute(string $value): void
    {
        $this->attributes['name'] = trim($value);
    }

    /**
     * Relation avec les niveaux
     */
    public function levels(): HasMany
    {
        return $this->hasMany(Level::class);
    }

    /**
     * Récupérer les niveaux ordonnés
     */
    public function orderedLevels(): HasMany
    {
        return $this->hasMany(Level::class)->orderBy('level_name');
    }
}
