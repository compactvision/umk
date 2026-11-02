<?php

namespace Database\Seeders;

use App\Models\Seo\LegalPage;
use Illuminate\Database\Seeder;

class LegalDraftSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('seo.legal') as $key => $definition) {
            LegalPage::firstOrCreate(['key' => $key], ['title' => $definition['title'], 'content' => config('legal_drafts.'.$key), 'status' => 'draft']);
        }
    }
}
