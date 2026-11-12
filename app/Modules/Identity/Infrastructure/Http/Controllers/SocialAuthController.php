<?php

namespace App\Modules\Identity\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Identity\Application\UseCases\SocialLogin;
use App\Modules\Identity\Infrastructure\Services\SocialiteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SocialAuthController extends Controller
{
    public function redirect(string $provider, SocialiteService $service)
    {
        return $service->redirect($provider);
    }

    public function callback(Request $request, string $provider, SocialiteService $service, SocialLogin $useCase)
    {
        $socialUser = $service->user($provider);
        $user = $useCase->execute($provider, $socialUser);

        Auth::loginUsingId($user->id());
        $request->session()->regenerate();
        Inertia::flash('dashboardArrival', true);

        return redirect()->route('dashboard.index');
    }
}
