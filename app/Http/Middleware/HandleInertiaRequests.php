<?php

namespace App\Http\Middleware;

use App\Modules\Site\Application\UseCases\GetSiteInfo;
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
                ] : null,
            ],
            'site' => $this->getSiteInfo->execute(),
            'studentPortalActive' => fn () => $request->user()?->hasRole('student') && $request->user()->studentProfile()->exists(),
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'adminNotifications' => function () use ($request) {
                if (! $request->user()?->hasRole('admin')) {
                    return null;
                }
                $query = $request->user()->notifications()->where('type', \App\Notifications\EnrollmentDocumentReplacement::class);

                return [
                    'unread_count' => (clone $query)->whereNull('read_at')->count(),
                    'items' => $query->orderByRaw('read_at IS NOT NULL')->latest()->limit(15)->get()->map(fn ($notice) => [
                        'id' => $notice->id, 'reference' => $notice->data['reference'], 'student_name' => $notice->data['student_name'],
                        'filename' => $notice->data['filename'], 'version' => $notice->data['version'],
                        'created_at' => $notice->created_at->toISOString(), 'read_at' => $notice->read_at?->toISOString(),
                        'open_url' => route('dashboard.admin.notifications.open', $notice->id),
                    ]),
                ];
            },
            'studentNotifications' => function () use ($request) {
                if (! $request->user()) {
                    return null;
                }
                $query = $request->user()->notifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class]);

                return [
                    'unread_count' => (clone $query)->whereNull('read_at')->count(),
                    'items' => $query->orderByRaw('read_at IS NOT NULL')->latest()->limit(15)->get()->map(fn ($notice) => [
                        'id' => $notice->id, 'reference' => $notice->data['reference'], 'filename' => $notice->data['filename'] ?? '',
                        'kind' => $notice->type === \App\Notifications\StudentAdmissionActivated::class ? 'admission' : 'document',
                        'version' => $notice->data['version'] ?? null, 'verdict' => $notice->data['verdict'] ?? null, 'comment' => $notice->data['comment'] ?? null,
                        'created_at' => $notice->created_at->toISOString(), 'read_at' => $notice->read_at?->toISOString(),
                        'open_url' => route('dashboard.notifications.open', $notice->id),
                    ]),
                ];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
