<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_subscribe_to_newsletter()
    {
        $response = $this->postJson('/api/newsletter/subscribe', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['email', 'subscribed_at']
            ]);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'test@example.com',
            'is_active' => true,
        ]);
    }

    public function test_cannot_subscribe_with_invalid_email()
    {
        $response = $this->postJson('/api/newsletter/subscribe', [
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_resubscribe_after_unsubscribing()
    {
        // First subscription
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'test@example.com',
        ]);

        // Unsubscribe
        $this->postJson('/api/newsletter/unsubscribe', [
            'email' => 'test@example.com',
        ]);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'test@example.com',
            'is_active' => false,
        ]);

        // Resubscribe
        $response = $this->postJson('/api/newsletter/subscribe', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'test@example.com',
            'is_active' => true,
        ]);
    }

    public function test_can_unsubscribe_from_newsletter()
    {
        // Subscribe first
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'test@example.com',
        ]);

        // Unsubscribe
        $response = $this->postJson('/api/newsletter/unsubscribe', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Vous avez été désabonné de notre newsletter.',
            ]);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'test@example.com',
            'is_active' => false,
        ]);
    }

    public function test_unsubscribe_nonexistent_email_returns_404()
    {
        $response = $this->postJson('/api/newsletter/unsubscribe', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(404);
    }
}
