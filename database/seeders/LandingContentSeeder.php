<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\User;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\CategoryModel;
use App\Modules\Blog\Infrastructure\Persistence\Eloquent\Models\PostModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LandingContentSeeder extends Seeder
{
    public function run(): void
    {
        // Use an existing editor; never create or change an account during content import.
        $author = User::role('admin')->orderBy('id')->first();
        if (! $author) {
            throw new \RuntimeException('Un administrateur existant est nécessaire pour importer les actualités.');
        }

        DB::transaction(function () use ($author) {
            $faculties = [
                ['name' => 'Médecine humaine', 'code' => 'MED', 'description' => 'Comprendre le vivant. Prendre soin de la vie.'],
                ['name' => 'Santé publique', 'code' => 'SP', 'description' => 'Agir pour la santé de nos communautés.'],
                ['name' => 'Sciences sociales, politiques et administratives', 'code' => 'SSPA', 'description' => 'Comprendre la société pour mieux la transformer.'],
                ['name' => 'Droit', 'code' => 'DR', 'description' => 'Défendre la justice. Faire avancer la société.'],
                ['name' => 'Théologie', 'code' => 'THEO', 'description' => 'Faire dialoguer la foi, le savoir et le monde.'],
            ];
            foreach ($faculties as $data) {
                // Recognize existing names such as “Faculté de Médecine” without overwriting them.
                $existing = Faculty::all()->first(function ($faculty) use ($data) {
                    $name = Str::lower(Str::ascii($faculty->name));
                    $expected = Str::lower(Str::ascii($data['name']));

                    return Str::upper($faculty->code) === $data['code']
                        || str_contains($name, $expected)
                        || ($data['code'] === 'MED' && str_contains($name, 'medecine'));
                });
                if (! $existing) {
                    // Duration is not specified on the landing: retain the configured Faculty model default.
                    Faculty::create($data + ['is_active' => true]);
                }
            }

            $posts = [
                [
                    'title' => 'La santé publique au cœur du débat',
                    'excerpt' => 'Une conférence scientifique consacrée à l’épidémie d’Ebola Bundibugyo en RDC.',
                    'content' => 'La Faculté de Santé Publique de l’Université Simon Kimbangu a organisé, le 23 juillet 2026, une conférence-débat consacrée à l’épidémie d’Ebola Bundibugyo en République démocratique du Congo. Retrouvez cette rencontre scientifique dans le reportage vidéo.',
                    'main_image_1' => 'https://universitesk.net/uploadsV/miniat/mini_6a64dc379f5840.62150198.jpg',
                    'video_url' => 'https://universitesk.net/uploadsV/videos/video_6a64dc37957947.53391178.mp4',
                    'published_at' => '2026-07-23 12:00:00',
                    'category' => 'Recherche & santé',
                ],
                [
                    'title' => 'Un campus qui se transforme',
                    'excerpt' => 'L’USK poursuit la modernisation de ses infrastructures académiques.',
                    'content' => 'L’Université Simon Kimbangu poursuit la modernisation de ses infrastructures académiques. Découvrez cette transformation et la vie du campus dans le reportage vidéo.',
                    'main_image_1' => '/assets/usk/campus.jpg',
                    'video_url' => 'https://universitesk.net/uploadsV/videos/video_6a5e28b8a25731.71853987.mp4',
                    'published_at' => '2026-05-20 12:00:00',
                    'category' => 'Vie universitaire',
                ],
                [
                    'title' => 'L’esprit USK, en images.',
                    'excerpt' => 'Des lieux, des visages et une même ambition : apprendre, transmettre et grandir ensemble.',
                    'content' => 'Découvrez la communauté universitaire Simon Kimbangu à travers les lieux, les visages et les rencontres qui font vivre son campus. Ce reportage photo rassemble quelques regards sur la vie académique et les moments partagés à l’université.',
                    'main_image_1' => '/assets/usk/students.jpg',
                    'gallery' => [
                        ['path' => '/assets/usk/campus.jpg', 'alt' => 'Le campus de l’USK'],
                        ['path' => '/assets/usk/academic.jpg', 'alt' => 'La vie académique'],
                        ['path' => '/assets/usk/ceremony.jpg', 'alt' => 'Les rencontres universitaires'],
                    ],
                    'category' => 'Regards sur le campus',
                    // No event date is asserted for this undated photo selection.
                    'published_at' => null,
                ],
            ];
            foreach ($posts as $data) {
                $slug = Str::slug($data['title']);
                if (PostModel::where('slug', $slug)->orWhere('title', $data['title'])->exists()) {
                    continue;
                }
                $category = CategoryModel::firstOrCreate(['slug' => Str::slug($data['category'])], ['name' => $data['category'], 'color' => '#073e32']);
                unset($data['category']);
                PostModel::create($data + [
                    'slug' => $slug, 'uuid' => (string) Str::uuid(), 'author_id' => $author->id,
                    'category_id' => $category->id, 'status' => 'published', 'featured' => true,
                ]);
            }
        });
    }
}
