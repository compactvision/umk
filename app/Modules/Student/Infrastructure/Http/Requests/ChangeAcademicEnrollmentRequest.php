<?php

namespace App\Modules\Student\Infrastructure\Http\Requests;

use App\Modules\Student\Application\Services\AcademicEnrollmentService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ChangeAcademicEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', $this->route('academic')) ?? false;
    }

    public function rules(): array
    {
        return [
            'expected_status' => ['required', Rule::in(array_keys(AcademicEnrollmentService::TRANSITIONS))],
            'expected_context' => 'sometimes|string|size:64',
            'service_request_id' => 'nullable|integer|exists:student_service_requests,id',
            'student_response' => 'required_with:service_request_id|nullable|string|min:5|max:6000',
            'operation_key' => 'required|uuid', 'reason' => 'required|string|min:10|max:1000',
            'enrollment_status' => ['required', Rule::in(array_keys(AcademicEnrollmentService::TRANSITIONS))],
            'class_id' => 'sometimes|nullable|integer|exists:classes,id',
            'academic_department_id' => 'sometimes|nullable|integer|exists:academic_departments,id',
            'ends_at' => 'nullable|date|after:now',
        ];
    }
}
