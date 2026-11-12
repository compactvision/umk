<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Classes extends Model
{
    //
    use HasFactory;

    protected $table = 'classes';
    protected $fillable = ['faculty_id','level_id','intake_id','section','capacity','status'];

    public function promotion(): BelongsTo { return $this->belongsTo(\App\Models\AcademicStructure\AcademicPromotion::class, 'academic_promotion_id'); }

    public function faculty(): BelongsTo { return $this->belongsTo(Faculty::class); }
    public function level(): BelongsTo { return $this->belongsTo(Level::class); }
    public function intake(): BelongsTo { return $this->belongsTo(Intake::class); }
    public function enrollments(): HasMany { return $this->hasMany(Enrollments::class, 'class_id'); }

    // Capacités restantes (ENROLLED strict)
    public function scopeWithRemaining($q){
        $q->withCount(['enrollments as enrolled_count' => function($s){
            $s->where('status','ENROLLED');
        }])->select('*')->selectRaw('CASE WHEN capacity IS NULL THEN NULL ELSE (capacity - (select count(*) from enrollments e where e.class_id = classes.id and e.status = \"ENROLLED\")) END as remaining');
    }
}
