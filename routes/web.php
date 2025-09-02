<?php

use App\Modules\Identity\Infrastructure\Http\Controllers\AuthController;
use App\Modules\Identity\Infrastructure\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\EnrollmentController\EnrollmentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SwitchPageController;
use App\Http\Controllers\FacultyController\FacultyController;
use App\Http\Controllers\LevelController\LevelController;
use App\Http\Controllers\ProfessorController\ProfessorController;
use App\Modules\Identity\Infrastructure\Http\Controllers\PasswordResetController;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

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


// Route::prefix('dashboard')->name('dashboard.')->middleware(['auth', 'verified'])->group(function(){
//     //Index dashboard
//     Route::get('/', function () {
//         return Inertia::render('dashboard/index/Index');
//     })->name('index');

//     //Subscription
//     // Route::get('/enrollments', function () {
//     //     return Inertia::render('dashboard/enrollments/Enrollment');
//     // });
//     // Route::get('/enrollments/index', function () {
//     //     return Inertia::render('dashboard/enrollments/Index');
//     // });


//     // CRUD standard des facultés
//     Route::resource('faculties', FacultyController::class)->except(['create', 'edit']);

//     // Faculty Level Show
//     Route::resource('levels', LevelController::class);
//     Route::put('levels/details/{id}', [LevelController::class, 'updateLevelDetails'])->name('levels.update.details');

//     // CRUD standard des professeurs
//     Route::resource('professors', ProfessorController::class);

//     //Faculty Level admission
//     Route::post('admission/store', [LevelController::class, 'admissionStore'])->name('admission.store');
//     Route::put('admission/update/{id}', [LevelController::class, 'admissionUpdate'])->name('admission.update');
//     Route::delete('admission/destroy/{id}', [LevelController::class, 'admissionDestroy'])->name('admission.destroy');

//     // Enrollments
//     Route::get('/enrollments', [EnrollmentController::class,'index'])->name('enrollments.index');
//     Route::post('/enrollments', [EnrollmentController::class,'store'])->name('enrollments.store');
//     Route::get('/enrollments/students/{facultyId?}/{levelId?}', [EnrollmentController::class, 'enrollmentsProcess'])->name('enrollments.process');
//     Route::get('/enrollments/{enrollment}', [EnrollmentController::class,'show'])->name('enrollments.show');
//     Route::patch('/enrollments/{enrollment}', [EnrollmentController::class,'update'])->name('enrollments.update');
//     Route::post('/enrollments/{enrollment}/submit', [EnrollmentController::class,'submit'])->name('enrollments.submit');

//     Route::post('/enrollments/{enrollment}/documents', [EnrollmentController::class,'uploadDoc'])->name('enrollments.docs.upload');
// });

Route::get('/test', function() {
    return Inertia::render('dashboard/faculty/test');
});

// require __DIR__.'/auth.php';
// require __DIR__.'/settings.php';


Route::middleware('guest')->group(function () {
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register.show');
    Route::post('/register', [AuthController::class, 'register'])->name('register');

    Route::get('/login', [AuthController::class, 'showLogin'])->name('login.show');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');


    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])
    ->middleware('auth')
    ->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['auth', 'signed'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
    ->middleware(['auth', 'throttle:6,1'])
    ->name('verification.send');

    Route::get('/forgot-password', [PasswordResetController::class, 'request'])
    ->middleware('guest')->name('password.request');

Route::post('/forgot-password', [PasswordResetController::class, 'send'])
    ->middleware('guest')->name('password.email');

Route::get('/reset-password/{token}', [PasswordResetController::class, 'form'])
    ->middleware('guest')->name('password.reset');

Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('guest')->name('password.update');






// Dashboard accessible uniquement si email vérifié
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', fn() => inertia('dashboard/index/Index'))
        ->name('dashboard.index');
});


