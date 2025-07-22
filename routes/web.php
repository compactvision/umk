<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SwitchPageController;
use App\Http\Controllers\FacultyController\FacultyController;

// Routes statiques
Route::get('/', [SwitchPageController::class, 'home'])->name('home');
Route::get('/admission', [SwitchPageController::class, 'admission'])->name('admission');
Route::get('/courses', [SwitchPageController::class, 'courses'])->name('courses');
Route::get('/contact', [SwitchPageController::class, 'contact'])->name('contact');

// Routes d'authentification
Route::get('/dashboard/auth/login', function () {
    return Inertia::render('dashboard/auth/Login');
})->name('dashboard.auth.login');

Route::get('/dashboard/auth/signup', function () {
    return Inertia::render('dashboard/auth/Signup');
})->name('dashboard.auth.signup');

// Routes protégées par l'authentification
Route::middleware(['auth'])->group(function () {

    // Dashboard principal
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard/index/Index');
    })->name('dashboard');

    // Page principale des facultés - IMPORTANT: Cette route doit charger les données
    Route::get('/dashboard/faculty', [FacultyController::class, 'index'])
        ->name('dashboard.faculty');

    // Routes API pour les facultés (avec préfixe api si nécessaire)
    Route::prefix('api')->name('api.')->group(function () {

        // CRUD standard des facultés
        Route::resource('faculties', FacultyController::class)->except(['create', 'edit']);

        // Routes spéciales
        Route::get('faculties/active', [FacultyController::class, 'active'])
            ->name('faculties.active');

        Route::patch('faculties/{faculty}/toggle-status', [FacultyController::class, 'toggleStatus'])
            ->name('faculties.toggle-status');

        Route::get('faculties-stats', [FacultyController::class, 'stats'])
            ->name('faculties.stats');
    });

    // Routes web pour les facultés (si vous en avez besoin)
    Route::resource('faculties', FacultyController::class);

    Route::patch('faculties/{faculty}/toggle-status', [FacultyController::class, 'toggleStatus'])
        ->name('faculties.toggle-status');

    Route::get('faculties-stats', [FacultyController::class, 'stats'])
        ->name('faculties.stats');
});

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
