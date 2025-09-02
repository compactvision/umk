<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentDocuments extends Model
{
    //
    use HasFactory;

    protected $fillable = ['enrollment_id','type','disk','path','original_name','size','mime'];
}
