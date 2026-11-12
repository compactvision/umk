<?php

namespace App\Models\Student;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use LogicException;

final class OfficialDocumentTemplate extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['layout' => 'array', 'approved_at' => 'datetime', 'withdrawn_at' => 'datetime'];

    protected $hidden = ['layout'];

    protected static function booted(): void
    {
        self::updating(function (self $template) {
            if (array_diff(array_keys($template->getDirty()), ['approved_at', 'withdrawn_at', 'updated_at'])) {
                throw new LogicException('Une édition de modèle est immuable.');
            }
        });
        self::deleting(fn () => false);
    }

    public function type()
    {
        return $this->belongsTo(OfficialDocumentType::class, 'official_document_type_id');
    }

    public function signer()
    {
        return $this->belongsTo(User::class, 'signer_id');
    }
}
