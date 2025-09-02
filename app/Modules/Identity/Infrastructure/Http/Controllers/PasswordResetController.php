<?php
namespace App\Modules\Identity\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Modules\Identity\Application\UseCases\RequestPasswordReset;
use App\Modules\Identity\Application\UseCases\ResetPassword;

class PasswordResetController extends Controller
{
    public function request()
    {
        return Inertia::render('dashboard/auth/ForgotPassword');
    }

    public function send(Request $request, RequestPasswordReset $useCase)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $useCase->execute($validated['email']);

        return back()->with('status', 'Un email de réinitialisation a été envoyé si l’adresse existe.');
    }

    public function form(string $token, Request $request)
    {
        return Inertia::render('dashboard/auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    public function reset(Request $request, ResetPassword $useCase)
    {
        $validated = $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $success = $useCase->execute(
            $validated['email'],
            $validated['password'],
            $validated['token']
        );

        return $success
            ? redirect()->route('dashboard.index')->with('status', 'Mot de passe réinitialisé.')
            : back()->withErrors(['email' => 'Le lien est invalide ou expiré.']);
    }
}
