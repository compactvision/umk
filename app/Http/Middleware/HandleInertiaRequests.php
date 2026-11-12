<?php

namespace App\Http\Middleware;

use App\Modules\Site\Application\UseCases\GetSiteInfo;
use App\Modules\Teaching\Application\Services\LearningAccess;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        private GetSiteInfo $getSiteInfo
    ) {}

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'flash' => fn () => ['success' => $request->session()->get('success')],
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'first_name' => $request->user()->first_name,
                    'last_name' => $request->user()->last_name,
                    'post_name' => $request->user()->post_name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->getRoleNames(),
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
                    'hasAcademicFacultyScope' => $request->user()->hasRole('admin') && $request->user()->academicFaculties()->exists(),
                ] : null,
            ],
            'site' => $this->getSiteInfo->execute(),
            'studentPortalActive' => fn () => $request->user()?->hasRole('student') && $request->user()->studentProfile()->exists(),
            'teachingProfileActive' => fn () => $request->user()?->hasRole('professor')
                && app(LearningAccess::class)->teacher($request->user()) !== null,
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'adminNotifications' => function () use ($request) {
                if (! $request->user()?->hasRole('admin') || ! $request->user()->can('manage academic access')) {
                    return null;
                }
                $query = $request->user()->notifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReplacement::class, \App\Notifications\AcademicScheduleNotice::class]);

                return [
                    'unread_count' => (clone $query)->whereNull('read_at')->count(),
                    'items' => $query->orderByRaw('read_at IS NOT NULL')->latest()->limit(15)->get()->map(fn ($notice) => [
                        'id' => $notice->id, 'reference' => $notice->data['reference'], 'student_name' => $notice->data['student_name'] ?? null,
                        'filename' => $notice->data['filename'] ?? '', 'version' => $notice->data['version'] ?? null,
                        'kind' => $notice->type === \App\Notifications\AcademicScheduleNotice::class ? 'schedule' : 'document', 'status' => $notice->data['status'] ?? null,
                        'created_at' => $notice->created_at->toISOString(), 'read_at' => $notice->read_at?->toISOString(),
                        'open_url' => route('dashboard.admin.notifications.open', $notice->id),
                    ]),
                ];
            },
            'studentNotifications' => function () use ($request) {
                if (! $request->user()) {
                    return null;
                }
                $query = $request->user()->notifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class, \App\Notifications\AcademicEnrollmentChanged::class, \App\Notifications\FinancialOperationNotice::class, \App\Notifications\AcademicScheduleNotice::class, \App\Notifications\LearningContentNotice::class, \App\Notifications\AcademicAssessmentNotice::class, \App\Notifications\OfficialResultNotice::class, \App\Notifications\OfficialDocumentNotice::class]);

                return [
                    'unread_count' => (clone $query)->whereNull('read_at')->count(),
                    'items' => $query->orderByRaw('read_at IS NOT NULL')->latest()->limit(15)->get()->map(fn ($notice) => [
                        'id' => $notice->id, 'reference' => $notice->data['reference'] ?? 'Inscription académique', 'filename' => $notice->data['filename'] ?? '',
                        'kind' => match ($notice->type) {
                            \App\Notifications\LearningContentNotice::class => 'learning',
                            \App\Notifications\AcademicAssessmentNotice::class => 'assessment',
                            \App\Notifications\OfficialResultNotice::class => 'results',
                            \App\Notifications\OfficialDocumentNotice::class => 'official_document',
                            \App\Notifications\AcademicScheduleNotice::class => 'schedule',
                            \App\Notifications\FinancialOperationNotice::class => 'finance',
                            \App\Notifications\AcademicEnrollmentChanged::class => 'enrollment',
                            \App\Notifications\StudentAdmissionActivated::class => 'admission',
                            default => 'document',
                        },
                        'status' => $notice->data['status'] ?? null, 'version' => $notice->data['version'] ?? null, 'verdict' => $notice->data['verdict'] ?? null, 'comment' => $notice->data['comment'] ?? null,
                        'created_at' => $notice->created_at->toISOString(), 'read_at' => $notice->read_at?->toISOString(),
                        'open_url' => route('dashboard.notifications.open', $notice->id),
                    ]),
                ];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
