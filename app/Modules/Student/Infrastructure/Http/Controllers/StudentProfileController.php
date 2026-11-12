<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentProfile;
use App\Modules\Identity\Application\Services\RevokeCredentials;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Student\Infrastructure\Http\Requests\UpdateStudentProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class StudentProfileController extends Controller
{
    public function __construct(private StudentPortalController $portal) {}

    public function update(UpdateStudentProfileRequest $request)
    {
        $entry = $this->portal->context($request);
        $data = $request->validated();
        $newPhoto = null;
        try {
            if ($request->hasFile('photo')) {
                $newPhoto = $request->file('photo')->store('student-profiles/'.$entry->student_profile_id, 'local');
            }
            $emailChanged = false;
            DB::transaction(function () use ($request, $entry, $data, $newPhoto, &$emailChanged) {
                $profile = $entry->profile->newQuery()->lockForUpdate()->findOrFail($entry->student_profile_id);
                $user = $request->user()->newQuery()->lockForUpdate()->findOrFail($request->user()->id);
                $emailChanged = $user->email !== $data['email'];
                $oldPhoto = $profile->photo_path;
                $user->fill(Arr::only($data, ['first_name', 'last_name', 'post_name', 'gender', 'email']));
                if ($emailChanged) {
                    if (! Hash::check($data['email_current_password'] ?? '', $user->password)) {
                        throw ValidationException::withMessages(['email_current_password' => 'Le mot de passe actuel est incorrect.']);
                    }
                    $user->email_verified_at = null;
                    app(RevokeCredentials::class)->execute($user, $request->session()->getId());
                }
                $user->save();
                $profile->personal_details = array_merge($profile->personal_details ?? [], Arr::only($data, config('student_profile.detail_fields')));
                if (($profile->personal_details['province'] ?? null) !== 'other') {
                    $profile->personal_details = array_merge($profile->personal_details, ['other_province' => null]);
                }
                if (($profile->personal_details['diploma_type'] ?? null) !== 'other') {
                    $profile->personal_details = array_merge($profile->personal_details, ['other_diploma' => null]);
                }
                if ($newPhoto || ($data['remove_photo'] ?? false)) {
                    $profile->photo_path = $newPhoto;
                    $profile->photo_mime = $newPhoto ? $request->file('photo')->getMimeType() : null;
                }
                $profile->save();
                Audit::record($user->id, 'student_profile_updated', $profile, 'Mise à jour personnelle.', ['fields' => array_keys(Arr::except($data, ['email_current_password', 'photo']))]);
                DB::afterCommit(function () use ($oldPhoto, $profile, $emailChanged, $user) {
                    if ($oldPhoto && $oldPhoto !== $profile->photo_path) {
                        Storage::disk('local')->delete($oldPhoto);
                    }
                    if ($emailChanged) {
                        $user->sendEmailVerificationNotification();
                    }
                });
            });
        } catch (\Throwable $exception) {
            if ($newPhoto && $entry->profile->fresh()->photo_path !== $newPhoto) {
                Storage::disk('local')->delete($newPhoto);
            }
            throw $exception;
        }

        return $emailChanged ? redirect()->route('verification.notice')->with('success', 'Profil enregistré. Vérifiez votre nouvelle adresse email pour continuer.') : back(303)->with('success', 'Votre profil a été enregistré avec succès.');
    }

    public function photo(Request $request)
    {
        return $this->profilePhoto($this->portal->context($request)->profile);
    }

    public function directoryPhoto(Request $request, AcademicEnrollment $academic)
    {
        abort_unless($request->user()->canAny(['manage academic access', 'manage academic finance', 'publish academic content']), 403);

        return $this->profilePhoto($academic->profile);
    }

    private function profilePhoto(StudentProfile $profile)
    {
        abort_unless($profile->photo_path && Storage::disk('local')->exists($profile->photo_path), 404);

        return Storage::disk('local')->response($profile->photo_path, null, ['Content-Type' => $profile->photo_mime, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function password(Request $request)
    {
        $this->portal->context($request);
        $data = $request->validateWithBag('studentPassword', ['current_password' => ['required', 'current_password'], 'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()]]);
        DB::transaction(function () use ($request, $data) {
            $user = $request->user()->newQuery()->lockForUpdate()->findOrFail($request->user()->id);
            if (! Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages(['current_password' => 'Le mot de passe actuel est incorrect.'])->errorBag('studentPassword');
            }
            $user->forceFill(['password' => Hash::make($data['password'])]);
            app(RevokeCredentials::class)->execute($user, $request->session()->getId());
            Audit::record($user->id, 'student_password_updated', $user, 'Changement depuis le profil étudiant.');
        });
        $request->user()->refresh();
        $request->session()->regenerate();

        return back(303)->with('success', 'Votre mot de passe a été modifié.');
    }
}
