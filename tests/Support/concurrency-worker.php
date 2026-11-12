<?php

use App\Models\AcademicStructure\CurriculumVersion;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Level;
use App\Models\Student\AcademicAudit;
use App\Models\Student\StudentPayment;
use App\Models\User;
use App\Modules\AcademicStructure\Application\Services\CurriculumService;
use App\Modules\AcademicStructure\Application\Services\StructureService;
use App\Modules\Enrollment\Application\DTOs\SubmitEnrollmentDTO;
use App\Modules\Enrollment\Application\UseCases\RecordEnrollmentDecision;
use App\Modules\Enrollment\Application\UseCases\SubmitEnrollmentUseCase;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Exceptions\InvalidEnrollmentStateException;
use App\Modules\Enrollment\Domain\Services\MatriculeGenerator;
use App\Modules\Student\Application\Services\StudentFinanceService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== 'umk_test') {
    throw new RuntimeException('Disposable PostgreSQL required.');
}
[$script, $mode, $first, $second, $gate] = $argv;
file_put_contents($gate.'/ready-'.getmypid(), 'ready');
$deadline = microtime(true) + 10;
while (! is_file($gate.'/go')) {
    if (microtime(true) > $deadline) {
        throw new RuntimeException('Concurrency barrier timeout');
    }
    usleep(10000);
}
try {
    if ($mode === 'matricule') {
        $result = app(MatriculeGenerator::class)->generate(Level::findOrFail($first), AcademicYear::findOrFail($second))->toString();
    } elseif ($mode === 'admission-submit') {
        Mail::fake();
        $entry = Enrollment::findOrFail($first);
        $result = app(SubmitEnrollmentUseCase::class)->execute(new SubmitEnrollmentDTO($entry->uuid, (int) $second))->matricule;
    } elseif ($mode === 'admission-decision') {
        Mail::fake();
        $decision = $first > 0 ? EnrollmentStatus::VALIDATED : EnrollmentStatus::REJECTED;
        $result = app(RecordEnrollmentDecision::class)->execute(abs((int) $first), (int) $second, $decision, 'Décision de concurrence locale')->status->value;
    } elseif ($mode === 'payment') {
        $payment = StudentPayment::findOrFail($first);
        app(StudentFinanceService::class)->transition($payment, User::findOrFail($second), 'confirmed', 'Concurrent test confirmation');
        $result = $payment->fresh()->status;
    } elseif (in_array($mode, ['curriculum-publish', 'curriculum-edit', 'curriculum-bind'], true)) {
        $version = CurriculumVersion::with('units.items')->findOrFail($first);
        $service = app(CurriculumService::class);
        $actorId = $version->published_by ?? $version->validated_by ?? AcademicAudit::where('entity_type', 'curriculum_versions')->where('entity_id', $version->id)->where('action', 'curriculum_draft_created')->value('actor_id');
        $actor = User::findOrFail($actorId);
        if ($mode === 'curriculum-publish') {
            $service->transition($version->id, 'publish', (int) $second, 'Concurrent publication test', $actor);
            $result = 'published';
        } elseif ($mode === 'curriculum-bind') {
            $service->bind($version->id, (int) $second, $actor, 'Concurrent binding test');
            $result = 'bound';
        } else {
            $units = $version->units->map(fn ($unit) => $unit->only(['level_id', 'period_code', 'code', 'name', 'expected_credits']) + ['items' => $unit->items->map->only(['source_course_id', 'name', 'code', 'description', 'credits', 'coefficient', 'cmi_hours', 'td_hours', 'tp_hours'])->all()])->all();
            $units[0]['name'] = 'Concurrent edit';
            $service->saveDraft($version->id, ['revision' => (int) $second, 'reason' => 'Concurrent draft edit', 'units' => $units], $actor);
            $result = 'updated';
        }
    } elseif ($mode === 'cycle-code') {
        app(StructureService::class)->save('cycle', ['code' => 'RACE', 'name' => 'Concurrent cycle', 'normal_duration' => 1, 'progression_mode' => 'annual', 'weighting_mode' => 'credits', 'periods' => [['code' => 'A', 'name' => 'Annual']], 'is_active' => true, 'revision' => 0, 'reason' => 'Concurrent code creation'], User::findOrFail($second));
        $result = 'created';
    } else {
        throw new RuntimeException('Unknown test operation');
    }
} catch (ValidationException|UniqueConstraintViolationException|InvalidEnrollmentStateException $exception) {
    $result = 'refused';
}
echo json_encode($result, JSON_THROW_ON_ERROR);
