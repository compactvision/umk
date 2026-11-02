<?php

namespace App\Modules\Enrollment\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Notifications\EnrollmentDocumentReplacement;
use Illuminate\Http\Request;

class EnrollmentNotificationController extends Controller
{
    public function open(Request $request, string $notification)
    {
        $notice = $request->user()->notifications()->where('type', EnrollmentDocumentReplacement::class)->findOrFail($notification);
        $entry = \App\Models\Enrollment::findOrFail($notice->data['enrollment_id']);
        $document = $entry->documents()->where('uuid', $notice->data['document_uuid'])->firstOrFail();
        $notice->markAsRead();

        return redirect('/dashboard/admin/enrollments/'.$entry->id.'?'.http_build_query(['document' => $document->uuid]).'#review-document-'.$document->uuid, 303);
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications()->where('type', EnrollmentDocumentReplacement::class)->update(['read_at' => now()]);

        return back();
    }

    public function openStudent(Request $request, string $notification)
    {
        $notice = $request->user()->notifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class])->findOrFail($notification);
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
        $request->user()->unreadNotifications()->whereIn('type', [\App\Notifications\EnrollmentDocumentReviewed::class, \App\Notifications\StudentAdmissionActivated::class])->update(['read_at' => now()]);

        return back();
    }
}
