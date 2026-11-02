<?php

namespace Tests\Feature;

use App\Models\Seo\SeoSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoAudienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_audience_is_disabled_by_default_even_with_consent(): void
    {
        $this->withCredentials()->withUnencryptedCookie('usk_audience', 'accepted')->postJson('/analytics/events', ['event' => 'page_view', 'path' => '/'])->assertNoContent();
        $this->assertDatabaseCount('seo_event_counts', 0);
    }

    public function test_audience_requires_consent_and_only_stores_aggregates(): void
    {
        SeoSetting::create(['values' => ['analytics_enabled' => true]]);
        $this->postJson('/analytics/events', ['event' => 'page_view', 'path' => '/'])->assertNoContent();
        $this->assertDatabaseCount('seo_event_counts', 0);
        $this->withCredentials()->withUnencryptedCookie('usk_audience', 'refused')->postJson('/analytics/events', ['event' => 'page_view', 'path' => '/'])->assertNoContent();
        $this->assertDatabaseCount('seo_event_counts', 0);
        $this->withCredentials()->withUnencryptedCookie('usk_audience', 'accepted')->postJson('/analytics/events', ['event' => 'page_view', 'path' => '/'])->assertNoContent();
        $this->postJson('/analytics/events', ['event' => 'page_view', 'path' => '/'])->assertNoContent();
        $this->assertDatabaseHas('seo_event_counts', ['event' => 'page_view', 'path' => '/', 'total' => 2]);
        $this->assertDatabaseCount('seo_event_counts', 1);
    }

    public function test_query_strings_private_paths_and_arbitrary_events_are_rejected(): void
    {
        SeoSetting::create(['values' => ['analytics_enabled' => true]]);
        foreach (['/dashboard', '/?email=private@example.test', 'https://tracker.example'] as $path) {
            $this->postJson('/analytics/events', ['event' => 'page_view', 'path' => $path])->assertUnprocessable();
        }
        $this->postJson('/analytics/events', ['event' => 'private@example.test', 'path' => '/'])->assertUnprocessable();
        $this->assertDatabaseCount('seo_event_counts', 0);
    }
}
