<?php

use App\Modules\AcademicStructure\Infrastructure\Http\Controllers\DepartmentOrientationController;
use App\Modules\AcademicStructure\Infrastructure\Http\Controllers\StructureController;
use Illuminate\Support\Facades\Route;

Route::prefix('dashboard/admin/academic-structure')->name('dashboard.admin.academic-structure.')->middleware(['auth', 'verified', 'role:admin'])->controller(StructureController::class)->group(function () {
    Route::get('/', 'index')->name('index');
    Route::put('/levels/{level}/department-options', [DepartmentOrientationController::class, 'update'])->whereNumber('level')->name('department-options.update');
    Route::post('/references/{kind}/{id?}', 'reference')->where('kind', 'university|faculty-context|year-context|group-promotion|department|cycle|program|cohort|promotion')->whereNumber('id')->name('references');
    Route::post('/versions/annual-batch', 'annualDrafts')->name('versions.annual-batch');
    Route::post('/versions', 'draft')->name('versions.store');
    Route::put('/versions/{version}', 'save')->whereNumber('version')->name('versions.update');
    Route::post('/versions/{version}/schedule', 'draftSchedule')->whereNumber('version')->name('versions.schedule');
    Route::post('/versions/{version}/levels/{level}/approve', 'approveLevel')->whereNumber(['version', 'level'])->name('versions.levels.approve');
    Route::post('/versions/{version}/transition', 'transition')->whereNumber('version')->name('versions.transition');
    Route::post('/versions/{version}/bind', 'bind')->whereNumber('version')->name('versions.bind');
});
