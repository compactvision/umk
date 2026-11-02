<?php

namespace App\Modules\Seo\Application;

use Illuminate\Support\Facades\DB;

class Audience
{
    public function record(string $event, string $path): bool
    {
        try {
            if (! (app(SeoRepository::class)->settings()['analytics_enabled'] ?? false) || request()->cookie('usk_audience') !== 'accepted') {
                return false;
            }
            // Daily aggregates only: no account, IP, user agent, query string, or identifier.
            $key = ['day' => now('Africa/Kinshasa')->toDateString(), 'event' => $event, 'path' => $path];
            DB::table('seo_event_counts')->insertOrIgnore($key + ['total' => 0]);
            DB::table('seo_event_counts')->where($key)->increment('total');

            return true;
        } catch (\Illuminate\Database\QueryException $exception) {
            report($exception);

            return false; // An optional counter must never interrupt an enrollment.
        }
    }
}
