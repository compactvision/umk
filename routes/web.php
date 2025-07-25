<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SwitchPageController;
use App\Http\Controllers\FacultyController\FacultyController;
use App\Http\Controllers\LevelController\LevelController;


// Routes statiques
Route::get('/', [SwitchPageController::class, 'home'])->name('home');
Route::get('/admission', [SwitchPageController::class, 'admission'])->name('admission');
Route::get('/courses', [SwitchPageController::class, 'courses'])->name('courses');
Route::get('/course/{id}', [SwitchPageController::class, 'courseShow'])->name('courseShow');
Route::get('/contact', [SwitchPageController::class, 'contact'])->name('contact');

// Routes d'authentification
Route::get('/dashboard/auth/login', function () {
    return Inertia::render('dashboard/auth/Login');
})->name('dashboard.auth.login');

Route::get('/dashboard/auth/signup', function () {
    return Inertia::render('dashboard/auth/Signup');
})->name('dashboard.auth.signup');


Route::prefix('dashboard')->name('dashboard.')->middleware(['auth'])->group(function(){
    //Index dashboard
    Route::get('/', function () {
        return Inertia::render('dashboard/index/Index');
    })->name('index');

    // Page principale des facultés - IMPORTANT: Cette route doit charger les données
//    Route::get('/faculty', [FacultyController::class, 'index'])
//        ->name('dashboard.faculty');

    // CRUD standard des facultés
    Route::resource('faculties', FacultyController::class)->except(['create', 'edit']);

    // Faculty Level Show
    Route::resource('levels', LevelController::class);
});

Route::get('/test', function() {
    return Inertia::render('dashboard/faculty/test');
});
require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
