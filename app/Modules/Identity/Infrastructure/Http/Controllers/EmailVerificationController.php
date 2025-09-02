<?php

namespace App\Modules\Identity\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailVerificationController extends Controller
{
    /**
     * Affiche la page demandant à l'utilisateur de vérifier son email.
     */
    public function notice()
    {
        return Inertia::render('dashboard/auth/VerifyEmail');
    }

    /**
     * Quand l’utilisateur clique sur le lien dans l’email.
     */
    public function verify(EmailVerificationRequest $request)
    {
        $request->fulfill(); // marque l’email comme vérifié
        return redirect()->route('dashboard.index');
    }

    /**
     * Permet de renvoyer un nouvel email de vérification.
     */
    public function send(Request $request)
    {
        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
