<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelCode extends Model
{
    //
    protected $table = 'level_codes';
    protected $fillable = ['code', 'name'];

    public function levels()
    {
        return $this->hasMany(Level::class);
    }

    public function professors()
    {
        return $this->belongsToMany(Professor::class, 'level_code_professor');
    }
}
