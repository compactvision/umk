<?php

namespace App\Modules\Results\Infrastructure\Http;

use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOfficialResult;
use App\Modules\Results\Application\ResultAppeals;
use App\Modules\Results\Application\ResultDocuments;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Infrastructure\Http\Controllers\StudentPortalController;
use App\Support\DocumentUploadLimit;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

final class StudentResultsController
{
    public function __construct(private AcademicAccessService $access, private ResultAppeals $appeals) {}

    public function presentation(Request $request, AcademicEnrollment $entry): array
    {
        if (! $this->access->decision($entry, 'results_view')['allowed']) {
            return ['items' => null, 'selected' => null];
        }
        $input = $request->validate(['official' => 'nullable|uuid']);
        $query = $this->scope($entry);
        $selected = isset($input['official']) ? (clone $query)->where('academic_official_results.reference', $input['official'])->firstOrFail() : (clone $query)->first();

        return [
            'items' => $query->paginate(15, ['academic_official_results.*'], 'official_page')->withQueryString()->through(fn ($row) => $this->summary($row)),
            'selected' => $selected ? $this->summary($selected) + [
                'credits' => $selected->snapshot['credits'],
                'periods' => $selected->snapshot['periods'],
                'units' => collect($selected->snapshot['units'])->map(fn ($unit) => Arr::only($unit, ['id', 'name', 'code', 'period_code', 'credits', 'earned_credits', 'grade', 'status']) + [
                    'items' => collect($unit['items'])->map(fn ($item) => Arr::only($item, ['id', 'name', 'code', 'credits', 'coefficient', 'grade', 'status', 'selected'])),
                ]),
                'deadline' => $this->appeals->deadline($selected),
                'can_appeal' => $this->appeals->deadline($selected)?->gte(now()) ?? false,
                'appeals' => $entry->serviceRequests()->where('academic_official_result_id', $selected->id)->get(['id', 'result_target', 'status', 'response', 'created_at']),
            ] : null,
        ];
    }

    public function document(Request $request, string $reference, string $kind, StudentPortalController $portal, ResultDocuments $documents)
    {
        [$entry, $result] = $this->resolve($request, $reference, $portal);

        return $documents->issue($result->run, $request->user(), $kind, $result);
    }

    public function appeal(Request $request, string $reference, StudentPortalController $portal)
    {
        [$entry, $result] = $this->resolve($request, $reference, $portal);
        $input = $request->validate(['target' => ['required', 'string', 'regex:/^(decision|ec:[0-9]+)$/D', 'max:80'], 'body' => 'required|string|min:10|max:6000',
            'file' => 'nullable|file|max:'.DocumentUploadLimit::kilobytes().'|extensions:pdf,jpg,jpeg,png,webp']);
        $appeal = $this->appeals->submit($result, $entry, $request->user(), $input, $request->file('file'));

        return back(303)->with('success', 'Recours enregistré · Référence '.$appeal->id);
    }

    private function resolve(Request $request, string $reference, StudentPortalController $portal): array
    {
        $entry = $portal->context($request);
        abort_unless($this->access->decision($entry, 'results_view')['allowed'], 403);

        return [$entry, $this->scope($entry)->where('academic_official_results.reference', $reference)->firstOrFail()];
    }

    private function scope(AcademicEnrollment $entry)
    {
        return AcademicOfficialResult::published()->where('academic_enrollment_id', $entry->id)
            ->join('academic_deliberations', 'academic_deliberations.id', '=', 'academic_official_results.academic_deliberation_id')
            ->orderByDesc('academic_deliberations.published_at')->orderByDesc('academic_deliberations.id')
            ->select('academic_official_results.*')->with('run.rule');
    }

    private function summary(AcademicOfficialResult $row): array
    {
        return ['reference' => $row->reference, 'edition' => $row->run->edition, 'published_at' => $row->run->published_at,
            'decision' => $row->run->context['decisions'][$row->decision]['label'], 'annual' => $row->snapshot['annual'],
            'context' => Arr::only($row->run->context, ['program', 'level', 'year', 'session', 'credit_label', 'scale']),
            'ordinary_reference' => $row->snapshot['ordinary_reference'],
        ];
    }
}
