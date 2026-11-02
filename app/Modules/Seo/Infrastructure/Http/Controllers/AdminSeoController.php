<?php

namespace App\Modules\Seo\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Seo\LegalPage;
use App\Models\Seo\SeoPage;
use App\Models\Seo\SeoSetting;
use App\Modules\Seo\Application\PublicCatalog;
use App\Modules\Seo\Application\SeoRepository;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminSeoController extends Controller
{
    public function index(PublicCatalog $catalog, SeoRepository $repository)
    {
        $documents = [];
        foreach (config('seo.legal') as $key => $definition) {
            $document = LegalPage::firstOrCreate(['key' => $key], ['title' => $definition['title'], 'content' => config('legal_drafts.'.$key), 'status' => 'draft']);
            $documents[] = $document->only('key', 'title', 'content', 'status', 'approved_at');
        }

        return Inertia::render('dashboard/seo/Index', ['settings' => array_replace(['origin' => config('seo.origin') ?? '', 'indexable' => (bool) config('seo.indexable'), 'search_console' => config('seo.search_console') ?? '', 'analytics_enabled' => false], $repository->settings(), ['identity' => $repository->identity()]), 'catalog' => array_values($catalog->entries()), 'overrides' => SeoPage::all(), 'documents' => $documents, 'environment' => app()->environment(), 'audience' => \Illuminate\Support\Facades\DB::table('seo_event_counts')->where('day', '>=', now()->subDays(30)->toDateString())->select('event')->selectRaw('sum(total) as total')->groupBy('event')->get()]);
    }

    public function settings(Request $request)
    {
        $rules = ['analytics_enabled' => 'sometimes|boolean', 'origin' => ['nullable', 'url:https', 'max:200', function ($attribute, $value, $fail) {
            $url = parse_url($value);
            if (($url['path'] ?? '') !== '' || isset($url['query']) || isset($url['fragment']) || isset($url['user']) || isset($url['pass'])) {
                $fail('Indiquez seulement une origine HTTPS, sans chemin ni identifiants.');
            }
        }], 'indexable' => 'required|boolean', 'search_console' => ['nullable', 'string', 'max:200', 'regex:/^[a-zA-Z0-9_-]+$/'], 'identity' => ['required', 'array:'.implode(',', array_keys(config('seo.identity')))]];
        foreach (array_keys(config('seo.identity')) as $key) {
            $rules['identity.'.$key] = 'nullable|string|max:4000';
        }
        $rules['identity.email'] = 'required|email|max:200';
        $rules['identity.name'] = 'required|string|max:200';
        $rules['identity.phone'] = 'required|string|max:40';
        $rules['identity.country'] = ['required', 'string', 'regex:/^[A-Z]{2}$/'];
        $data = $request->validate($rules);
        if ($request->boolean('analytics_enabled') && LegalPage::whereIn('key', ['privacy', 'cookies'])->where('status', 'published')->whereNotNull('approved_at')->count() !== 2) {
            throw ValidationException::withMessages(['analytics_enabled' => 'Validez et publiez les politiques de confidentialité et des cookies avant d’activer la mesure facultative.']);
        }
        if ($request->boolean('indexable') && empty($data['origin'])) {
            throw ValidationException::withMessages(['origin' => 'Définissez le domaine HTTPS de production avant d’autoriser l’indexation.']);
        }
        $row = SeoSetting::firstOrNew();
        $row->values = array_replace($row->values ?? [], $data);
        $row->save();

        return back()->with('success', 'Paramètres enregistrés. En local, l’indexation reste bloquée.');
    }

    public function page(Request $request, PublicCatalog $catalog)
    {
        $paths = array_keys($catalog->entries());
        $data = $request->validate(['path' => ['required', Rule::in($paths)], 'title' => 'nullable|string|max:180', 'description' => 'nullable|string|max:300', 'image' => ['nullable', 'string', 'max:255', 'regex:#^/(?:assets|storage)/[a-zA-Z0-9_./-]+$#', 'not_regex:#\.\.#'], 'canonical_path' => ['nullable', Rule::in($paths)], 'indexable' => 'required|boolean']);
        SeoPage::updateOrCreate(['path' => $data['path']], $data);

        return back()->with('success', 'Métadonnées enregistrées.');
    }

    public function legal(Request $request, string $key, SeoRepository $repository)
    {
        abort_unless(array_key_exists($key, config('seo.legal')), 404);
        $data = $request->validate(['content' => 'required|string|max:100000', 'status' => ['required', Rule::in(['draft', 'published'])], 'approved' => 'sometimes|boolean']);
        $identity = $repository->identity();
        if ($data['status'] === 'published') {
            $required = array_keys(config('seo.identity'));
            $missing = array_filter($required, fn ($field) => empty(trim($identity[$field] ?? '')));
            if ($missing || ! $request->boolean('approved') || str_contains($data['content'], '[[')) {
                throw ValidationException::withMessages(['content' => 'Publication bloquée : complétez les informations officielles, remplacez les marqueurs [[...]] et confirmez l’approbation de la direction.']);
            }
        }
        LegalPage::updateOrCreate(['key' => $key], ['title' => config('seo.legal.'.$key.'.title'), 'content' => $data['content'], 'status' => $data['status'], 'approved_at' => $data['status'] === 'published' ? now() : null, 'approved_by' => $data['status'] === 'published' ? $request->user()->id : null]);

        return back()->with('success', $data['status'] === 'draft' ? 'Brouillon enregistré, sans publication.' : 'Document approuvé et publié.');
    }
}
