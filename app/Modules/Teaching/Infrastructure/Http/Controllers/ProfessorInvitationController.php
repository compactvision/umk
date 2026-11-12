<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\Professor;
use App\Models\User;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

final class ProfessorInvitationController
{
    public static function canInvite(User $actor): bool
    {
        return $actor->hasRole('admin') && $actor->can('manage users') && ! $actor->academicFaculties()->exists();
    }

    public function send(Request $request, Professor $professor)
    {
        $this->deliver($professor, $request->user());

        return back()->with('success', 'Invitation envoyée par e-mail.');
    }

    public function deliver(Professor $professor, User $actor): void
    {
        abort_unless(self::canInvite($actor), 403);

        [$profile, $token] = DB::transaction(function () use ($professor) {
            $profile = Professor::lockForUpdate()->findOrFail($professor->id);
            if (! $profile->is_active || $profile->user_id || User::whereRaw('LOWER(email) = ?', [Str::lower($profile->email)])->exists()) {
                throw ValidationException::withMessages(['invitation' => 'L’invitation exige une fiche active et une adresse sans compte existant. Pour un compte enseignant existant, utilisez le rattachement.']);
            }

            $token = Str::random(64);
            $profile->forceFill(['invitation_hash' => hash('sha256', $token), 'invitation_expires_at' => now()->addDays(2)])->save();

            return [$profile, $token];
        }, 3);

        $url = route('professor-invitation.show', [$profile, $token]);
        try {
            Mail::raw("Bonjour {$profile->first_name},\n\nVous êtes invité à activer votre espace enseignant. Ouvrez ce lien valable 48 heures pour choisir votre mot de passe :\n{$url}", function ($message) use ($profile) {
                $message->to($profile->email)->subject('Invitation à votre espace enseignant');
            });
        } catch (TransportExceptionInterface $exception) {
            Professor::whereKey($profile->id)->where('invitation_hash', hash('sha256', $token))
                ->update(['invitation_hash' => null, 'invitation_expires_at' => null]);
            report($exception);
            throw ValidationException::withMessages(['invitation' => 'L’envoi de l’e-mail a échoué. Réessayez depuis la fiche de l’enseignant.']);
        }

        Audit::record($actor->id, 'professor_invitation_sent', $profile);
    }

    public function show(Professor $professor, string $token)
    {
        $valid = $this->valid($professor, $token);

        return Inertia::render('dashboard/auth/ActivateProfessor', [
            'invitation' => $valid ? [
                'name' => $professor->full_name,
                'email' => Str::lower($professor->email),
                'action' => route('professor-invitation.activate', [$professor, $token]),
            ] : null,
        ])->toResponse(request())->header('Cache-Control', 'no-store')->header('Referrer-Policy', 'no-referrer');
    }

    public function activate(Request $request, Professor $professor, string $token)
    {
        $data = $request->validate(['password' => ['required', 'confirmed', Password::min(8), function ($attribute, $value, $fail) {
            if (is_string($value) && strlen($value) > 72) {
                $fail('Le mot de passe est trop long.');
            }
        }]]);
        DB::transaction(function () use ($professor, $token, $data) {
            $profile = Professor::lockForUpdate()->findOrFail($professor->id);
            if (! $this->valid($profile, $token) || User::whereRaw('LOWER(email) = ?', [Str::lower($profile->email)])->exists()) {
                throw ValidationException::withMessages(['invitation' => 'Ce lien a expiré ou ne peut plus être utilisé. Contactez la scolarité.']);
            }

            $user = User::create([
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'email' => Str::lower($profile->email),
                'password' => $data['password'],
            ]);
            $user->markEmailAsVerified();
            $user->assignRole(Role::findOrCreate('professor', 'web'));
            $profile->forceFill(['user_id' => $user->id, 'invitation_hash' => null, 'invitation_expires_at' => null])->save();
            Audit::record($user->id, 'professor_invitation_activated', $profile);
        }, 3);

        return to_route('login')->with('success', 'Compte enseignant activé. Vous pouvez vous connecter.');
    }

    private function valid(Professor $professor, string $token): bool
    {
        return $professor->is_active && ! $professor->user_id && $professor->invitation_expires_at?->isFuture()
            && hash_equals($professor->invitation_hash ?? '', hash('sha256', $token));
    }
}
