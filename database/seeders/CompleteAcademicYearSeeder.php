<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AdmissionCondition;
use App\Models\Courses;
use App\Models\Enrollment;
use App\Models\EnrollmentDocument;
use App\Models\EnrollmentEvent;
use App\Models\Faculty;
use App\Models\Level;
use App\Models\LevelDetail;
use App\Models\Professor;
use App\Models\Student\AcademicAttendance;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AcademicSemester;
use App\Models\Student\AcademicSubmission;
use App\Models\Student\StudentPayment;
use App\Models\User;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use App\Modules\Student\Application\Services\StudentAdmissionService;
use App\Modules\Student\Application\Services\StudentFinanceService;
use App\Modules\Teaching\Application\Services\DemoYearSchedule;
use App\Modules\Teaching\Application\Services\TeachingAssignmentService;
use Carbon\CarbonImmutable as Date;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/** Complete, explicitly fictional scenario. No notifications or provider payments are sent. */
class CompleteAcademicYearSeeder extends Seeder
{
    private const FACULTIES = ['MED' => 'Médecine humaine', 'SP' => 'Santé publique', 'SSPA' => 'Sciences sociales, politiques et administratives', 'DR' => 'Droit', 'THEO' => 'Théologie'];

    public function run(): void
    {
        $this->call([RolePermissionSeeder::class, LevelCodeSeeder::class]);
        $password = config('academic_demo.password') ?: Str::password(24);
        $newAccounts = 0;
        $summary = DB::transaction(function () use ($password, &$newAccounts) {
            AcademicYear::orderBy('id')->lockForUpdate()->get();
            $year = $this->year();
            $actor = $this->account('demo.admin@usk.example.test', 'Administration', 'Démonstration', $password, 'admin', $newAccounts);
            $levels = $this->catalog();
            $this->callWith(ProposedCurriculaSeeder::class, ['levelIds' => $levels->modelKeys()]);
            $programs = json_decode(file_get_contents(__DIR__.'/data/course-teaching-specialities.json'), true, flags: JSON_THROW_ON_ERROR);
            $courses = Courses::with('level.faculty')->whereIn('level_id', $levels->modelKeys())->get()->filter(fn ($course) => isset($programs[$course->level->faculty->code.':'.$course->level->code.':'.$course->title]));
            $this->callWith(CoursePedagogySeeder::class, ['courseIds' => $courses->modelKeys()]);
            $this->call(DemoProfessorsSeeder::class);
            $this->semesters($year);
            foreach ($courses as $course) {
                if (AcademicOffering::where('academic_year_id', $year->id)->where('course_id', $course->id)->exists()) {
                    continue;
                }
                $key = $course->level->faculty->code.':'.$course->level->code.':'.$course->title;
                $professor = Professor::where('speciality', $programs[$key])->where('is_active', true)->orderBy('id')->first();
                if (! $professor) {
                    throw new RuntimeException('Enseignant actif de spécialité manquant pour '.$course->title.'. Aucun profil existant n’a été écrasé.');
                }
                app(TeachingAssignmentService::class)->save(['course_id' => $course->id, 'academic_year_id' => $year->id, 'professor_id' => $professor->id, 'is_published' => true], $actor->id);
            }
            $offerings = AcademicOffering::with(['course', 'level.faculty'])->where('academic_year_id', $year->id)->whereIn('course_id', $courses->modelKeys())->orderBy('id')->get();
            $this->command?->info('Planification des séances de '.$year->title.' (les horaires existants sont conservés)…');
            $added = app(DemoYearSchedule::class)->generate($year, $offerings, $actor->id);
            foreach ($offerings as $offering) {
                $this->resources($offering, $year);
            }
            $students = 0;
            foreach ($levels as $level) {
                foreach (range(1, (int) config('academic_demo.students_per_level', 3)) as $number) {
                    $entry = $this->student($level, $year, $actor, $number, $password, $newAccounts);
                    $this->tracking($entry, $actor, $number);
                    $students++;
                }
            }

            return ['année' => $year->title, 'niveaux' => $levels->count(), 'cours' => $courses->count(), 'affectations' => $offerings->count(), 'séances ajoutées' => $added, 'étudiants' => $students];
        });
        foreach ($summary as $label => $value) {
            $this->command?->info($label.' : '.$value);
        }
        if ($newAccounts && ! config('academic_demo.password')) {
            $this->command?->warn('Mot de passe généré pour les nouveaux comptes de démonstration (à conserver) : '.$password);
        }
        $this->command?->info('Comptes réservés .example.test. Aucun email, débit réel ni publication des niveaux de démonstration.');
    }

    private function year(): AcademicYear
    {
        $today = Date::now('Africa/Kinshasa');
        $configured = config('academic_demo.year');
        if (! $configured) {
            $open = AcademicYear::where('status', 'open')->whereDate('start_date', '<=', $today)->whereDate('end_date', '>=', $today)->get();
            if ($open->count() > 1) {
                throw new RuntimeException('Plusieurs années ouvertes couvrent la date courante. Corrigez cette incohérence avant de semer les données.');
            }
            if ($open->count() === 1) {
                return $open->first();
            }
        }
        $startYear = $today->month >= 10 ? $today->year : $today->year - 1;
        $title = $configured ?: $startYear.'-'.($startYear + 1);
        if (! preg_match('/^(\d{4})[-–](\d{4})$/u', $title, $match) || (int) $match[2] !== (int) $match[1] + 1) {
            throw new RuntimeException('DEMO_ACADEMIC_YEAR doit être au format 2026-2027, avec deux années consécutives.');
        }
        $existing = AcademicYear::whereIn('title', [$match[1].'-'.$match[2], $match[1].'–'.$match[2]])->first();
        if ($existing) {
            return $existing;
        }
        $start = Date::create((int) $match[1], 10, 1, 0, 0, 0, 'Africa/Kinshasa');
        $end = $start->addYear()->subDay();

        return AcademicYear::create(['title' => $match[1].'-'.$match[2], 'start_date' => $start->toDateString(), 'end_date' => $end->toDateString(), 'status' => ! AcademicYear::where('status', 'open')->exists() && $today->betweenIncluded($start, $end->endOfDay()) ? 'open' : 'draft']);
    }

    private function account(string $email, string $first, string $last, string $password, string $role, int &$count): User
    {
        $user = User::where('email', $email)->first();
        if (! $user) {
            $user = (new User)->forceFill(['first_name' => $first, 'last_name' => $last, 'email' => $email, 'password' => $password, 'email_verified_at' => now()]);
            $user->save();
            $count++;
        }
        $user->assignRole($role);

        return $user;
    }

    private function catalog()
    {
        $ids = [];
        foreach (self::FACULTIES as $code => $name) {
            $faculty = Faculty::firstOrCreate(['code' => $code], ['name' => $name, 'description' => 'Faculté utilisée dans le scénario académique de démonstration.', 'is_active' => false]);
            foreach (range(1, 3) as $number) {
                $level = Level::firstOrCreate(['faculty_id' => $faculty->id, 'code' => 'L'.$number], ['title' => 'Licence '.$number.' — '.$faculty->name, 'description' => 'Programme proposé pour la démonstration, à valider avant une utilisation institutionnelle.', 'tag' => 'Démonstration', 'is_active' => false, 'image' => '/assets/usk/academic.jpg']);
                $detail = LevelDetail::firstOrCreate(['level_id' => $level->id], ['duration_years' => 1, 'language' => 'Français', 'credit_required' => 60, 'options' => []]);
                [$first, $second, $foreignFirst, $foreignSecond] = AdmissionPricingSeeder::PLANS[$code];
                $fees = ['price_national_first' => $first, 'price_national_second' => $second, 'price_foreign_first' => $foreignFirst, 'price_foreign_second' => $foreignSecond, 'price' => $first + $second, 'price_foreign' => $foreignFirst + $foreignSecond];
                foreach ($fees as $field => $amount) {
                    if ($detail->$field === null) {
                        $detail->$field = $amount;
                    }
                }
                $detail->save();
                $ids[] = $level->id;
            }
        }

        return Level::with('faculty')->whereKey($ids)->orderBy('id')->get();
    }

    private function semesters(AcademicYear $year): void
    {
        $start = Date::parse($year->start_date, 'Africa/Kinshasa');
        $end = Date::parse($year->end_date, 'Africa/Kinshasa');
        if ($end <= $start) {
            throw new RuntimeException('Les dates de l’année académique sont invalides.');
        }
        $one = AcademicSemester::where('academic_year_id', $year->id)->where('number', 1)->first();
        $two = AcademicSemester::where('academic_year_id', $year->id)->where('number', 2)->first();
        $split = $start->startOfMonth()->addMonths(6);
        if (! $one) {
            $one = AcademicSemester::create(['academic_year_id' => $year->id, 'number' => 1, 'start_date' => $start, 'end_date' => $two ? $two->start_date->subDay() : $split->subDay()]);
        }
        if (! $two) {
            $two = AcademicSemester::create(['academic_year_id' => $year->id, 'number' => 2, 'start_date' => $one->end_date->addDay(), 'end_date' => $end]);
        }
        if ($one->start_date->toDateString() < $start->toDateString() || $two->end_date->toDateString() > $end->toDateString() || $one->start_date > $one->end_date || $two->start_date > $two->end_date || $one->end_date >= $two->start_date) {
            throw new RuntimeException('Les périodes des semestres sont incohérentes avec l’année. Aucune période existante n’a été modifiée.');
        }
    }

    private function resources(AcademicOffering $offering, AcademicYear $year): void
    {
        $path = 'academic-demo/'.$year->id.'/'.$offering->id.'/fiche-pedagogique.txt';
        if (! Storage::disk('local')->exists($path)) {
            Storage::disk('local')->put($path, "DÉMONSTRATION — document fictif, sans valeur officielle\n\n".$offering->course->pedagogical_content);
        }
        AcademicResource::firstOrCreate(['academic_offering_id' => $offering->id, 'kind' => 'material', 'title' => '[DÉMO] Fiche pédagogique'], ['body' => 'Support de démonstration, à remplacer par les supports validés du titulaire.', 'disk' => 'local', 'path' => $path, 'filename' => 'fiche-pedagogique-demo.txt', 'mime' => 'text/plain', 'is_published' => true]);
        $period = AcademicSemester::where('academic_year_id', $year->id)->where('number', $offering->course->semester)->firstOrFail();
        foreach (['assignment' => 'Travail de synthèse', 'evaluation' => 'Évaluation formative'] as $kind => $label) {
            AcademicResource::firstOrCreate(['academic_offering_id' => $offering->id, 'kind' => $kind, 'title' => '[DÉMO] '.$label], ['body' => 'Exercice fictif : présenter les notions fondamentales du cours « '.$offering->course->title.' » et les appliquer à une étude de cas. Aucune note ou décision officielle n’est attribuée.', 'opens_at' => Date::parse($period->start_date->toDateString(), 'Africa/Kinshasa')->utc(), 'closes_at' => Date::parse($period->end_date->toDateString(), 'Africa/Kinshasa')->endOfDay()->utc(), 'is_published' => true]);
        }
    }

    private function student(Level $level, AcademicYear $year, User $actor, int $number, string $password, int &$newAccounts): AcademicEnrollment
    {
        $firstNames = ['Grâce', 'Patrick', 'Chantal'];
        $lastNames = ['Kabeya', 'Ilunga', 'Mbuyi', 'Lukusa', 'Kanku', 'Mbala', 'Nzuzi', 'Lutete', 'Kabasele', 'Bolamba', 'Mukeba', 'Mbemba', 'Tshilombo', 'Kambale', 'Nkulu'];
        $email = 'demo.student.'.strtolower($level->faculty->code).'.'.strtolower($level->code).'.'.$number.'@usk.example.test';
        $user = $this->account($email, $firstNames[($number - 1) % 3], $lastNames[($level->id + $number) % count($lastNames)].' (Démo)', $password, 'student', $newAccounts);
        $application = Enrollment::where('student_id', $user->id)->where('level_id', $level->id)->where('academic_year_id', $year->id)->first();
        if (! $application) {
            $matricule = $user->studentProfile?->matricule ?: app(MatriculeGenerator::class)->generate($level, $year)->toString();
            $application = Enrollment::create(['student_id' => $user->id, 'level_id' => $level->id, 'academic_year_id' => $year->id, 'matricule' => $matricule, 'status' => 'validated', 'payment_status' => 'unpaid', 'enrolled_at' => $year->start_date, 'notes' => 'DOSSIER FICTIF DE DÉMONSTRATION — aucune décision réelle.', 'meta' => ['demo' => true]]);
            $conditions = AdmissionCondition::where('is_required', true)->whereIn('section', ['personal_info', 'academic_info'])->where(fn ($q) => $q->where('level_id', $level->id)->orWhere(fn ($q) => $q->whereNull('level_id')->where('faculty_id', $level->faculty_id)))->get();
            if ($conditions->isEmpty()) {
                $conditions = collect([(object) ['title' => 'Pièce illustrative de démonstration']]);
            }
            foreach ($conditions as $condition) {
                $key = Str::slug($condition->title, '_');
                $path = 'academic-demo/'.$year->id.'/applications/'.$application->id.'/'.$key.'.txt';
                $text = 'DOCUMENT FICTIF DE DÉMONSTRATION — '.$condition->title.'. Ce fichier ne constitue pas un justificatif réel.';
                Storage::disk('local')->put($path, $text);
                EnrollmentDocument::create(['enrollment_id' => $application->id, 'type' => 'document', 'key' => $key, 'disk' => 'local', 'path' => $path, 'filename' => 'demo-'.$key.'.txt', 'mime' => 'text/plain', 'size_bytes' => strlen($text), 'sha256' => hash('sha256', $text), 'review_status' => 'accepted', 'verified' => true, 'verified_by' => $actor->id, 'verified_at' => now(), 'is_temp' => false]);
            }
            EnrollmentEvent::create(['enrollment_id' => $application->id, 'event' => 'demo_created', 'actor_id' => $actor->id, 'payload' => ['demo' => true], 'occurred_at' => now()]);
        }
        $entry = $application->academicEnrollment ?: app(StudentAdmissionService::class)->activate($application, $actor->id, false);
        $finance = app(StudentFinanceService::class);
        if (! $entry->obligations()->exists()) {
            $finance->assess($entry, $actor, $number === 3 ? 'foreign' : 'national', [$year->start_date, AcademicSemester::where('academic_year_id', $year->id)->where('number', 2)->firstOrFail()->start_date->toDateString()], 'Barème du scénario fictif de démonstration.');
        }
        foreach ($entry->obligations()->where('kind', 'tuition')->orderBy('installment')->get() as $obligation) {
            if ($number === 3 || ($number === 2 && $obligation->installment === 2)) {
                continue;
            }
            $reference = 'DEMO-Y'.$year->id.'-E'.$entry->id.'-T'.$obligation->installment;
            if (! StudentPayment::where('reference', $reference)->exists() && $obligation->amount_cents > 0) {
                $payment = $finance->record($entry, $actor, ['amount' => number_format($obligation->amount_cents / 100, 2, '.', ''), 'method' => 'other', 'reference' => $reference, 'note' => 'VERSEMENT FICTIF — aucun mouvement bancaire réel.']);
                $finance->transition($payment, $actor, 'confirmed', 'Confirmation fictive du scénario de démonstration.');
            }
        }
        if ($number === 3) {
            $first = $entry->obligations()->where('kind', 'tuition')->orderBy('installment')->first();
            $reference = 'DEMO-Y'.$year->id.'-E'.$entry->id.'-PENDING';
            if ($first && $first->amount_cents > 0 && ! StudentPayment::where('reference', $reference)->exists()) {
                $finance->record($entry, $actor, ['amount' => number_format($first->amount_cents / 100, 2, '.', ''), 'method' => 'other', 'reference' => $reference, 'note' => 'VERSEMENT FICTIF EN ATTENTE — aucun mouvement bancaire réel.']);
            }
        }

        return $entry;
    }

    private function tracking(AcademicEnrollment $entry, User $actor, int $number): void
    {
        $offerings = AcademicOffering::where('level_id', $entry->level_id)->where('academic_year_id', $entry->academic_year_id)->get();
        foreach ($offerings as $offering) {
            foreach ($offering->sessions()->where('ends_at', '<=', now())->orderBy('starts_at')->limit(3)->get() as $index => $session) {
                AcademicAttendance::firstOrCreate(['academic_session_id' => $session->id, 'academic_enrollment_id' => $entry->id], ['status' => ['present', 'late', 'absent'][($number + $index - 1) % 3], 'recorded_by' => $actor->id]);
            }
            if ($number === 1) {
                $assignment = $offering->resources()->where('kind', 'assignment')->where('title', '[DÉMO] Travail de synthèse')->where('opens_at', '<=', now())->first();
                if ($assignment) {
                    AcademicResource::firstOrCreate(['academic_offering_id' => $offering->id, 'student_profile_id' => $entry->student_profile_id, 'kind' => 'result', 'title' => '[DÉMO] Appréciation formative'], ['body' => 'Résultat fictif : compréhension satisfaisante des premières notions. Ce contenu n’est ni une note ni un relevé officiel.', 'is_published' => true]);
                }
                if ($assignment) {
                    AcademicSubmission::firstOrCreate(['academic_enrollment_id' => $entry->id, 'academic_resource_id' => $assignment->id], ['body' => 'Remise fictive de démonstration : synthèse et application des premières notions du cours.', 'version' => 1]);
                }
            }
        }
    }
}
