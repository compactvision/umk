<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Models\Student\CardTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CardTemplateController
{
    public function index(Request $request): Response
    {
        return Inertia::render('dashboard/cardTemplates/Index', [
            'templates' => CardTemplate::query()->orderBy('name')->orderBy('id')
                ->get(['id', 'name', 'institution', 'heading', 'color', 'back_text']),
            'selectedId' => $request->integer('template') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $template = CardTemplate::create($this->validateTemplate($request));

        return to_route('dashboard.admin.card-templates.index', ['template' => $template->id]);
    }

    public function update(Request $request, CardTemplate $cardTemplate): RedirectResponse
    {
        $cardTemplate->update($this->validateTemplate($request));

        return to_route('dashboard.admin.card-templates.index', ['template' => $cardTemplate->id]);
    }

    private function validateTemplate(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'institution' => ['required', 'string', 'max:100'],
            'heading' => ['required', 'string', 'max:60'],
            'color' => ['required', 'regex:/^#[0-9a-f]{6}$/iD'],
            'back_text' => ['nullable', 'string', 'max:220'],
        ], [], [
            'name' => 'nom du modèle',
            'institution' => 'établissement',
            'heading' => 'titre de la carte',
            'color' => 'couleur principale',
            'back_text' => 'texte au verso',
        ]);
    }
}
