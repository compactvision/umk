<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StartNavigationSession extends StartSession
{
    public function handle($request, Closure $next)
    {
        return parent::handle($request, function (Request $request) use ($next) {
            $response = $next($request);
            $request->attributes->set(self::class, $response instanceof StreamedResponse || $response instanceof BinaryFileResponse);

            return $response;
        });
    }

    protected function storeCurrentUrl(Request $request, $session)
    {
        if (! $request->attributes->getBoolean(self::class)) {
            parent::storeCurrentUrl($request, $session);
        }
    }
}
