<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\CardIssuance;
use App\Models\Student\CardTemplate;
use App\Models\Student\OfficialDocument;
use App\Models\Student\OfficialDocumentType;
use App\Models\Student\StudentProfile;
use App\Modules\Documents\Application\DocumentAccess;
use App\Modules\Student\Application\Services\AcademicStaffScope;
use App\Modules\Student\Application\Services\CardEligibility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CardIssuanceController
{
    private const PREFIX = 'dashboard.admin.card-issuance.';

    public function __construct(private CardEligibility $eligibility) {}

    public function printing(Request $request): Response
    {
        $data = $request->validate(['after' => 'nullable|integer|min:1', 'q' => 'nullable|string|max:100']);
        $after = (int) ($data['after'] ?? 0);
        $term = $data['q'] ?? '';
        $query = AcademicStaffScope::apply($this->eligibility->query(), $request->user())
            ->where('academic_enrollments.id', '>', $after)
            ->where('enrollment_status', 'confirmed')
            ->whereHas('academicYear', fn ($year) => $year->where('status', 'open'))
            ->whereHas('profile', fn ($profile) => $profile->where('student_status', 'active')->whereNotNull('photo_path')
                ->whereHas('cardPhotoReviews', fn ($review) => $review->where('student_card_requests.status', 'approved')))
            ->doesntHave('cardIssuance');
        foreach (preg_split('/\s+/u', $term, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $part) {
            $query->where(fn ($search) => $search->where('matricule', 'like', "%{$part}%")
                ->orWhereHas('profile', fn ($profile) => $profile->where('matricule', 'like', "%{$part}%")
                    ->orWhereHas('user', fn ($user) => $user->where('first_name', 'like', "%{$part}%")
                        ->orWhere('last_name', 'like', "%{$part}%")->orWhere('post_name', 'like', "%{$part}%"))));
        }
        $entries = $query->lazyById(100)
            ->filter(fn (AcademicEnrollment $entry) => $this->ready($entry))
            ->take(21)->values()->collect();
        $rows = $entries->take(20)->map(fn (AcademicEnrollment $entry) => $this->identity($entry) + ['id' => $entry->id, 'level' => $entry->level?->title]);

        return Inertia::render('dashboard/cardIssuance/Printing', [
            'rows' => $rows,
            'term' => $term,
            'after' => $after,
            'next' => $entries->count() > 20 ? $rows->last()['id'] : null,
        ]);
    }

    public function preview(Request $request, AcademicEnrollment $enrollment): Response|RedirectResponse
    {
        $data = $request->validate(['template' => 'nullable|integer|exists:student_card_templates,id']);
        $entry = AcademicStaffScope::apply($this->eligibility->query(), $request->user())->findOrFail($enrollment->id);
        if ($this->usesOfficialCard($entry)) {
            if ($request->user()->canAny([DocumentAccess::MANAGE, DocumentAccess::APPROVE, DocumentAccess::ISSUE])) {
                return to_route('dashboard.admin.official-documents.index', ['academic' => $entry->id, 'kind' => 'card']);
            }

            return to_route(self::PREFIX.'printing')->withErrors(['card' => 'Ce dossier relève du service des cartes officielles.']);
        }
        if (! $this->ready($entry) || $entry->cardIssuance()->exists()) {
            return to_route(self::PREFIX.'printing')->withErrors(['card' => 'Ce dossier a déjà été imprimé ou n’est plus éligible.']);
        }

        $templates = CardTemplate::query()->orderBy('name')->orderBy('id')->get(['id', 'name', 'institution', 'heading', 'color', 'back_text']);
        $template = isset($data['template']) ? $templates->firstWhere('id', (int) $data['template']) : $templates->first();

        return Inertia::render('dashboard/cardIssuance/Preview', [
            'enrollment' => $entry->id,
            'identity' => $this->identity($entry) + [
                'faculty' => $entry->level?->faculty?->name ?? $entry->level?->title,
                'photo' => route('dashboard.admin.card-requests.photo', [$entry, 'v' => $entry->profile->cardPhotoVersion()]),
            ],
            'template' => $template,
            'templates' => $templates->map->only(['id', 'name']),
            'version' => $this->version($entry, $template),
        ]);
    }

    public function check(Request $request, AcademicEnrollment $enrollment): JsonResponse
    {
        $data = $this->validatePrint($request);
        $entry = AcademicStaffScope::apply($this->eligibility->query(), $request->user())->findOrFail($enrollment->id);
        $this->ensurePrintable($entry, $this->template($data), $data['version']);

        return response()->json(['ready' => true])->header('Cache-Control', 'no-store');
    }

    public function printed(Request $request, AcademicEnrollment $enrollment): RedirectResponse
    {
        $data = $this->validatePrint($request);

        DB::transaction(function () use ($request, $enrollment, $data) {
            $locked = AcademicStaffScope::apply(AcademicEnrollment::query(), $request->user())->lockForUpdate()->findOrFail($enrollment->id);
            StudentProfile::query()->lockForUpdate()->findOrFail($locked->student_profile_id);
            $entry = AcademicStaffScope::apply($this->eligibility->query(), $request->user())->findOrFail($locked->id);
            $template = $this->template($data);
            $this->ensurePrintable($entry, $template, $data['version']);

            CardIssuance::create($this->identity($entry) + [
                'academic_enrollment_id' => $entry->id,
                'template_name' => $template?->name ?? 'Modèle USK',
                'printed_at' => now(),
                'printed_by' => $request->user()->id,
            ]);
        });

        return to_route(self::PREFIX.'delivery')->with('success', 'Impression confirmée. Le badge attend son retrait.');
    }

    public function delivery(Request $request): Response
    {
        $filters = $request->validate(['status' => 'nullable|in:waiting,collected', 'q' => 'nullable|string|max:100']);
        $status = $filters['status'] ?? 'waiting';
        $term = $filters['q'] ?? '';
        $cards = CardIssuance::whereHas('enrollment', fn ($q) => AcademicStaffScope::apply($q, $request->user()))
            ->when($status === 'collected', fn ($q) => $q->whereNotNull('collected_at'), fn ($q) => $q->whereNull('collected_at')->whereNull('replaced_by_official_id'))
            ->when($term !== '', fn ($q) => $q->where(fn ($search) => $search->where('student_name', 'like', "%{$term}%")->orWhere('matricule', 'like', "%{$term}%")))
            ->latest($status === 'collected' ? 'collected_at' : 'printed_at')->orderByDesc('id')
            ->paginate(20)->withQueryString()
            ->through(fn (CardIssuance $card) => $card->only(['id', 'student_name', 'matricule', 'academic_year', 'printed_at', 'collected_at']));

        return Inertia::render('dashboard/cardIssuance/Delivery', [
            'cards' => $cards,
            'status' => $status,
            'term' => $term,
            'success' => session('success'),
        ]);
    }

    public function collect(Request $request, CardIssuance $issuance): RedirectResponse
    {
        DB::transaction(function () use ($request, $issuance) {
            $card = CardIssuance::whereHas('enrollment', fn ($q) => AcademicStaffScope::apply($q, $request->user()))->lockForUpdate()->findOrFail($issuance->id);
            if ($card->collected_at || $card->replaced_by_official_id) {
                throw ValidationException::withMessages(['card' => 'Le retrait de cette carte a déjà été confirmé.']);
            }

            $card->update(['collected_at' => now(), 'collected_by' => $request->user()->id]);
        });

        return back()->with('success', 'Retrait de la carte confirmé.');
    }

    private function validatePrint(Request $request): array
    {
        return $request->validate(['template' => 'nullable|integer|exists:student_card_templates,id', 'version' => 'required|string|size:64']);
    }

    private function template(array $data): ?CardTemplate
    {
        return isset($data['template']) ? CardTemplate::findOrFail($data['template']) : null;
    }

    private function ready(AcademicEnrollment $entry): bool
    {
        return $this->eligibility->summary($entry)['ready'] && Storage::disk('local')->exists($entry->profile->photo_path);
    }

    private function ensurePrintable(AcademicEnrollment $entry, ?CardTemplate $template, string $version): void
    {
        if ($this->usesOfficialCard($entry)) {
            throw ValidationException::withMessages(['card' => 'Ce dossier relève du service des cartes officielles.']);
        }
        if ($entry->cardIssuance()->exists()) {
            throw ValidationException::withMessages(['card' => 'Une impression a déjà été confirmée pour cette inscription.']);
        }
        if (! $this->ready($entry) || ! hash_equals($this->version($entry, $template), $version)) {
            throw ValidationException::withMessages(['card' => 'Le dossier n’est plus éligible ou la carte a changé. Rechargez l’aperçu.']);
        }
    }

    private function usesOfficialCard(AcademicEnrollment $entry): bool
    {
        return OfficialDocumentType::where('faculty_id', $entry->level->faculty_id)->where('kind', 'card')->where('active', true)->exists()
            || OfficialDocument::where('academic_enrollment_id', $entry->id)->whereHas('type', fn ($q) => $q->where('kind', 'card'))->exists();
    }

    private function version(AcademicEnrollment $entry, ?CardTemplate $template): string
    {
        return hash('sha256', serialize([
            $entry->id, $this->identity($entry), $entry->profile?->cardPhotoVersion(), $entry->level?->faculty?->name, $entry->level?->title,
            $template?->only(['id', 'name', 'institution', 'heading', 'color', 'back_text']),
        ]));
    }

    private function identity(AcademicEnrollment $entry): array
    {
        $user = $entry->profile?->user;

        return [
            'student_name' => implode(' ', array_filter([$user?->first_name, $user?->post_name, $user?->last_name])),
            'matricule' => $entry->matricule ?? $entry->profile?->matricule,
            'academic_year' => $entry->academicYear?->title,
        ];
    }
}
