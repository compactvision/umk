<?php

namespace App\Modules\Seo\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Seo\Application\Audience;
use App\Modules\Seo\Application\PublicCatalog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AudienceController extends Controller
{
    public function __invoke(Request $request, Audience $audience, PublicCatalog $catalog)
    {
        $data = $request->validate(['event' => ['required', Rule::in(['page_view', 'course_view', 'admission_start', 'source_direct', 'source_search', 'source_social', 'source_referral'])], 'path' => ['required', Rule::in(array_keys($catalog->entries()))]]);
        $audience->record($data['event'], $data['path']);

        return response()->noContent();
    }
}
