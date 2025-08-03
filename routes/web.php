<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SwitchPageController;
use App\Http\Controllers\FacultyController\FacultyController;
use App\Http\Controllers\LevelController\LevelController;
use App\Http\Controllers\ProfessorController\ProfessorController;

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

    //Subscription
    Route::get('/subscription', function () {
        return Inertia::render('dashboard/subscription/Subscription');
    });


    // CRUD standard des facultés
    Route::resource('faculties', FacultyController::class)->except(['create', 'edit']);

    // Faculty Level Show
    Route::resource('levels', LevelController::class);
    Route::put('levels/details/{id}', [LevelController::class, 'updateLevelDetails'])->name('levels.update.details');

    // CRUD standard des professeurs
    Route::resource('professors', ProfessorController::class);

    //Faculty Level admission
    Route::post('admission/store', [LevelController::class, 'admissionStore'])->name('admission.store');
    Route::put('admission/update/{id}', [LevelController::class, 'admissionUpdate'])->name('admission.update');
    Route::delete('admission/destroy/{id}', [LevelController::class, 'admissionDestroy'])->name('admission.destroy');
});

Route::get('/test', function() {
    return Inertia::render('dashboard/faculty/test');
});

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
