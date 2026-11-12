<?php

namespace App\Modules\Teaching\Infrastructure\Http\Middleware;

use App\Models\Professor;
use Closure;
use Illuminate\Http\Request;

final class RequireProfessorPhoto
{
    public function handle(Request $request, Closure $next)
    {
        $professor = Professor::where('user_id', $request->user()->id)->where('is_active', true)->first();
        if ($professor && ! $professor->portraitDisk()) {
            if ($request->isMethodSafe()) {
                return to_route('dashboard.teaching.profile');
            }

            abort(403, 'Ajoutez une photo de profil pour accéder à l’espace enseignant.');
        }

        return $next($request);
    }
}
