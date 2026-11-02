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

Route::get('/sitemap.xml', [\App\Modules\Seo\Infrastructure\Http\Controllers\PublicSeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/robots.txt', [\App\Modules\Seo\Infrastructure\Http\Controllers\PublicSeoController::class, 'robots'])->name('seo.robots');
Route::get('/plan-du-site', [\App\Modules\Seo\Infrastructure\Http\Controllers\PublicSeoController::class, 'plan'])->name('site-plan');
foreach (config('seo.legal') as $key => $definition) {
    Route::get($definition['path'], [\App\Modules\Seo\Infrastructure\Http\Controllers\PublicSeoController::class, 'legal'])->defaults('key', $key)->name('legal.'.$key);
}
Route::post('/analytics/events', \App\Modules\Seo\Infrastructure\Http\Controllers\AudienceController::class)->middleware('throttle:60,1')->name('seo.events');
// Routes statiques
Route::get('/', [SwitchPageController::class, 'home'])->name('home');
Route::get('/admission', [SwitchPageController::class, 'admission'])->name('admission');
Route::get('/courses', [SwitchPageController::class, 'courses'])->name('courses');
Route::get('/faculties/{id}', [SwitchPageController::class, 'facultyShow'])->whereNumber('id')->name('faculties.show');
Route::get('/about', [SwitchPageController::class, 'about'])->name('about');
Route::get('/course/{id}', [SwitchPageController::class, 'courseShow'])->whereNumber('id')->name('courseShow');
Route::get('/contact', [SwitchPageController::class, 'contact'])->name('contact');
Route::get('blog', [SwitchPageController::class, 'blog'])->name('blog');
Route::get('blog/{id}', [SwitchPageController::class, 'blogDetails'])->whereNumber('id')->name('blog.show');
Route::redirect('/politique', '/politique-de-confidentialite', 301)->name('politique');
Route::redirect('/condition', '/conditions-generales-utilisation', 301)->name('condition');
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
    Route::get('/', \App\Modules\Student\Infrastructure\Http\Controllers\DashboardEntryController::class)
        ->name('index');

    Route::prefix('admin')->name('admin.')->middleware(['role:admin'])->group(function () {
        Route::prefix('seo')->name('seo.')->controller(\App\Modules\Seo\Infrastructure\Http\Controllers\AdminSeoController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::put('/settings', 'settings')->name('settings');
            Route::put('/pages', 'page')->name('pages');
            Route::put('/legal/{key}', 'legal')->name('legal');
        });

        Route::prefix('schedule')->name('schedule.')->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{session}/attendance', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AttendanceController::class, 'show'])->name('attendance');
            Route::post('/{session}/attendance', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AttendanceController::class, 'save'])->name('attendance.save');
            Route::post('/', 'save')->name('store');
            Route::post('/semester', 'semester')->name('semester');
            Route::post('/semesters', 'saveSemester')->name('semesters.store');
            Route::put('/{session}', 'save')->name('update');
            Route::delete('/{session}', 'destroy')->name('destroy');
        });
        Route::prefix('professors')->name('professors.')->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\ProfessorController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::post('/assignments', 'assign')->name('assignments.store');
            Route::put('/assignments/{offering}', 'assign')->name('assignments.update');
            Route::get('/{professor}', 'show')->name('show');
            Route::put('/{professor}', 'update')->name('update');
        });
        Route::prefix('student-academic')->name('student-academic.')->controller(\App\Modules\Student\Infrastructure\Http\Controllers\AcademicAdministrationController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/profile', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/password', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'password'])->middleware('throttle:6,1')->name('profile.password');
        Route::get('/profile/photo', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'photo'])->name('profile.photo');
        Route::get('/submissions/{submission}/download','downloadSubmission')->name('submissions.download');
            Route::post('/{academic}/fees', 'assess')->name('fees');
            Route::post('/{academic}/obligations', 'obligation')->name('obligations');
            Route::post('/{academic}/payments', 'payment')->name('payments');
            Route::post('/payments/{payment}/status', 'paymentStatus')->name('payments.status');
            Route::post('/{academic}/adjustments', 'adjustment')->name('adjustments');
            Route::post('/adjustments/{adjustment}/revoke', 'revoke')->name('adjustments.revoke');
            Route::post('/rules/{rule}/deactivate','deactivateRule')->name('rules.deactivate');
            Route::post('/rules', 'rule')->name('rules');
            Route::post('/{academic}/status', 'status')->name('status');
            Route::post('/offerings', 'offering')->name('offerings');
            Route::post('/sessions', 'session')->name('sessions');
            Route::post('/resources', 'resource')->name('resources');
            Route::post('/publication/{type}/{id}', 'publish')->name('publish');
            Route::post('/{academic}/course-exceptions', 'courseException')->name('exceptions');
            Route::post('/requests/{ticket}/reply', 'respond')->name('requests.reply');
        });

    Route::post('/notifications/read-all', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentNotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/open', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentNotificationController::class, 'open'])->name('notifications.open');
        Route::prefix('/academic-years')->name('academic-years.')->group(function () {
            Route::get('/', [AcademicYearController::class, 'index'])->name('index');
            Route::get('/{id}', [AcademicYearController::class, 'show'])->whereNumber('id')->name('show');
            Route::post('/', [AcademicYearController::class, 'store'])->name('store');
            Route::put('/{id}', [AcademicYearController::class, 'update'])->whereNumber('id')->name('update');
            Route::patch('/{id}/open', [AcademicYearController::class, 'open'])->whereNumber('id')->name('open');
            Route::patch('/{id}/close', [AcademicYearController::class, 'close'])->whereNumber('id')->name('close');
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
                Route::post('/{id}/courses', [LevelDetailController::class, 'storeCourse'])->name('courses.store');
                Route::put('/{id}/courses/{courseId}', [LevelDetailController::class, 'updateCourse'])->name('courses.update');
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

    Route::post('/notifications/read-all', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentNotificationController::class, 'readAllStudent'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/open', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentNotificationController::class, 'openStudent'])->name('notifications.open');

    Route::prefix('student')->name('student.')->controller(\App\Modules\Student\Infrastructure\Http\Controllers\StudentPortalController::class)->group(function () {
        Route::post('/profile', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/password', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'password'])->middleware('throttle:6,1')->name('profile.password');
        Route::get('/profile/photo', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController::class, 'photo'])->name('profile.photo');
        Route::get('/submissions/{submission}/download','downloadSubmission')->name('submissions.download');
        Route::get('/resources/{resource}/download','download')->name('resources.download');
        Route::post('/resources/{resource}/submit','submit')->name('resources.submit');
        Route::get('/payments/{payment}/receipt','receipt')->name('payments.receipt');
        Route::post('/welcome/acknowledge', 'acknowledgeWelcome')->name('welcome.acknowledge');
        Route::post('/requests','requestService')->name('requests');
        Route::get('/courses/{course}/{section?}', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentCourseController::class, 'show'])->whereNumber('course')->where('section', 'infos|sessions|online|files|evaluations|videos|attendance')->name('courses.show');
        Route::get('/{section?}','show')->where('section','overview|profile|academics|assessments|services|courses|schedule|materials|assignments|evaluations|results|fees|transactions|documents|announcements|requests')->name('index');
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
        Route::get('/documents/{uuid}/preview', [DocumentController::class, 'preview'])->name('documents.preview');
        Route::get('/documents/{uuid}/download', [DocumentController::class, 'download'])->name('documents.download');
        Route::post('/documents/{uuid}/replace', [DocumentController::class, 'replaceReviewed'])->name('documents.replace');
        Route::delete('/documents/{uuid}', [DocumentController::class, 'delete'])->name('documents.delete');
    });
    
    // Route pour récupérer le draft
    Route::get('/enrollment/draft/show', [DraftController::class, 'show'])->name('enrollment.draft.show');
    
    // Route pour les requirements
    Route::get('/enrollment/requirements', RequirementsController::class)->name('enrollment.requirements');
    
    // Routes Admin
    Route::middleware(['role:admin'])->prefix('admin/enrollments')->name('admin.enrollments.')->group(function () {
        Route::get('/', [EnrollmentManagementController::class, 'index'])->name('index');
        Route::get('/documents/{uuid}/preview', [EnrollmentManagementController::class, 'preview'])->name('documents.preview');
        Route::get('/documents/{uuid}/download', [EnrollmentManagementController::class, 'download'])->name('documents.download');
        Route::get('/{id}', [EnrollmentManagementController::class, 'show'])->name('show');
        Route::post('/{id}/start-analysis', [EnrollmentManagementController::class, 'startAnalysis'])->name('start-analysis');
        Route::post('/{id}/documents/{uuid}/review', [EnrollmentManagementController::class, 'reviewDocument'])->name('documents.review');
        Route::post('/{id}/request-corrections', [EnrollmentManagementController::class, 'requestCorrections'])->name('request-corrections');
        Route::post('/{id}/validate', [EnrollmentManagementController::class, 'validate'])->name('validate');
        Route::post('/{id}/reject', [EnrollmentManagementController::class, 'reject'])->name('reject');
    });
});
