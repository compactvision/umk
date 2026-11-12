<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicEnrollment;
use App\Models\User;
use App\Modules\Identity\Application\Services\RevokeCredentials;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class StudentAccountController extends Controller
{
    public function update(Request $request, AcademicEnrollment $academic, RevokeCredentials $credentials)
    {
        Gate::authorize('manageAccount', $academic->profile);
        $data = $request->validate([
            'action' => 'required|in:revoke,verify',
            'reason' => 'required|string|min:10|max:1000',
        ]);
        DB::transaction(function () use ($academic, $credentials, $data, $request) {
            $user = User::lockForUpdate()->findOrFail($academic->profile->user_id);
            if ($data['action'] === 'revoke') {
                // Other session stores cannot enumerate a user's sessions reliably.
                abort_unless(config('session.driver') === 'database', 422, 'La révocation nécessite le stockage des sessions en base de données.');
                $credentials->execute($user);
            } else {
                abort_if($user->hasVerifiedEmail(), 422, 'Cette adresse est déjà vérifiée.');
                DB::afterCommit(fn () => $user->sendEmailVerificationNotification());
            }
            Audit::record($request->user()->id, 'student_account_'.$data['action'], $academic->profile, $data['reason']);
        });

        return back(303)->with('success', 'Action de sécurité enregistrée.');
    }
}
