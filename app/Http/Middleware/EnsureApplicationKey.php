<?php

namespace App\Http\Middleware;

use App\Support\ApplicationKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EnsureApplicationKey
{
    public function handle(Request $request, Closure $next)
    {
        if ($error = ApplicationKey::error()) {
            try {
                Log::critical('Configuration du chiffrement indisponible : '.$error);
            } catch (\Throwable $exception) {
                // A broken log destination must not prevent the controlled 503 response.
            }
            $message = 'Le service est temporairement indisponible. Veuillez réessayer plus tard.';
            $response = $request->expectsJson() ? response()->json(['message' => $message], 503) : response()->view('errors.503', [], 503);

            return $response->withHeaders(['Cache-Control' => 'no-store', 'X-Content-Type-Options' => 'nosniff', 'Retry-After' => '60', 'X-Robots-Tag' => 'noindex, nofollow']);
        }

        return $next($request);
    }
}
