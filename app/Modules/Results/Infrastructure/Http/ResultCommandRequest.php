<?php

namespace App\Modules\Results\Infrastructure\Http;

use Illuminate\Foundation\Http\FormRequest;

final class ResultCommandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    public function rules(): array
    {
        $reason = 'required|string|min:5|max:2000';
        $revision = 'required|integer|min:1';

        return match ($this->route()->getActionMethod()) {
            'storeRule' => [
                'level_id' => 'required|integer|min:1', 'session_code' => 'required|alpha_dash:ascii|max:60',
                'code' => 'required|alpha_dash:ascii|max:60', 'reference' => 'required|string|max:255',
                'effective_on' => 'required|date_format:Y-m-d', 'configuration' => 'required|array',
            ],
            'approveRule' => ['reason' => $reason],
            'prepare' => [
                'meeting_at' => 'required|date_format:Y-m-d\TH:i', 'chair' => 'required|integer|min:1',
                'secretary' => 'required|integer|min:1', 'members' => 'required|array|min:2|max:25', 'members.*' => 'required|integer|min:1|distinct',
                'previous_id' => 'nullable|integer|min:1', 'appeal_id' => 'nullable|integer|min:1', 'reason' => $reason,
                'equivalences' => 'nullable|array|max:1000', 'equivalences.*' => 'array:enrollment,item,reference',
                'equivalences.*.enrollment' => 'required|integer|min:1', 'equivalences.*.item' => 'required|integer|min:1',
                'equivalences.*.reference' => 'required|string|max:255',
            ],
            'transition' => [
                'action' => 'required|in:open,approve,publish,abandon', 'reason' => $reason, 'revision' => $revision, 'notify' => 'boolean',
                'attendance' => 'required_if:action,open|array|max:25', 'attendance.*' => 'required|integer|min:1|distinct',
            ],
            'decision' => ['decision' => 'required|alpha_dash:ascii|max:60', 'reason' => $reason, 'revision' => $revision],
            'review' => ['action' => 'required|in:review,admit,inadmissible,investigate,accept,reject', 'reason' => $reason,
                'revision' => $revision, 'assigned_to' => 'required_if:action,investigate|nullable|integer|min:1'],
            default => [],
        };
    }
}
