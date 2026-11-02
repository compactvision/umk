<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->app->bind(\Inertia\Ssr\Gateway::class, \App\Modules\Seo\Application\PublicSsrGateway::class);
        if (config('seo.built_assets')) \Illuminate\Support\Facades\Vite::useHotFile(storage_path('framework/seo-build-only.hot'));
        \Illuminate\Auth\Notifications\VerifyEmail::toMailUsing(function ($recipient, string $url) {
            $minutes = (int) config('auth.verification.expire', 60);

            return \App\Mail\TransactionalEmail::notification([
                'subject' => 'USK — Confirmez votre adresse email',
                'preheader' => 'Une dernière étape pour activer votre espace à l’Université Simon Kimbangu.',
                'eyebrow' => 'VOTRE ESPACE UNIVERSITAIRE',
                'heading' => 'Bienvenue à l’USK.',
                'recipientName' => \App\Mail\TransactionalEmail::recipientName($recipient),
                'paragraphs' => ['Merci d’avoir créé votre espace à l’Université Simon Kimbangu. Confirmez votre adresse email pour poursuivre vos démarches en ligne.'],
                'actionUrl' => $url, 'actionLabel' => 'Confirmer mon adresse email',
                'noticeTitle' => 'Un lien personnel et temporaire',
                'notice' => "Ce lien est valable pendant {$minutes} minutes. Si vous n’êtes pas à l’origine de cette création de compte, vous pouvez ignorer cet email.",
                'signature' => 'Le service des inscriptions',
            ]);
        });

        \Illuminate\Auth\Notifications\ResetPassword::toMailUsing(function ($recipient, string $token) {
            $minutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);
            $url = url(route('password.reset', ['token' => $token, 'email' => $recipient->getEmailForPasswordReset()], false));

            return \App\Mail\TransactionalEmail::notification([
                'subject' => 'USK — Réinitialisez votre mot de passe',
                'preheader' => 'Un lien sécurisé pour retrouver l’accès à votre espace USK.',
                'eyebrow' => 'SÉCURITÉ DE VOTRE COMPTE',
                'heading' => 'Retrouvez votre espace.',
                'recipientName' => \App\Mail\TransactionalEmail::recipientName($recipient),
                'paragraphs' => ['Nous avons reçu une demande de réinitialisation du mot de passe de votre compte. Utilisez le bouton ci-dessous pour choisir un nouveau mot de passe.'],
                'actionUrl' => $url, 'actionLabel' => 'Choisir un nouveau mot de passe',
                'noticeTitle' => 'Vous n’avez pas fait cette demande ?',
                'notice' => "Vous pouvez ignorer cet email : votre mot de passe reste inchangé. Ce lien personnel expire dans {$minutes} minutes. Ne le partagez avec personne.",
                'signature' => 'L’équipe de votre espace USK',
            ]);
        });
    }
}
