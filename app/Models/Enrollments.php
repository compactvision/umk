<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollments extends Model
{
    //
    use HasFactory;

    protected $fillable = ['user_id','class_id','public_id','status','answers','submitted_at','decided_at'];
    protected $casts = [
        'answers' => 'array',
        'submitted_at' => 'datetime',
        'decided_at' => 'datetime',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function class(): BelongsTo { return $this->belongsTo(Classes::class, 'class_id'); }
    public function documents(): HasMany { return $this->hasMany(EnrollmentDocuments::class); }
}
