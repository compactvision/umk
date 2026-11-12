<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;
use LogicException;

final class ResourceVersion extends Model
{
    protected $table = 'academic_resource_versions';

    protected $fillable = ['academic_resource_id', 'number', 'snapshot', 'author_id', 'reason'];

    protected $hidden = ['snapshot'];

    protected $casts = ['number' => 'integer', 'snapshot' => 'array'];

    protected static function booted(): void
    {
        $immutable = fn () => throw new LogicException('Une version de support publiée dans l’historique est immuable.');
        self::updating($immutable);
        self::deleting($immutable);
    }
}
