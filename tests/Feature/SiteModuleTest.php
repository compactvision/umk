<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SiteModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $this->actingAs($admin);
    }

    public function test_can_save_and_retrieve_site_info()
    {
        $data = [
            'siteName' => 'Académie Pro',
            'siteTagline' => 'La excellence dans l\'éducation professionnelle',
            'contactEmail' => 'contact@academie-pro.ma',
            'contactPhone' => '+212 5XX-XXXXXX',
            'address' => '123 Avenue de l\'Université, Agdal, Rabat, Maroc',
            'logoUrl' => 'https://via.placeholder.com/150x50.png?text=Mon+Logo',
            'faviconUrl' => 'https://via.placeholder.com/32x32.png?text=F',
            'socialLinks' => [
                'facebook' => 'https://facebook.com/academiepro',
                'twitter' => 'https://twitter.com/academiepro',
                'linkedin' => 'https://linkedin.com/company/academiepro',
            ],
            'description' => 'Best site ever',
        ];

        $response = $this->postJson('/api/site', $data);

        $response->assertStatus(200)
            ->assertJsonFragment($data);

        $this->assertDatabaseHas('sites', [
            'site_name' => 'Académie Pro',
            'contact_email' => 'contact@academie-pro.ma',
        ]);

        $response = $this->getJson('/api/site');

        $response->assertStatus(200)
            ->assertJsonFragment($data);
    }

    public function test_can_update_site_info()
    {
        $initialData = [
            'siteName' => 'Initial Site',
            'contactEmail' => 'initial@example.com',
        ];

        $this->postJson('/api/site', $initialData);

        $updatedData = [
            'siteName' => 'Updated Site',
            'contactEmail' => 'updated@example.com',
        ];

        $response = $this->putJson('/api/site', $updatedData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedData);

        $this->assertDatabaseHas('sites', [
            'site_name' => 'Updated Site',
            'contact_email' => 'updated@example.com',
        ]);
        $this->assertDatabaseMissing('sites', [
            'site_name' => 'Initial Site',
            'contact_email' => 'initial@example.com',
        ]);
    }

    public function test_can_upload_logo_and_favicon()
    {
        Storage::fake('public');

        $logo = UploadedFile::fake()->image('logo.png', 150, 50);
        $favicon = UploadedFile::fake()->image('favicon.png', 32, 32);

        $data = [
            'siteName' => 'Test Site',
            'logo' => $logo,
            'favicon' => $favicon,
        ];

        $response = $this->postJson('/api/site', $data);

        $response->assertStatus(200);

        // Verify files were stored
        Storage::disk('public')->assertExists('site/'.$logo->hashName());
        Storage::disk('public')->assertExists('site/'.$favicon->hashName());

        // Verify paths are in database
        $this->assertDatabaseHas('sites', [
            'site_name' => 'Test Site',
        ]);

        $site = Site::first();
        $this->assertStringContainsString('site/', $site->logo_url);
        $this->assertStringContainsString('site/', $site->favicon_url);
    }
}
