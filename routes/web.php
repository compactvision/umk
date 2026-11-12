<?php

use App\Http\Controllers\SwitchPageController;
use App\Modules\AcademicYear\Infrastructure\Http\Controllers\AcademicCalendarController;
use App\Modules\AcademicYear\Infrastructure\Http\Controllers\AcademicYearController;
use App\Modules\AdmissionCondition\Infrastructure\Http\Controllers\AdmissionConditionController;
use App\Modules\Blog\Infrastructure\Http\Controllers\CategoryController;
use App\Modules\Blog\Infrastructure\Http\Controllers\PostController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\DocumentController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\DraftController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentManagementController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\EnrollmentNotificationController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\RequirementsController;
use App\Modules\Enrollment\Infrastructure\Http\Controllers\SubmitController;
use App\Modules\Faculty\Infrastructure\Http\Controllers\FacultyController;
use App\Modules\Identity\Infrastructure\Http\Controllers\AuthController;
use App\Modules\Identity\Infrastructure\Http\Controllers\EmailVerificationController;
use App\Modules\Identity\Infrastructure\Http\Controllers\PasswordResetController;
use App\Modules\Identity\Infrastructure\Http\Controllers\SocialAuthController;
use App\Modules\Level\Infrastructure\Http\Controllers\LevelController;
use App\Modules\LevelDetail\Infrastructure\Http\Controllers\CourseCatalogController;
use App\Modules\LevelDetail\Infrastructure\Http\Controllers\LevelDetailController;
use App\Modules\Seo\Infrastructure\Http\Controllers\AdminSeoController;
use App\Modules\Seo\Infrastructure\Http\Controllers\AudienceController;
use App\Modules\Seo\Infrastructure\Http\Controllers\PublicSeoController;
use App\Modules\Site\Infrastructure\Http\Controllers\SiteController;
use App\Modules\Student\Infrastructure\Http\Controllers\AcademicAdministrationController;
use App\Modules\Student\Infrastructure\Http\Controllers\CardIssuanceController;
use App\Modules\Student\Infrastructure\Http\Controllers\CardRequestController;
use App\Modules\Student\Infrastructure\Http\Controllers\CardTemplateController;
use App\Modules\Student\Infrastructure\Http\Controllers\DashboardEntryController;
use App\Modules\Student\Infrastructure\Http\Controllers\StudentCourseController;
use App\Modules\Student\Infrastructure\Http\Controllers\StudentPortalController;
use App\Modules\Student\Infrastructure\Http\Controllers\StudentProfileController;
use App\Modules\Teaching\Infrastructure\Http\Controllers\AttendanceController;
use App\Modules\Teaching\Infrastructure\Http\Controllers\ProfessorController;
use App\Modules\Teaching\Infrastructure\Http\Controllers\ProfessorInvitationController;
use App\Modules\Teaching\Infrastructure\Http\Controllers\ProfessorProfileController;
use App\Modules\Teaching\Infrastructure\Http\Middleware\RequireProfessorPhoto;
use App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/sitemap.xml', [PublicSeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/robots.txt', [PublicSeoController::class, 'robots'])->name('seo.robots');
Route::get('/plan-du-site', [PublicSeoController::class, 'plan'])->name('site-plan');
foreach (config('seo.legal') as $key => $definition) {
    Route::get($definition['path'], [PublicSeoController::class, 'legal'])->defaults('key', $key)->name('legal.'.$key);
}
Route::post('/analytics/events', AudienceController::class)->middleware('throttle:60,1')->name('seo.events');
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
    ->middleware(['guest', 'throttle:6,1'])->name('password.email');

Route::get('/reset-password/{token}', [PasswordResetController::class, 'form'])
    ->middleware('guest')->name('password.reset');

Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('guest')->name('password.update');

Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback']);

// Dashboard accessible uniquement si email vérifié
$learningRoutes = function () {
    Route::get('/', 'index')->name('index');
    Route::post('/offerings/{offering}', 'store')->name('store');
    Route::post('/offerings/{offering}/sections/{section?}', 'section')->name('section');
    Route::post('/{resource}/edition', 'edit')->name('edit');
    Route::post('/{resource}/publication', 'transition')->name('transition');
    Route::post('/{resource}/reuse', 'reuse')->name('reuse');
    Route::post('/{resource}/work-placement', 'workPlacement')->name('work-placement');
    Route::get('/{resource}/file', 'file')->name('file');
    Route::get('/{resource}/preview', 'preview')->name('preview');
    Route::get('/{resource}/versions/{number}', 'version')->whereNumber('number')->name('version');
};

$assessmentRoutes = function () {
    Route::get('/', 'index')->name('index');
    Route::get('/handoff', 'handoff')->name('handoff');
    Route::post('/offerings/{offering}', 'store')->name('store');
    Route::post('/{resource}/edition', 'edit')->name('edit');
    Route::post('/{resource}/lifecycle', 'lifecycle')->name('lifecycle');
    Route::post('/{resource}/groups', 'group')->name('group');
    Route::post('/{resource}/groups/{group}/score', 'groupScore')->whereNumber('group')->name('group-score');
    Route::post('/{resource}/records/{record}/correction', 'correct')->name('correct');
    Route::post('/{resource}/records/{record}/state', 'record')->name('record');
    Route::post('/{resource}/batch', 'batch')->name('batch');
    Route::get('/{resource}/records/{record}/copy', 'copy')->name('copy');
    Route::get('/{resource}/records/{record}/feedback', 'feedback')->name('feedback');
};

Route::prefix('invitation-enseignant')->name('professor-invitation.')->middleware(['guest', 'throttle:10,1'])
    ->controller(ProfessorInvitationController::class)->group(function () {
        Route::get('/{professor}/{token}', 'show')->whereNumber('professor')->where('token', '[A-Za-z0-9]{64}')->name('show');
        Route::post('/{professor}/{token}', 'activate')->whereNumber('professor')->where('token', '[A-Za-z0-9]{64}')->name('activate');
    });

Route::prefix('dashboard')->name('dashboard.')->middleware(['auth', 'verified'])->group(function () use ($learningRoutes, $assessmentRoutes) {
    Route::get('/professor-photo/{professor}', [ProfessorProfileController::class, 'photo'])->name('professor-photo');
    Route::get('/teacher/profile', [ProfessorProfileController::class, 'show'])->middleware('role:professor')->name('teaching.profile');
    Route::post('/teacher/profile/photo', [ProfessorProfileController::class, 'update'])->middleware(['role:professor', 'throttle:10,1'])->name('teaching.profile.photo');
    Route::prefix('teacher/assessments')->name('teaching.assessments.')->middleware(['role:professor', RequireProfessorPhoto::class])
        ->controller(\App\Modules\Assessment\Infrastructure\Http\AssessmentController::class)->group($assessmentRoutes);
    Route::prefix('admin/progression')->name('admin.progression.')->middleware('role:admin')
        ->controller(\App\Modules\Progression\Infrastructure\Http\ProgressionController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/enrollments/{academic}/cases', 'propose')->name('propose');
            Route::post('/cases/{case}/decision', 'decide')->name('decide');
            Route::post('/cases/{case}/revision', 'revise')->name('revise');
            Route::post('/decisions/{progression}/retakes', 'retake')->name('retake');
        });
    Route::prefix('admin/official-documents')->name('admin.official-documents.')->middleware('role:admin')
        ->controller(\App\Modules\Documents\Infrastructure\Http\OfficialDocumentController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/types', 'type')->name('type');
            Route::post('/types/{type}/activation', 'activate')->name('activate');
            Route::post('/types/{type}/templates', 'template')->name('template');
            Route::get('/templates/{template}/assets/{asset}', 'templateAsset')->whereIn('asset', ['logo', 'signature', 'stamp'])->name('template-asset');
            Route::post('/templates/{template}/state', 'templateState')->name('template-state');
            Route::post('/enrollments/{entry}/requests', 'submit')->name('submit');
            Route::post('/requests/{ticket}/state', 'transition')->name('transition');
            Route::get('/requests/{ticket}/preview', 'preview')->name('preview');
            Route::post('/requests/{ticket}/issue', 'issue')->name('issue');
            Route::post('/documents/{document}/state', 'lifecycle')->name('lifecycle');
            Route::get('/documents/{document}/download', 'download')->name('download');
            Route::post('/results/{archive}/revocation', 'revokeResult')->name('revoke-result');
        });
    Route::prefix('admin/academic-results')->name('admin.results.')->middleware('role:admin')
        ->controller(\App\Modules\Results\Infrastructure\Http\ResultsController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/versions/{version}/rules', 'storeRule')->name('store-rule');
            Route::post('/rules/{rule}/approval', 'approveRule')->name('approve-rule');
            Route::post('/rules/{rule}/deliberations', 'prepare')->name('prepare');
            Route::post('/deliberations/{run}/state', 'transition')->name('transition');
            Route::post('/deliberations/{run}/results/{result}/decision', 'decision')->name('decision');
            Route::get('/deliberations/{run}/minutes', 'minutes')->name('minutes');
            Route::get('/certified/{result}', 'certified')->name('certified');
            Route::get('/deliberations/{run}/export', 'export')->name('export');
            Route::post('/appeals/{appeal}', 'review')->name('review');
            Route::get('/appeals/{appeal}/file', 'appealFile')->name('appeal-file');
        });
    Route::prefix('admin/assessments')->name('admin.assessments.')->middleware(['role:admin', 'can:publish academic content'])
        ->controller(\App\Modules\Assessment\Infrastructure\Http\AssessmentController::class)->group($assessmentRoutes);
    Route::prefix('teacher/resources')->name('teaching.learning.')->middleware(['role:professor', RequireProfessorPhoto::class])
        ->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\LearningContentController::class)->group($learningRoutes);
    Route::prefix('admin/teaching/resources')->name('admin.learning.')->middleware(['role:admin', 'can:publish academic content'])
        ->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\LearningContentController::class)->group($learningRoutes);

    Route::get('/', DashboardEntryController::class)
        ->name('index');

    Route::prefix('teacher')->name('teaching.')->middleware(['role:professor', RequireProfessorPhoto::class])->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\TeacherWorkspaceController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/{offering}/links', 'link')->name('link');
        Route::get('/files/{resource}', 'file')->name('file');
        Route::get('/sessions/{session}/attendance', [AttendanceController::class, 'show'])->name('attendance');
        Route::post('/sessions/{session}/attendance', [AttendanceController::class, 'save'])->name('attendance.save');
    });

    Route::prefix('admin')->name('admin.')->middleware(['role:admin'])->group(function () {
        Route::prefix('teaching')->name('teaching.')->controller(\App\Modules\Teaching\Infrastructure\Http\Controllers\TeachingController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->middleware('can:publish academic content')->name('store');
            Route::post('/{offering}/status', 'status')->middleware('can:publish academic content')->name('status');
            Route::post('/{offering}/team', 'team')->middleware('can:publish academic content')->name('team');
            Route::post('/{offering}/register', 'register')->middleware('can:manage academic access')->name('register');
            Route::post('/{offering}/sync', 'sync')->middleware('can:manage academic access')->name('sync');
            Route::post('/registrations/{registration}/withdraw', 'withdraw')->middleware('can:manage academic access')->name('withdraw');
        });
        Route::prefix('card-issuance')->name('card-issuance.')->middleware('can:manage academic access')->controller(CardIssuanceController::class)->group(function () {
            Route::get('/printing', 'printing')->name('printing');
            Route::get('/printing/{enrollment}', 'preview')->name('preview');
            Route::get('/printing/{enrollment}/check', 'check')->name('check');
            Route::post('/printing/{enrollment}', 'printed')->name('printed');
            Route::get('/delivery', 'delivery')->name('delivery');
            Route::patch('/delivery/{issuance}', 'collect')->name('collect');
        });

        Route::prefix('card-requests')->name('card-requests.')->middleware('can:manage academic access')->controller(CardRequestController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/enrollments/{enrollment}/photo', 'photo')->name('photo');
            Route::patch('/enrollments/{enrollment}', 'review')->name('review');
        });

        Route::prefix('card-templates')->name('card-templates.')->middleware('can:manage academic access')->controller(CardTemplateController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::put('/{cardTemplate}', 'update')->name('update');
        });

        Route::prefix('seo')->name('seo.')->controller(AdminSeoController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::put('/settings', 'settings')->name('settings');
            Route::put('/pages', 'page')->name('pages');
            Route::put('/legal/{key}', 'legal')->name('legal');
        });

        Route::prefix('schedule')->name('schedule.')->controller(ScheduleController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{session}/attendance', [AttendanceController::class, 'show'])->name('attendance');
            Route::post('/{session}/attendance', [AttendanceController::class, 'save'])->name('attendance.save');
            Route::post('/', 'save')->name('store');
            Route::post('/semester', 'semester')->name('semester');
            Route::get('/{session}/history', 'history')->whereNumber('session')->name('history');
            Route::post('/{session}/transition', 'transition')->whereNumber('session')->name('transition');
            Route::get('/resources', [\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleResourceController::class, 'index'])->name('resources');
            Route::post('/rooms', [\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleResourceController::class, 'room'])->name('rooms.store');
            Route::put('/rooms/{room}', [\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleResourceController::class, 'room'])->name('rooms.update');
            Route::post('/blocks', [\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleResourceController::class, 'block'])->name('blocks.store');
            Route::post('/blocks/{block}/release', [\App\Modules\Teaching\Infrastructure\Http\Controllers\ScheduleResourceController::class, 'release'])->name('blocks.release');
            Route::get('/absences', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'index'])->name('absences');
            Route::post('/absences/{case}/decision', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'decide'])->name('absences.decide');
            Route::get('/absences/{case}/file', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'file'])->name('absences.file');
            Route::get('/reports', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AttendanceReportController::class, 'index'])->name('reports');
            Route::post('/semesters', 'saveSemester')->name('semesters.store');
            Route::put('/{session}', 'save')->name('update');
            Route::delete('/{session}', 'destroy')->name('destroy');
        });
        Route::prefix('professors')->name('professors.')->controller(ProfessorController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::post('/assignments', 'assign')->name('assignments.store');
            Route::put('/assignments/{offering}', 'assign')->name('assignments.update');
            Route::get('/{professor}', 'show')->name('show');
            Route::put('/{professor}', 'update')->name('update');
            Route::post('/{professor}/account', 'account')->middleware('can:manage users')->name('account');
            Route::post('/{professor}/invitation', [ProfessorInvitationController::class, 'send'])
                ->middleware(['can:manage users', 'throttle:10,1'])->name('invitation');
        });
        Route::prefix('finance')->name('finance.')->middleware('can:manage academic finance')->controller(\App\Modules\Student\Infrastructure\Http\Controllers\FinanceController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/export', 'export')->name('export');
            Route::get('/export.xlsx', 'exportXlsx')->name('export-xlsx');
            Route::post('/tariffs', 'tariff')->name('tariffs');
            Route::post('/tariffs/{tariff}/activate', 'activate')->name('tariffs.activate');
            Route::post('/{academic}/bill', 'bill')->whereNumber('academic')->name('bill');
            Route::get('/payments/{payment}/receipt', 'receipt')->name('receipt');
            Route::post('/payments/{payment}/allocate', 'allocate')->name('allocate');
            Route::post('/payments/{payment}/refunds', 'refund')->name('refund');
            Route::post('/refunds/{refund}/status', 'refundStatus')->name('refunds.status');
            Route::post('/reconciliation/preview', 'preview')->name('reconciliation.preview');
            Route::post('/reconciliation/commit', 'reconcile')->name('reconciliation.commit');
        });
        Route::prefix('student-academic')->name('student-academic.')->middleware(\App\Http\Middleware\EnsureAcademicStaffScope::class)->controller(AcademicAdministrationController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/administration/closure', [\App\Modules\Student\Infrastructure\Http\Controllers\EnrollmentManagementController::class, 'closure'])->name('closure');
            Route::post('/groups/{group}/capacity', [\App\Modules\Student\Infrastructure\Http\Controllers\AcademicGroupController::class, 'capacity'])->whereNumber('group')->name('groups.capacity');
            Route::get('/administration', [\App\Modules\Student\Infrastructure\Http\Controllers\EnrollmentManagementController::class, 'index'])->name('administration');
            Route::post('/{academic}/transition', [\App\Modules\Student\Infrastructure\Http\Controllers\EnrollmentManagementController::class, 'transition'])->whereNumber('academic')->name('transition');
            Route::post('/{academic}/transfer', [\App\Modules\Student\Infrastructure\Http\Controllers\EnrollmentManagementController::class, 'transfer'])->whereNumber('academic')->name('transfer');
            Route::get('/{academic}', 'show')->whereNumber('academic')->name('show');
            Route::post('/{academic}/account', [\App\Modules\Student\Infrastructure\Http\Controllers\StudentAccountController::class, 'update'])->whereNumber('academic')->middleware('throttle:6,1')->name('account');
            Route::get('/{academic}/documents/{resource}', 'downloadDocument')->whereNumber(['academic', 'resource'])->name('documents.download');
            Route::get('/renewals', 'renewals')->name('renewals');
            Route::post('/{academic}/progression', 'decideProgression')->whereNumber('academic')->name('progression');
            Route::get('/{academic}/photo', [StudentProfileController::class, 'directoryPhoto'])->whereNumber('academic')->name('photo');
            Route::put('/{academic}/unit-results/{unit}', 'saveUnitResult')->whereNumber(['academic', 'unit'])->name('unit-results.update');
        Route::post('/profile', [StudentProfileController::class, 'update'])->name('profile.update');
            Route::post('/profile/password', [StudentProfileController::class, 'password'])->middleware('throttle:6,1')->name('profile.password');
            Route::get('/profile/photo', [StudentProfileController::class, 'photo'])->name('profile.photo');
            Route::get('/submissions/{submission}/download', 'downloadSubmission')->whereNumber('submission')->name('submissions.download');
            Route::get('/submissions/{submission}/versions/{version}', 'submissionVersion')->whereNumber(['submission', 'version'])->name('submissions.version');
            Route::post('/{academic}/fees', 'assess')->name('fees');
            Route::post('/{academic}/obligations', 'obligation')->name('obligations');
            Route::post('/{academic}/payments', 'payment')->name('payments');
            Route::post('/payments/{payment}/status', 'paymentStatus')->name('payments.status');
            Route::post('/{academic}/adjustments', 'adjustment')->name('adjustments');
            Route::post('/adjustments/{adjustment}/revoke', 'revoke')->name('adjustments.revoke');
            Route::post('/rules/{rule}/deactivate', 'deactivateRule')->name('rules.deactivate');
            Route::post('/rules', 'rule')->name('rules');
            Route::post('/{academic}/status', 'status')->name('status');
            Route::post('/offerings', 'offering')->name('offerings');
            Route::post('/sessions', 'session')->name('sessions');
            Route::post('/resources', 'resource')->name('resources');
            Route::post('/publication/{type}/{id}', 'publish')->name('publish');
            Route::post('/{academic}/course-exceptions', 'courseException')->name('exceptions');
            Route::post('/requests/{ticket}/reply', 'respond')->name('requests.reply');
        });

        Route::post('/notifications/read-all', [EnrollmentNotificationController::class, 'readAll'])->middleware('can:manage academic access')->name('notifications.read-all');
        Route::post('/notifications/{notification}/open', [EnrollmentNotificationController::class, 'open'])->middleware('can:manage academic access')->name('notifications.open');
        Route::prefix('/academic-years')->name('academic-years.')->group(function () {
            Route::get('/', [AcademicYearController::class, 'index'])->name('index');
            Route::get('/semesters', [ScheduleController::class, 'semesters'])->name('semesters.index');
            Route::prefix('/calendar')->name('calendar.')->middleware('can:publish academic content')->controller(AcademicCalendarController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('/{year}/export', 'export')->whereNumber('year')->name('export');
                Route::post('/{year}/events', 'save')->whereNumber('year')->name('store');
                Route::put('/{year}/events/{event}', 'save')->whereNumber(['year', 'event'])->name('update');
            });
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

        Route::get('/course-catalog', [CourseCatalogController::class, 'index'])->name('course-catalog.index');
        Route::post('/course-catalog', [CourseCatalogController::class, 'store'])->name('course-catalog.store');
        Route::get('/course-catalog/{course}', [CourseCatalogController::class, 'show'])->name('course-catalog.show');
        Route::put('/course-catalog/{course}', [CourseCatalogController::class, 'update'])->name('course-catalog.update');
        Route::post('/course-catalog/{course}/status', [CourseCatalogController::class, 'status'])->name('course-catalog.status');

        Route::prefix('/levels')->name('levels.')->group(function () {
            Route::get('/', [LevelController::class, 'index'])->name('index');
            Route::get('/{id}', [LevelController::class, 'show'])->whereNumber('id')->name('show');
            Route::post('/', [LevelController::class, 'store'])->name('store');
            Route::put('/{id}', [LevelController::class, 'update'])->name('update');
            Route::delete('/{id}', [LevelController::class, 'destroy'])->name('destroy');

            Route::prefix('/details')->name('details.')->group(function () {
                Route::get('/{id}', [LevelDetailController::class, 'show'])->whereNumber('id')->name('show');
                Route::post('/{id}/courses', [LevelDetailController::class, 'storeCourse'])->name('courses.store');
                Route::put('/{id}/courses/{courseId}', [LevelDetailController::class, 'updateCourse'])->name('courses.update');
                Route::post('/', [LevelDetailController::class, 'store'])->name('store');
                Route::put('/{id}', [LevelDetailController::class, 'update'])->name('update');
            });

            Route::prefix('/admission-conditions')->name('admission-conditions.')->group(function () {
                Route::post('/{level}/copy-previous', [AdmissionConditionController::class, 'copyPrevious'])->whereNumber('level')->name('copy-previous');
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

    Route::post('/notifications/read-all', [EnrollmentNotificationController::class, 'readAllStudent'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/open', [EnrollmentNotificationController::class, 'openStudent'])->name('notifications.open');

    Route::prefix('student')->name('student.')->controller(StudentPortalController::class)->group(function () {
        Route::post('/profile', [StudentProfileController::class, 'update'])->name('profile.update');
        Route::post('/profile/password', [StudentProfileController::class, 'password'])->middleware('throttle:6,1')->name('profile.password');
        Route::get('/profile/photo', [StudentProfileController::class, 'photo'])->name('profile.photo');
        Route::get('/submissions/{submission}/download', 'downloadSubmission')->name('submissions.download');
        Route::get('/submissions/{submission}/versions/{version}', 'submissionVersion')->whereNumber('version')->name('submissions.version');
        Route::post('/official-documents', [\App\Modules\Documents\Infrastructure\Http\StudentDocumentController::class, 'submit'])->name('official-documents.submit');
        Route::post('/official-documents/requests/{ticket}', [\App\Modules\Documents\Infrastructure\Http\StudentDocumentController::class, 'transition'])->name('official-documents.transition');
        Route::get('/official-documents/{document:reference}', [\App\Modules\Documents\Infrastructure\Http\StudentDocumentController::class, 'download'])->whereUuid('document')->name('official-documents.download');
        Route::get('/results/official/{reference}/{kind}', [\App\Modules\Results\Infrastructure\Http\StudentResultsController::class, 'document'])
            ->whereUuid('reference')->where('kind', 'report|transcript')->name('results.document');
        Route::post('/results/official/{reference}/appeal', [\App\Modules\Results\Infrastructure\Http\StudentResultsController::class, 'appeal'])
            ->whereUuid('reference')->name('results.appeal');
        Route::get('/resources/{resource}/download', 'download')->name('resources.download');
        Route::get('/resources/{resource}/preview', 'preview')->name('resources.preview');
        Route::post('/resources/{resource}/submit', 'submit')->name('resources.submit');
        Route::get('/resources/{resource}/feedback', 'assessmentFeedback')->name('assessment.feedback');
        Route::post('/resources/{resource}/review', 'requestAssessmentReview')->name('assessment.review');
        Route::get('/payments/{payment}/receipt', 'receipt')->name('payments.receipt');
        Route::post('/welcome/acknowledge', 'acknowledgeWelcome')->name('welcome.acknowledge');
        Route::get('/enrollments', [\App\Modules\Student\Infrastructure\Http\Controllers\EnrollmentManagementController::class, 'student'])->name('enrollments');
        Route::post('/renewals/{progression}', 'startRenewal')->whereNumber('progression')->name('renewals.start');
        Route::post('/department', 'chooseDepartment')->name('department.choose');
        Route::post('/requests', 'requestService')->name('requests');
        Route::get('/absences', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'student'])->name('absences');
        Route::post('/absences/{attendance}', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'submit'])->name('absences.submit');
        Route::get('/absences/{case}/file', [\App\Modules\Teaching\Infrastructure\Http\Controllers\AbsenceController::class, 'file'])->name('absences.file');
        Route::get('/courses/{course}/{section?}', [StudentCourseController::class, 'show'])->whereNumber('course')->where('section', 'infos|sessions|online|files|evaluations|videos|attendance')->name('courses.show');
        Route::get('/{section?}', 'show')->where('section', 'overview|profile|card|academics|assessments|services|courses|schedule|materials|assignments|evaluations|results|fees|transactions|documents|announcements|requests')->name('index');
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
        Route::post('/{uuid}/withdraw', [EnrollmentController::class, 'withdraw'])->name('withdraw');

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
    Route::middleware(['role:admin', 'can:manage academic access'])->prefix('admin/enrollments')->name('admin.enrollments.')->group(function () {
        Route::get('/', [EnrollmentManagementController::class, 'index'])->name('index');
        Route::get('/overview', [EnrollmentManagementController::class, 'overview'])->name('overview');
        Route::get('/documents/{uuid}/preview', [EnrollmentManagementController::class, 'preview'])->name('documents.preview');
        Route::get('/documents/{uuid}/download', [EnrollmentManagementController::class, 'download'])->name('documents.download');
        Route::get('/campaigns', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\AdmissionCampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/campaigns', [\App\Modules\Enrollment\Infrastructure\Http\Controllers\AdmissionCampaignController::class, 'save'])->name('campaigns.save');
        Route::get('/{id}', [EnrollmentManagementController::class, 'show'])->name('show');
        Route::post('/{id}/start-analysis', [EnrollmentManagementController::class, 'startAnalysis'])->name('start-analysis');
        Route::post('/{id}/documents/{uuid}/review', [EnrollmentManagementController::class, 'reviewDocument'])->name('documents.review');
        Route::post('/{id}/request-corrections', [EnrollmentManagementController::class, 'requestCorrections'])->name('request-corrections');
        Route::post('/{id}/validate', [EnrollmentManagementController::class, 'validate'])->name('validate');
        Route::post('/{id}/reject', [EnrollmentManagementController::class, 'reject'])->name('reject');
    });
});

require __DIR__.'/academic-structure.php';

Route::get('/finance/receipts/{payment:uuid}/verify', [\App\Modules\Student\Infrastructure\Http\Controllers\FinanceController::class, 'verify'])->middleware(['signed', 'throttle:60,1'])->name('finance.receipts.verify');

Route::get('/verifier/document/{reference}', \App\Modules\Documents\Infrastructure\Http\DocumentVerificationController::class)
    ->middleware('throttle:30,1')->name('official-documents.verify');
