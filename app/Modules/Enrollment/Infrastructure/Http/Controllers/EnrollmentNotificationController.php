<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Notifications\EnrollmentDocumentReplacement;
use Illuminate\Http\Request;

class EnrollmentNotificationController extends Controller
{
    public function open(Request $request, string $notification)
    {
        $notice = $request->user()->notifications()->whereIn('type', [EnrollmentDocumentReplacement::class, \App\Notifications\AcademicScheduleNotice::class])->findOrFail($notification);
        if ($notice->type === \App\Notifications\AcademicScheduleNotice::class) {
            $notice->markAsRead();
            return to_route('dashboard.admin.schedule.absences', [], 303);
        }
        $entry = \App\Models\Enrollment::findOrFail($notice->data['enrollment_id']);
        $document = $entry->documents()->where('uuid', $notice->data['document_uuid'])->firstOrFail();
        $notice->markAsRead();

        return redirect('/dashboard/admin/enrollments/'.$entry->id.'?'.http_build_query(['document' => $document->uuid]).'#review-document-'.$document->uuid, 303);
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications()->whereIn('type', [EnrollmentDocumentReplacement::class, \App\Notifications\AcademicScheduleNotice::class])->update(['read_at' => now()]);

        return back();
    }

    public function openStudent(Request $request, string $notification)
    {
        $notice = $request->user()->notifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class, \App\Notifications\AcademicEnrollmentChanged::class, \App\Notifications\FinancialOperationNotice::class, \App\Notifications\AcademicScheduleNotice::class, \App\Notifications\LearningContentNotice::class, \App\Notifications\AcademicAssessmentNotice::class, \App\Notifications\OfficialResultNotice::class, \App\Notifications\OfficialDocumentNotice::class])->findOrFail($notification);
        if ($notice->type === \App\Notifications\OfficialDocumentNotice::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404);
            $notice->markAsRead();

            return to_route('dashboard.student.index', ['section' => $notice->data['section'], 'academic' => $academic->id], 303);
        }
        if ($notice->type === \App\Notifications\OfficialResultNotice::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404);
            $notice->markAsRead();

            return to_route('dashboard.student.index', ['section' => 'results', 'academic' => $academic->id], 303);
        }
        if ($notice->type === \App\Notifications\AcademicAssessmentNotice::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404);
            $notice->markAsRead();
            $parameters = ['section' => $notice->data['section'], 'academic' => $academic->id];
            if ($notice->data['status'] !== 'cancelled') {
                $parameters['work'] = $notice->data['resource_id'];
            }

            return to_route('dashboard.student.index', $parameters, 303);
        }
        if ($notice->type === \App\Notifications\LearningContentNotice::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404);
            $notice->markAsRead();

            return to_route('dashboard.student.courses.show', ['course' => $notice->data['course_id'],
                'section' => $notice->data['section'], 'academic' => $academic->id], 303);
        }
        if ($notice->type === \App\Notifications\AcademicScheduleNotice::class) {
            $notice->markAsRead();
            if ($request->user()->hasRole('professor') && ! isset($notice->data['academic_enrollment_id'])) {
                return to_route('dashboard.teaching.index', ['offering' => $notice->data['offering_id']], 303);
            }
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id'] ?? -1);
            abort_unless($academic, 404);
            if ($notice->data['absence'] ?? false) {
                return to_route('dashboard.student.absences', [], 303);
            }
            return to_route('dashboard.student.index', ['section' => 'schedule', 'academic' => $academic->id, 'week' => $notice->data['week']], 303);
        }
        if ($notice->type === \App\Notifications\FinancialOperationNotice::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404); $notice->markAsRead();
            return redirect()->route('dashboard.student.index', ['section' => 'transactions', 'academic' => $academic->id], 303);
        }
        if ($notice->type === \App\Notifications\AcademicEnrollmentChanged::class) {
            $academic = $request->user()->studentProfile?->enrollments()->findOrFail($notice->data['academic_enrollment_id']);
            abort_unless($academic, 404);
            $notice->markAsRead();
            return ! empty($notice->data['progression'])
                ? to_route('dashboard.student.index', ['section' => 'academics', 'academic' => $academic->id], 303)
                : to_route('dashboard.student.enrollments', [], 303);
        }
        $entry = $request->user()->enrollments()->findOrFail($notice->data['enrollment_id']);
        if ($notice->type === \App\Notifications\StudentAdmissionActivated::class) {
            $academic = $request->user()->studentProfile?->enrollments()->where('application_id', $entry->id)->firstOrFail();
            abort_unless($academic, 404);
            $notice->markAsRead();

            return redirect('/dashboard/student?academic='.$academic->id, 303);
        }
        $document = $entry->documents()->where('uuid', $notice->data['document_uuid'])->firstOrFail();
        $notice->markAsRead();

        return redirect('/dashboard/enrollments/'.$entry->uuid.'?'.http_build_query(['document' => $document->uuid]).'#student-document-'.$document->uuid, 303);
    }

    public function readAllStudent(Request $request)
    {
        $request->user()->unreadNotifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class, \App\Notifications\AcademicEnrollmentChanged::class, \App\Notifications\FinancialOperationNotice::class, \App\Notifications\AcademicScheduleNotice::class, \App\Notifications\LearningContentNotice::class, \App\Notifications\AcademicAssessmentNotice::class, \App\Notifications\OfficialResultNotice::class, \App\Notifications\OfficialDocumentNotice::class])->update(['read_at' => now()]);

        return back();
    }
}
