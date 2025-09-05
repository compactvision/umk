<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = [
        'faculty_id',
        'title',
        'code',
        'description',
        'tag',
        'image',
        'is_active',
    ];

    /**
     * Détails du niveau (relation 1-1).
     */
    public function detail(): HasOne
    {
        return $this->hasOne(LevelDetail::class);
    }

    /**
     * Conditions d'admission pour ce niveau (relation 1-n).
     */
    public function admissionConditions(): HasMany
    {
        return $this->hasMany(AdmissionCondition::class);
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

}