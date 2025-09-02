<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Intake extends Model
{
    //
    use HasFactory;
    protected $fillable = ['name','start_date','end_date'];

    public function classes(){ return $this->hasMany(Classes::class, 'intake_id'); }
}
