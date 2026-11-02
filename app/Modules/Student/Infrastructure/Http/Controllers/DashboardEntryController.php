<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardEntryController
{
    public function __invoke(Request $request)
    {
        if ($request->user()->hasRole('admin')) {
            return Inertia::render('dashboard/index/Index');
        }
        if ($request->user()->hasRole('student') && $request->user()->studentProfile()->exists()) {
            return redirect('/dashboard/student');
        }
        if ($request->user()->hasAnyRole(['user', 'candidate'])) {
            return redirect('/dashboard/enrollments');
        }

        return Inertia::render('dashboard/index/Index');
    }
}
