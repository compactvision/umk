<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

final class ContentSection extends Model
{
    protected $table = 'academic_content_sections';

    protected $fillable = ['academic_offering_id', 'title', 'position', 'revision'];

    protected $casts = ['position' => 'integer', 'revision' => 'integer'];

    public function offering()
    {
        return $this->belongsTo(AcademicOffering::class, 'academic_offering_id');
    }
}
