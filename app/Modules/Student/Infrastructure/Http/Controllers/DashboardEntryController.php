<?php

namespace App\Modules\Student\Infrastructure\Http\Controllers;

use App\Modules\Student\Application\Services\AdminDashboard;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardEntryController
{
    public function __invoke(Request $request, AdminDashboard $dashboard)
    {
        if ($request->user()->hasRole('admin')) {
            return Inertia::render('dashboard/index/Index', [
                'dashboard' => $dashboard->for($request->user()),
            ]);
        }
        if ($request->user()->hasRole('student') && $request->user()->studentProfile()->exists()) {
            return redirect('/dashboard/student');
        }
        if ($request->user()->hasRole('professor')) {
            return to_route('dashboard.teaching.index');
        }
        if ($request->user()->hasAnyRole(['user', 'candidate'])) {
            return redirect('/dashboard/enrollments');
        }

        return Inertia::render('dashboard/index/Index');
    }
}
