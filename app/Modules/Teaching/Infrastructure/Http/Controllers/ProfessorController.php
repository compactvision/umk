<?php

namespace App\Modules\Teaching\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Courses;
use App\Models\Professor;
use App\Models\Student\AcademicOffering;
use App\Modules\Student\Application\Services\Audit;
use App\Modules\Teaching\Application\Services\TeachingAssignmentService;
use App\Modules\Teaching\Infrastructure\Http\Requests\SaveProfessorRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfessorController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => 'nullable|string|max:150', 'status' => 'nullable|in:active,inactive']);
        $query = Professor::query()->when($filters['q'] ?? null, fn ($q, $term) => $q->where(fn ($s) => $s
            ->where('first_name', 'like', "%{$term}%")->orWhere('last_name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%")->orWhere('speciality', 'like', "%{$term}%")))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('is_active', $status === 'active'));
        return Inertia::render('dashboard/professors/Index', [
            'professors' => $query->withCount('offerings')->orderBy('last_name')->orderBy('first_name')->paginate(12)->withQueryString()->through(fn (Professor $professor) => $professor->toArray() + ['photo_url' => $professor->portraitUrl()]),
            'filters' => $filters,
            'canInvite' => ProfessorInvitationController::canInvite($request->user()),
            'stats' => ['total' => Professor::count(), 'active' => Professor::where('is_active', true)->count(), 'assignments' => AcademicOffering::whereNotNull('professor_id')->count()],
            'catalog' => Courses::with(['level.faculty:id,name', 'level.departmentOptions' => fn ($q) => $q->where('is_active', true)->orderBy('name')])->orderBy('title')->get(['id', 'level_id', 'title', 'code', 'semester']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'canAssign' => $request->user()->can('publish academic content'),
        ]);
    }

    public function show(Professor $professor, Request $request)
    {
        return Inertia::render('dashboard/professors/Show', [
            'professor' => $professor->toArray() + ['photo_url' => $professor->portraitUrl()],
            'invitationPending' => $professor->invitation_expires_at?->isFuture() ?? false,
            'canLinkAccount' => $request->user()->can('manage users') && ! $request->user()->academicFaculties()->exists(),
            'linkedAccount' => $request->user()->can('manage users') && ! $request->user()->academicFaculties()->exists() && $professor->user_id
                ? \App\Models\User::find($professor->user_id)?->email : null,
            'professors' => Professor::where('is_active', true)->orWhere('id', $professor->id)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'is_active']),
            'assignments' => $professor->offerings()->when($request->user()->academicFaculties()->exists(), fn ($q) => $q->whereHas('level', fn ($l) => $l->whereIn('faculty_id', $request->user()->academicFaculties()->select('faculties.id'))))->with(['course', 'level.faculty', 'academicYear', 'group.intake', 'department:id,name'])->orderByDesc('academic_year_id')->get(),
            'catalog' => Courses::with(['level.faculty:id,name', 'level.departmentOptions' => fn ($q) => $q->where('is_active', true)->orderBy('name')])->orderBy('title')->get(['id', 'level_id', 'title', 'code', 'semester']),
            'years' => AcademicYear::orderByDesc('start_date')->get(['id', 'title']),
            'canAssign' => $request->user()->can('publish academic content'),
        ]);
    }

    public function store(SaveProfessorRequest $request, ProfessorInvitationController $invitations)
    {
        $send = $request->boolean('send_invitation');
        abort_if($send && ! ProfessorInvitationController::canInvite($request->user()), 403);
        $professor = Professor::create($request->safe()->except('send_invitation'));
        Audit::record($request->user()->id, 'professor_created', $professor);
        $destination = to_route('dashboard.admin.professors.show', $professor);
        if ($send) {
            try {
                $invitations->deliver($professor, $request->user());
            } catch (\Illuminate\Validation\ValidationException $exception) {
                return $destination->withErrors($exception->errors());
            }
        }

        return $destination->with('success', $send ? 'Enseignant ajouté et invitation envoyée par e-mail.' : 'Enseignant ajouté.');
    }

    public function update(SaveProfessorRequest $request, Professor $professor)
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $professor) {
            $profile = Professor::lockForUpdate()->findOrFail($professor->id);
            $profile->fill($request->safe()->except('send_invitation'));
            if ($profile->isDirty('email') || ! $profile->is_active) {
                $profile->forceFill(['invitation_hash' => null, 'invitation_expires_at' => null]);
            }
            $profile->save();
            Audit::record($request->user()->id, 'professor_updated', $profile);
        }, 3);

        return back()->with('success', 'Enseignant mis à jour.');
    }

    public function assign(Request $request, TeachingAssignmentService $service, ?int $offering = null)
    {
        abort_unless($request->user()->can('publish academic content'), 403);
        $data = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'academic_year_id' => 'required|integer|exists:academic_years,id',
            'academic_department_id' => 'nullable|integer|exists:academic_departments,id',
            'professor_id' => [$offering ? 'nullable' : 'required', 'integer', Rule::exists('professors', 'id')],
            'is_published' => 'required|boolean',
            'assistant_professor_id' => ['nullable', 'integer', 'different:professor_id', Rule::exists('professors', 'id')->where('is_active', true)],
            'group_leader_name' => 'nullable|string|max:180', 'delivery_mode' => 'sometimes|in:in_person,online,hybrid',
        ]);
        $service->save($data, $request->user()->id, $offering);
        return back()->with('success', 'Affectation enregistrée.');
    }
    public function account(Request $request, Professor $professor)
    {
        abort_unless($request->user()->can('manage users') && ! $request->user()->academicFaculties()->exists(), 403);
        $data = $request->validate(['email' => 'nullable|email|max:255', 'reason' => 'required|string|min:10|max:1000']);
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $professor, $data) {
            $account = empty($data['email']) ? null : \App\Models\User::role('professor')->whereNotNull('email_verified_at')->where('email', $data['email'])->lockForUpdate()->first();
            if ((! empty($data['email']) && ! $account) || ($account && Professor::where('user_id', $account->id)->whereKeyNot($professor->id)->exists())) {
                throw \Illuminate\Validation\ValidationException::withMessages(['email' => 'Choisissez un compte enseignant vérifié qui n’est pas déjà associé.']);
            }
            $profile = Professor::lockForUpdate()->findOrFail($professor->id);
            $old = $profile->user_id;
            if ((int) $old !== (int) $account?->id) {
                $profile->forceFill(['user_id' => $account?->id, 'invitation_hash' => null, 'invitation_expires_at' => null])->save();
                Audit::record($request->user()->id, 'professor_account_link_changed', $profile, $data['reason'], ['from' => $old, 'to' => $account?->id]);
            }
        }, 3);
        return back(303)->with('success', 'Rattachement du compte mis à jour.');
    }
}
