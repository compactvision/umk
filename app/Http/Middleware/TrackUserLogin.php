<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class TrackUserLogin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $lastLoginKey = 'last_login_tracked_' . $user->id;
            
            // Vérifier si on a déjà tracké cette session
            if (!session()->has($lastLoginKey)) {
                $user->updateLoginInfo($request);
                session()->put($lastLoginKey, true);
            }
        }

        return $next($request);
    }
}
