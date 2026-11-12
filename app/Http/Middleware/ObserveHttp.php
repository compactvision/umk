<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class ObserveHttp
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('operations.http_log')) {
            return $next($request);
        }

        $id = (string) Str::uuid();
        $started = hrtime(true);
        $response = $next($request);
        $response->headers->set('X-Request-ID', $id);
        $duration = (int) ((hrtime(true) - $started) / 1_000_000);
        $status = $response->getStatusCode();
        if ($status >= 500 || $duration >= config('operations.http_slow_ms')) {
            try {
                Log::warning('http.request.threshold', [
                    'request_id' => $id,
                    'route' => $request->route()?->getName() ?? 'unnamed',
                    'status' => $status,
                    'duration_ms' => $duration,
                ]);
            } catch (Throwable) {
                // An unavailable log sink must not change the result of a committed request.
            }
        }

        return $response;
    }
}
