<?php

namespace App\Modules\Documents\Infrastructure\Http;

use App\Models\Student\OfficialDocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class DocumentCommandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $reason = 'required|string|min:5|max:2000';
        $revision = 'required|integer|min:1';
        $asset = 'nullable|file|extensions:png|mimes:png|max:256|dimensions:max_width=1200,max_height=1200';

        return match ($this->route()->getActionMethod()) {
            'type' => [
                'university_id' => 'required|integer|min:1', 'faculty_id' => 'required|integer|min:1',
                'code' => 'required|alpha_dash:ascii|max:25', 'name' => 'required|string|max:140',
                'kind' => ['required', Rule::in(OfficialDocumentType::KINDS)], 'student_request' => 'required|boolean',
                'download' => 'required|boolean', 'print' => 'required|boolean', 'copies' => 'required|boolean', 'financial_gate' => 'required|boolean',
                'valid_days' => 'nullable|integer|between:0,3650', 'decisions' => 'nullable|string|max:600|regex:/^[a-z0-9_,\s-]+$/D',
                'minimum_credits' => 'nullable|integer|between:0,10000000', 'program_id' => 'nullable|integer|min:1',
                'regulation' => 'nullable|string|max:500', 'retention' => 'nullable|string|max:500', 'reason' => $reason,
            ],
            'activate' => ['active' => 'required|boolean', 'reason' => $reason],
            'template' => [
                'title' => 'required|string|max:140', 'body' => 'required|string|max:3500',
                'signer_id' => 'required|integer|min:1', 'capacity' => 'required|string|max:140', 'reason' => $reason,
                'width_mm' => 'nullable|numeric|between:65,110', 'height_mm' => 'nullable|numeric|between:45,80',
                'margin_mm' => 'nullable|integer|between:2,8', 'color' => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/D',
                'logo' => $asset, 'signature' => $asset, 'stamp' => $asset,
            ],
            'templateState' => ['action' => 'required|in:approve,withdraw', 'reason' => $reason],
            'submit' => ['type_id' => 'required|integer|min:1', 'action' => 'required|in:initial,duplicate,replace',
                'previous_id' => 'nullable|integer|min:1', 'reason' => $reason, 'operation_key' => 'required|uuid'],
            'transition' => ['action' => 'required|in:review,correct,resubmit,refuse,approve,recheck', 'revision' => $revision, 'reason' => $reason,
                'mandate' => 'nullable|string|min:5|max:1000'],
            'issue' => ['revision' => $revision],
            'lifecycle' => ['action' => 'required|in:print,deliver,revoke', 'reason' => $reason],
            'revokeResult' => ['reason' => $reason],
            default => [],
        };
    }
}
