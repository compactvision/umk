<?php

use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentController;
use App\Modules\Identity\Infrastructure\Http\Controllers\AuthController;
use App\Modules\Identity\Infrastructure\Http\Controllers\EmailVerificationController;
use App\Modules\AcademicYear\Infrastructure\Http\Controllers\AcademicYearController;
use App\Modules\Faculty\Infrastructure\Http\Controllers\FacultyController;
use App\Modules\Level\Infrastructure\Http\Controllers\LevelController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SwitchPageController;
use App\Modules\Site\Infrastructure\Http\Controllers\SiteController;
use App\Modules\AdmissionCondition\Infrastructure\Http\Controllers\AdmissionConditionController;
use App\Modules\Blog\Infrastructure\Http\Controllers\CategoryController;
use App\Modules\Blog\Infrastructure\Http\Controllers\PostController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\DocumentController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\DraftController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentDocumentController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentManagementController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\RequirementsController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\SubmitController;
use App\Modules\Enrollment\Interfaces\Http\Controllers\EnrollmentController as ControllersEnrollmentController;
use App\Modules\Identity\Infrastructure\Http\Controllers\PasswordResetController;
use App\Modules\Identity\Infrastructure\Http\Controllers\SocialAuthController;
use App\Modules\Level\Infrastructure\Http\Controllers\LevelController as ControllersLevelController;
use App\Modules\LevelDetail\Infrastructure\Http\Controllers\LevelDetailController;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;

// Routes statiques
Route::get('/', [SwitchPageController::class, 'home'])->name('home');
Route::get('/admission', [SwitchPageController::class, 'admission'])->name('admission');
Route::get('/courses', [SwitchPageController::class, 'courses'])->name('courses');
Route::get('/about', [SwitchPageController::class, 'about'])->name('about');
Route::get('/course/{id}', [SwitchPageController::class, 'courseShow'])->name('courseShow');
Route::get('/contact', [SwitchPageController::class, 'contact'])->name('contact');
Route::get('blog', [SwitchPageController::class, 'blog'])->name('blog');
Route::get('blog/{id}', [SwitchPageController::class, 'blogDetails'])->name('blog.show');
Route::get('politique', [SwitchPageController::class, 'politique'])->name('politique');
Route::get('condition', [SwitchPageController::class, 'condition'])->name('condition');
Route::get('tuitions', [SwitchPageController::class, 'tuitions'])->name('tuitions');

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

Route::get('/test', function () {
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

Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback']);



// Dashboard accessible uniquement si email vérifié
Route::prefix('dashboard')->name('dashboard.')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', fn() => inertia('dashboard/index/Index'))
        ->name('index');

    Route::prefix('admin')->name('admin.')->middleware(['role:admin'])->group(function () {
        Route::prefix('/academic-years')->name('academic-years.')->group(function () {
            Route::get('/', [AcademicYearController::class, 'index'])->name('index');
            Route::get('/{id}', [AcademicYearController::class, 'show'])->name('show');
            Route::post('/', [AcademicYearController::class, 'store'])->name('store');
            Route::put('/{id}', [AcademicYearController::class, 'update'])->name('update');
            Route::patch('/{id}/open', [AcademicYearController::class, 'open'])->name('open');
            Route::patch('/{id}/close', [AcademicYearController::class, 'close'])->name('close');
        });

        Route::prefix('/faculties')->name('faculties.')->group(function () {
            Route::get('/', [FacultyController::class, 'index'])->name('index');
            Route::get('/{id}', [FacultyController::class, 'show'])->name('show');
            Route::post('/', [FacultyController::class, 'store'])->name('store');
            Route::put('/{id}', [FacultyController::class, 'update'])->name('update');
            Route::delete('/{id}', [FacultyController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('/levels')->name('levels.')->group(function () {
            Route::get('/', [LevelController::class, 'index'])->name('index');
            Route::get('/{id}', [LevelController::class, 'show'])->name('show');
            Route::post('/', [LevelController::class, 'store'])->name('store');
            Route::put('/{id}', [LevelController::class, 'update'])->name('update');
            Route::delete('/{id}', [LevelController::class, 'destroy'])->name('destroy');

            Route::prefix('/details')->name('details.')->group(function () {
                Route::get('/{id}', [LevelDetailController::class, 'show'])->name('show');
                Route::post('/', [LevelDetailController::class, 'store'])->name('store');
                Route::put('/{id}', [LevelDetailController::class, 'update'])->name('update');
                Route::delete('/{id}', [LevelDetailController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('/admission-conditions')->name('admission-conditions.')->group(function () {
                Route::post('/', [AdmissionConditionController::class, 'store'])->name('store');
                Route::put('/{id}', [AdmissionConditionController::class, 'update'])->name('update');
                Route::delete('/{id}', [AdmissionConditionController::class, 'destroy'])->name('destroy');
            });
        });

        Route::resource('posts', PostController::class)->except(['show']);
        Route::get('/dashboard/blog/{slug}', [PostController::class, 'show'])->name('posts.show');
        Route::post('/dashboard/blog/categories', [CategoryController::class, 'store'])->name('categories.store');

        Route::prefix('/site')->name('site.')->group(function () {
            Route::get('/', [SiteController::class, 'index'])->name('index');
            Route::post('/', [SiteController::class, 'store'])->name('store');
            Route::put('/{id}', [SiteController::class, 'update'])->name('update');
        });
    });

    Route::prefix('enrollments')->name('enrollments.')->group(function () {
        Route::get('/', [EnrollmentController::class, 'index'])->name('index');
        Route::get('/create', [EnrollmentController::class, 'create'])->name('create');
        Route::get('/{enrollment}/edit', [EnrollmentController::class, 'edit'])->name('edit');
        Route::get('/{uuid}', [EnrollmentController::class, 'show'])->name('show');
        
        // Draft
        Route::post('/save-progress', [DraftController::class, 'save'])->name('save-progress');
        
        // Submit
        Route::post('/{uuid}/submit', SubmitController::class)->name('submit');
        
        // Documents
        Route::post('/documents/upload', [DocumentController::class, 'upload'])->name('documents.upload');
        Route::get('/documents/{uuid}/download', [DocumentController::class, 'download'])->name('documents.download');
        Route::delete('/documents/{uuid}', [DocumentController::class, 'delete'])->name('documents.delete');
    });
    
    // Route pour récupérer le draft
    Route::get('/enrollment/draft/show', [DraftController::class, 'show'])->name('enrollment.draft.show');
    
    // Route pour les requirements
    Route::get('/enrollment/requirements', RequirementsController::class)->name('enrollment.requirements');
    
    // Routes Admin
    Route::middleware(['admin'])->prefix('admin/enrollments')->name('admin.enrollments.')->group(function () {
        Route::get('/', [EnrollmentManagementController::class, 'index'])->name('index');
        Route::get('/{id}', [EnrollmentManagementController::class, 'show'])->name('show');
        Route::post('/{id}/validate', [EnrollmentManagementController::class, 'validate'])->name('validate');
        Route::post('/{id}/reject', [EnrollmentManagementController::class, 'reject'])->name('reject');
    });
});
