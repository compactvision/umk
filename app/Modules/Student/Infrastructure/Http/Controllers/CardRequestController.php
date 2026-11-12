<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\CardRequest;
use App\Models\Student\StudentProfile;
use App\Modules\Student\Application\Services\AcademicStaffScope;
use App\Modules\Student\Application\Services\CardEligibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CardRequestController
{
    public function index(Request $request, CardEligibility $eligibility): Response
    {
        $filters = $request->validate([
            'year' => 'nullable|integer|exists:academic_years,id',
            'q' => 'nullable|string|max:100',
        ]);
        $years = AcademicYear::orderByDesc('start_date')->orderByDesc('id')->get(['id', 'title']);
        $year = isset($filters['year']) ? (int) $filters['year'] : null;
        $term = $filters['q'] ?? '';
        $query = AcademicStaffScope::apply($eligibility->query(), $request->user())->when($year !== null, fn ($query) => $query->where('academic_year_id', $year));
        foreach (preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $part) {
            $query->where(fn (Builder $search) => $search->where('matricule', 'like', "%{$part}%")
                ->orWhereHas('profile', fn ($profile) => $profile->where('matricule', 'like', "%{$part}%")
                    ->orWhereHas('user', fn ($user) => $user->where('first_name', 'like', "%{$part}%")
                        ->orWhere('last_name', 'like', "%{$part}%")->orWhere('post_name', 'like', "%{$part}%"))));
        }
        $rows = $query->latest('academic_year_id')->orderBy('matricule')->orderBy('id')
            ->paginate(20)->appends(['year' => $year, 'q' => $term])
            ->through(function (AcademicEnrollment $entry) use ($eligibility) {
                $user = $entry->profile?->user;
                $version = $entry->profile?->cardPhotoVersion();

                return [
                    'id' => $entry->id,
                    'student' => implode(' ', array_filter([$user?->first_name, $user?->post_name, $user?->last_name])),
                    'matricule' => $entry->matricule ?? $entry->profile?->matricule,
                    'level' => $entry->level?->title,
                    'year' => $entry->academicYear?->title,
                    'photo' => $version ? [
                        'version' => $version,
                        'url' => route('dashboard.admin.card-requests.photo', [$entry, 'v' => $version]),
                    ] : null,
                ] + $eligibility->summary($entry);
            });

        return Inertia::render('dashboard/cardRequests/Index', compact('years', 'year', 'term', 'rows'));
    }

    public function photo(Request $request, AcademicEnrollment $enrollment): StreamedResponse
    {
        $profile = AcademicStaffScope::apply(AcademicEnrollment::query(), $request->user())->findOrFail($enrollment->id)->profile;
        abort_unless($profile?->photo_path && $request->query('v') === $profile->cardPhotoVersion()
            && Storage::disk('local')->exists($profile->photo_path), 404);

        return Storage::disk('local')->response($profile->photo_path, null, [
            'Content-Type' => $profile->photo_mime,
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function review(Request $request, AcademicEnrollment $enrollment): RedirectResponse
    {
        $data = $request->validate([
            'status' => 'required|in:approved,refused',
            'version' => 'required|string|size:64',
            'decision_note' => 'nullable|required_if:status,refused|string|max:500',
        ]);

        DB::transaction(function () use ($request, $enrollment, $data) {
            $entry = AcademicStaffScope::apply(AcademicEnrollment::query(), $request->user())->lockForUpdate()->findOrFail($enrollment->id);
            $profile = StudentProfile::query()->lockForUpdate()->findOrFail($entry->student_profile_id);
            if ($profile->cardPhotoVersion() !== $data['version'] || ! Storage::disk('local')->exists($profile->photo_path)) {
                throw ValidationException::withMessages(['photo' => 'La photo est indisponible ou a changé. Rechargez le dossier avant de décider.']);
            }
            if ($profile->cardPhotoReviews()->where('photo_version', $data['version'])->exists()) {
                throw ValidationException::withMessages(['status' => 'Cette photo a déjà été examinée.']);
            }
            $card = $entry->cardRequest()->first() ?? new CardRequest(['academic_enrollment_id' => $entry->id]);
            $card->fill([
                'status' => $data['status'],
                'photo_version' => $data['version'],
                'decision_note' => $data['decision_note'] ?? null,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ])->save();
        });

        return back();
    }
}
