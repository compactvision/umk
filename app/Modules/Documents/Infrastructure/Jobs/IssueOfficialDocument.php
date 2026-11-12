<?php

namespace App\Modules\Documents\Infrastructure\Jobs;

use App\Models\Student\ServiceRequest;
use App\Models\User;
use App\Modules\Documents\Application\DocumentWorkflow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class IssueOfficialDocument implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(private int $requestId, private int $actorId, private int $revision) {}

    public function handle(DocumentWorkflow $workflow): void
    {
        $actor = User::whereNotNull('email_verified_at')->findOrFail($this->actorId);
        $workflow->issue(ServiceRequest::findOrFail($this->requestId), $actor, $this->revision);
    }
}
