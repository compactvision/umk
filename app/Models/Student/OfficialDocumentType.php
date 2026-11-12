<?php

namespace App\Models\Student;

use App\Models\AcademicStructure\University;
use Illuminate\Database\Eloquent\Model;

final class OfficialDocumentType extends Model
{
    public const KINDS = ['enrollment', 'schooling', 'success', 'diploma', 'card'];

    protected $guarded = ['id'];

    protected $casts = ['policy' => 'array', 'active' => 'boolean'];

    public function university()
    {
        return $this->belongsTo(University::class);
    }

    public function templates()
    {
        return $this->hasMany(OfficialDocumentTemplate::class);
    }
}
