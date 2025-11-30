<?php

namespace App\Modules\Site\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Site\Application\DTOs\SiteDto;
use App\Modules\Site\Application\UseCases\GetSiteInfo;
use App\Modules\Site\Application\UseCases\SaveSiteInfo;
use App\Modules\Site\Infrastructure\Http\Requests\SaveSiteRequest;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function __construct(
        private GetSiteInfo $getSiteInfo,
        private SaveSiteInfo $saveSiteInfo
    ) {}

    public function index()
    {
        $site = $this->getSiteInfo->execute();
        return Inertia::render('dashboard/site/Index', [
            'site' => $site,
        ]);
    }

    public function show(): JsonResponse
    {
        $site = $this->getSiteInfo->execute();
        return response()->json($site);
    }

    public function store(SaveSiteRequest $request): JsonResponse
    {
        return $this->save($request);
    }

    public function update(SaveSiteRequest $request, $id = null): JsonResponse
    {
        return $this->save($request);
    }

    private function save(SaveSiteRequest $request): JsonResponse
    {
        $dto = new SiteDto(
            id: null, // ID is handled in repository for singleton logic
            siteName: $request->validated('siteName'),
            siteTagline: $request->validated('siteTagline'),
            contactEmail: $request->validated('contactEmail'),
            contactPhone: $request->validated('contactPhone'),
            address: $request->validated('address'),
            logoUrl: $request->validated('logoUrl'),
            faviconUrl: $request->validated('faviconUrl'),
            socialLinks: $request->validated('socialLinks'),
            description: $request->validated('description')
        );

        $site = $this->saveSiteInfo->execute($dto);

        return response()->json($site);
    }
}
