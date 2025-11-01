<?php

namespace App\Modules\Blog\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Blog\Application\DTO\CreateCategoryData;
use App\Modules\Blog\Application\Services\CreateCategoryService;
use App\Modules\Blog\Infrastructure\Http\Request\StoreCategoryRequest;
use Illuminate\Http\RedirectResponse;

class CategoryController extends Controller
{
    public function store(StoreCategoryRequest $request, CreateCategoryService $service): RedirectResponse
    {
        $dto = new CreateCategoryData(
            name:        trim($request->string('name')),
            color:       $request->filled('color') ? $request->string('color') : null,
            description: $request->input('description')
        );

        $service->handle($dto);

        return back()->with('success', 'Catégorie créée avec succès.');
    }
}
