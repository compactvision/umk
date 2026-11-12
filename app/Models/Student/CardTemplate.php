<?php

namespace App\Models\Student;

use Illuminate\Database\Eloquent\Model;

class CardTemplate extends Model
{
    protected $table = 'student_card_templates';

    protected $fillable = ['name', 'institution', 'heading', 'color', 'back_text'];
}
