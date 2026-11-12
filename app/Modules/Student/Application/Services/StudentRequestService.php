<?php

namespace App\Modules\Student\Application\Services;

use App\Models\Student\ServiceRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class StudentRequestService
{
    public function respond(ServiceRequest $ticket, User $actor, array $data): void
    {
        Gate::forUser($actor)->authorize('manage', $ticket->enrollment);
        DB::transaction(function () use ($ticket, $actor, $data) {
            $ticket = ServiceRequest::lockForUpdate()->findOrFail($ticket->id);
            abort_if($ticket->academic_official_result_id !== null || $ticket->official_document_type_id !== null, 403, 'Utilisez le suivi spécialisé de cette demande.');
            if ($ticket->status === $data['status'] && $ticket->response === $data['response']) {
                return;
            }
            $ticket->update($data + ['responded_by' => $actor->id]);
            Audit::record($actor->id, 'student_request_answered', $ticket);
        }, 3);
    }
}
