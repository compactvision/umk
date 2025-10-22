<?php
// app/Modules/Enrollment/Infrastructure/Http/Requests/EnrollmentStoreRequest.php
namespace App\Modules\Enrollment\Infrastructure\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\AcademicYear;
use App\Models\AdmissionCondition;
use App\Models\Enrollment;
use App\Models\Level;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;
use Illuminate\Support\Str;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'faculty_id' => ['required','integer','exists:faculties,id'],
            'level_id'   => ['required','integer','exists:levels,id'],
            'year_id'    => ['required','integer','exists:academic_years,id'],

            'name'       => ['required','string','max:255'],
            'email'      => ['required','email','max:255'],
            'program'    => ['nullable','string','max:255'],

            'documents'  => ['array'],
            'documents.*'=> ['file','max:5120','mimes:pdf,jpg,jpeg,png'],

            // jamais persistés (contrôlés côté paiement/PSP)
            'cardNumber' => ['nullable','string','max:32'],
            'cvv'        => ['nullable','string','max:4'],
        ];
    }

    public function withValidator(Validator $validator)
    {
        $validator->after(function (Validator $v) {
            // année active
            $yearId = (int)$this->integer('year_id');
            $isActive = AcademicYear::where('id',$yearId)->where('status', 'open')->exists();
            if (!$isActive) {
                $v->errors()->add('year_id', 'Année académique inactive.');
            }

            // level ↔ faculty
            $level = Level::find($this->integer('level_id'));
            if ($level && (int)$level->faculty_id !== (int)$this->integer('faculty_id')) {
                $v->errors()->add('level_id', 'Le niveau sélectionné n’appartient pas à la faculté choisie.');
            }

            // documents requis dynamiques
            $requiredKeys = $this->requiredDocumentKeys(
                (int)$this->integer('faculty_id'),
                (int)$this->integer('level_id')
            );

            // prendre en compte les docs déjà uploadés en draft (privé)
            $draft = Enrollment::where('student_id', Auth::user()->id)->where('status','draft')->first();
            $draftKeys = $draft
                ? $draft->documents()->pluck('key')->toArray()
                : [];

            foreach ($requiredKeys as $docKey) {
                $hasNow   = $this->file("documents.$docKey") !== null;
                $hasDraft = in_array($docKey, $draftKeys, true);
                if (!$hasNow && !$hasDraft) {
                    $v->errors()->add("documents.$docKey", "Le document « $docKey » est requis.");
                }
            }
        });
    }

    private function requiredDocumentKeys(int $facultyId, int $levelId): array
    {
        $sections = ['personal_info','academic_info'];

        $collect = function(string $section) use ($facultyId,$levelId) {
            $byLevel = AdmissionCondition::query()
                ->where('section',$section)->where('level_id',$levelId)->where('is_required',true)
                ->get(['title']);
            if ($byLevel->isNotEmpty()) {
                return $byLevel->map(fn($c)=> Str::slug($c->title,'_'))->all();
            }

            if ($facultyId) {
                $byFaculty = AdmissionCondition::query()
                    ->where('section',$section)->whereNull('level_id')->where('faculty_id',$facultyId)->where('is_required',true)
                    ->get(['title']);
                if ($byFaculty->isNotEmpty()) {
                    return $byFaculty->map(fn($c)=> Str::slug($c->title,'_'))->all();
                }
            }

            $globals = AdmissionCondition::query()
                ->where('section',$section)->whereNull('level_id')->whereNull('faculty_id')->where('is_required',true)
                ->get(['title']);

            return $globals->map(fn($c)=> Str::slug($c->title,'_'))->all();
        };

        return array_values(array_unique(array_merge(
            $collect('personal_info'),
            $collect('academic_info'),
        )));
    }
}
