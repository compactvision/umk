<?php

use App\Modules\Site\Infrastructure\Http\Controllers\SiteController;
use Illuminate\Support\Facades\Route;

Route::prefix('site')->group(function () {
    Route::get('/', [SiteController::class, 'show']);
    Route::post('/', [SiteController::class, 'store'])->middleware(['web', 'auth', 'verified', 'role:admin']);
    Route::put('/', [SiteController::class, 'update'])->middleware(['web', 'auth', 'verified', 'role:admin']);
});
