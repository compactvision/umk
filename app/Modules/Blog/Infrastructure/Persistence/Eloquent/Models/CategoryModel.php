<?php

namespace App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryModel extends Model
{
    protected $table = 'categories';
    protected $fillable = ['name','slug','color','description'];

    public function posts()
    {
        return $this->hasMany(PostModel::class, 'category_id', 'id');
    }
}
