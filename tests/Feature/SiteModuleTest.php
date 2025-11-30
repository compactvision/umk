<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteModuleTest extends TestCase
{
    use RefreshDatabase;

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
}
