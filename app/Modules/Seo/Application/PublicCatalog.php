<?php

namespace App\Modules\Seo\Application;

use App\Models\Faculty;
use App\Models\Level;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;

class PublicCatalog
{
    public function entries(): array
    {
        $entries = [];
        foreach (config('seo.pages') as $path => $page) {
            $entries[$path] = ['path' => $path, 'title' => $page['heading']];
        }
        foreach (Faculty::where('is_active', true)->get(['id', 'name', 'updated_at']) as $f) {
            $entries['/faculties/'.$f->id] = ['path' => '/faculties/'.$f->id, 'title' => $f->name, 'lastmod' => $f->updated_at?->toAtomString()];
        }
        foreach (Level::where('is_active', true)->whereHas('faculty', fn ($q) => $q->where('is_active', true))->get(['id', 'title', 'updated_at']) as $l) {
            $entries['/course/'.$l->id] = ['path' => '/course/'.$l->id, 'title' => $l->title, 'lastmod' => $l->updated_at?->toAtomString()];
        }
        foreach (PostModel::where('status', 'published')->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()))->get(['id', 'title']) as $post) {
            $entries['/blog/'.$post->id] = ['path' => '/blog/'.$post->id, 'title' => $post->title];
        }

        return $entries;
    }
}
