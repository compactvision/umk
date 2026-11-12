<?php

namespace App\Http\Middleware;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\FinancialAdjustment;
use App\Models\Student\ServiceRequest;
use App\Models\Student\StudentPayment;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

final class EnsureAcademicStaffScope
{
    public function handle(Request $request, Closure $next)
    {
        $value = $request->route('academic') ?? $request->query('academic');
        if ($value !== null) {
            if (! $value instanceof AcademicEnrollment) {
                Validator::validate(['academic' => $value], ['academic' => 'required|integer|min:1']);
            }
            $entry = $value instanceof AcademicEnrollment ? $value : AcademicEnrollment::findOrFail($value);
            Gate::authorize('view', $entry);
        }
        $models = [
            'payment' => StudentPayment::class,
            'adjustment' => FinancialAdjustment::class,
            'ticket' => ServiceRequest::class,
            'submission' => AcademicSubmission::class,
        ];
        foreach ($models as $parameter => $model) {
            if ($id = $request->route($parameter)) {
                $record = $id instanceof $model ? $id : $model::findOrFail($id);
                Gate::authorize('view', AcademicEnrollment::findOrFail($record->academic_enrollment_id));
            }
        }

        return $next($request);
    }
}
