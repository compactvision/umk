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

    public function store(SaveSiteRequest $request)
    {
        return $this->save($request);
    }

    public function update(SaveSiteRequest $request, $id = null)
    {
        $quest = $this->save($request);
        return redirect()->back()->with('success', 'Site updated successfully');
    }

    private function save(SaveSiteRequest $request)
    {
        // Handle logo upload
        $logoUrl = $request->validated('logoUrl');
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('site', 'public');
            $logoUrl = $logoPath;
        }

        // Handle favicon upload
        $faviconUrl = $request->validated('faviconUrl');
        if ($request->hasFile('favicon')) {
            $faviconPath = $request->file('favicon')->store('site', 'public');
            $faviconUrl = $faviconPath;
        }

        $dto = new SiteDto(
            id: null, // ID is handled in repository for singleton logic
            siteName: $request->validated('siteName'),
            siteTagline: $request->validated('siteTagline'),
            contactEmail: $request->validated('contactEmail'),
            contactPhone: $request->validated('contactPhone'),
            address: $request->validated('address'),
            logoUrl: $logoUrl,
            faviconUrl: $faviconUrl,
            socialLinks: $request->validated('socialLinks'),
            description: $request->validated('description')
        );

        $site = $this->saveSiteInfo->execute($dto);

        return response()->json($site);
    }
}
