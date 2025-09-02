<?php

namespace App\Http\Controllers\EnrollmentController;

use App\Http\Controllers\Controller;
use App\Http\Requests\Enrollment\StoreEnrollmentRequest;
use App\Http\Requests\Enrollment\UpdateEnrollmentRequest;
use App\Http\Requests\Enrollment\SubmitEnrollmentRequest;
use App\Models\Classes;
use App\Models\Enrollments;
use App\Models\Faculty;
use App\Models\Intake;
use App\Models\Level;
use App\Services\EnrollmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    //
    public function index(Request $request)
    {
        $enrollments = Enrollments::with(['class.level','class.faculty','class.intake'])
            ->where('user_id', $request->user()->id)
            ->latest()->paginate(10);

        return Inertia::render('dashboard/enrollments/Index', [
            'enrollments' => $enrollments,
        ]);
    }

    public function store(StoreEnrollmentRequest $request, EnrollmentService $svc)
    {
        $enr = $svc->createDraft($request->validated(), $request->user());
        return redirect()->route('dashboard.enrollments.show', $enr);
    }

    public function enrollmentsProcess(Request $request)
    {
        $validated = $request->validate([
            'faculty_id' => ['required','exists:faculties,id'],
            'level_id' => ['required','exists:levels,id'],
        ]);
        return Inertia::render('dashboard/enrollments/Enrollment', [
            'faculty_id' => $validated['faculty_id'],
            'level_id' => $validated['level_id'],
        ]);
    }

    public function show(Enrollments $enrollment)
    {
        // $this->authorize('view', $enrollment);

        $faculties = Faculty::select('id','name')->get();
        $levels    = Level::select('id','name','code')->get();
        $intakes   = Intake::select('id','name')->get();

        $classes   = Classes::withRemaining()
            ->with(['faculty:id,name','level:id,name,code','intake:id,name'])
            ->orderBy('intake_id','desc')
            ->get(['id','faculty_id','level_id','intake_id','section','capacity','status']);

        return Inertia::render('Enrollments/Wizard', [
            'enrollment' => $enrollment->load('class.level','class.faculty','class.intake','documents'),
            'faculties'  => $faculties,
            'levels'     => $levels,
            'intakes'    => $intakes,
            'classes'    => $classes,
            'canSubmit'  => $enrollment->status === 'DRAFT',
        ]);
    }

    public function update(UpdateEnrollmentRequest $request, Enrollments $enrollment, EnrollmentService $svc)
    {
        // $this->authorize('update', $enrollment);
        $svc->updateDraft($enrollment, $request->validated());
        return back(303);
    }

    public function submit(SubmitEnrollmentRequest $request, Enrollments $enrollment, EnrollmentService $svc)
    {
        // $this->authorize('submit', $enrollment);
        $svc->submit($enrollment);
        return redirect()->route('dashboard.enrollments.index')->with('success','Dossier soumis.');
    }

    // (optionnel) Upload document
    public function uploadDoc(Request $request, Enrollments $enrollment)
    {
       // $this->authorize('update', $enrollment);
        $data = $request->validate([
            'type' => ['required','string','in:ID_CARD,TRANSCRIPT,PHOTO,OTHER'],
            'file' => ['required','file','mimes:pdf,jpg,jpeg,png','max:5120'],
        ]);
        $file = $request->file('file');
        $path = $file->store("enrollments/{$enrollment->id}", config('filesystems.default'));
        $enrollment->documents()->create([
            'type' => $data['type'],
            'disk' => config('filesystems.default'),
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ]);
        return back(303);
    }
}
