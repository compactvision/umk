<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Models\Professor;
use App\Modules\Student\Application\Services\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

final class ProfessorProfileController
{
    public function show(Request $request)
    {
        $profile = $this->ownedProfile($request);

        return Inertia::render('dashboard/teaching/Profile', [
            'name' => $profile->full_name,
            'photoUrl' => $profile->portraitUrl(),
        ]);
    }

    public function update(Request $request)
    {
        $profile = $this->ownedProfile($request);
        $data = $request->validate(['photo' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120', 'dimensions:max_width=5000,max_height=5000']]);
        $disk = Storage::disk('local');
        $path = $data['photo']->store('professor-portraits/'.$profile->id, 'local');
        if (! $path) {
            throw ValidationException::withMessages(['photo' => 'La photo n’a pas pu être enregistrée. Réessayez.']);
        }

        try {
            $previous = DB::transaction(function () use ($request, $profile, $path) {
                $locked = Professor::where('user_id', $request->user()->id)->where('is_active', true)->lockForUpdate()->findOrFail($profile->id);
                $previous = $locked->portraitDisk() === 'local' ? $locked->photo : null;
                $locked->update(['photo' => $path]);
                Audit::record($request->user()->id, 'professor_photo_updated', $locked);

                return $previous;
            }, 3);
        } catch (Throwable $exception) {
            $disk->delete($path);
            throw $exception;
        }

        if ($previous) {
            $disk->delete($previous);
        }

        return to_route('dashboard.teaching.index')->with('success', 'Photo de profil enregistrée.');
    }

    public function photo(Request $request, Professor $professor)
    {
        abort_unless($request->user()->hasRole('admin') || (int) $professor->user_id === $request->user()->id, 403);
        $disk = $professor->portraitDisk();
        abort_unless($disk && Storage::disk($disk)->exists($professor->photo), 404);
        $mime = Storage::disk($disk)->mimeType($professor->photo);
        abort_unless(in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true), 404);

        return Storage::disk($disk)->response($professor->photo, null, [
            'Content-Type' => $mime, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function ownedProfile(Request $request): Professor
    {
        return Professor::where('user_id', $request->user()->id)->where('is_active', true)->firstOrFail();
    }
}
