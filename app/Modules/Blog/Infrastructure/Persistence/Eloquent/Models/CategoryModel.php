<?php

namespace App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryModel extends Model
{
    protected $table = 'categories';
    protected $fillable = ['name','slug','color','description'];
}
