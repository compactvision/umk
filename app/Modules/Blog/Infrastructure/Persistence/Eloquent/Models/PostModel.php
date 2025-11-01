<?php

namespace App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

class PostModel extends Model
{
    protected $table = 'posts';

    protected $fillable = [
        'uuid','category_id','author_id','title','slug','excerpt','content',
        'main_image_1','main_image_2','gallery',
        'read_time','gradient','featured','views','likes','comments_count',
        'status','published_at','seo_title','seo_description',
    ];

    protected $casts = [
        'gallery' => 'array',
        'featured' => 'bool',
        'published_at' => 'datetime',
    ];
}
