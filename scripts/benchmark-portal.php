<?php

declare(strict_types=1);

use App\Models\Courses;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\AccessRule;
use Illuminate\Contracts\Console\Kernel as Console;
use Illuminate\Contracts\Http\Kernel as Http;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\CreatesStudentContext;

require dirname(__DIR__).'/vendor/autoload.php';

$app = require dirname(__DIR__).'/bootstrap/app.php';
$console = $app->make(Console::class);
$console->bootstrap();

$app->instance('env', 'testing');
config([
    'app.env' => 'testing', 'app.debug' => false,
    'app.key' => 'base64:'.base64_encode(random_bytes(32)),
    'database.default' => 'sqlite', 'database.connections.sqlite.url' => null,
    'database.connections.sqlite.database' => ':memory:',
    'session.driver' => 'array', 'cache.default' => 'array', 'queue.default' => 'sync',
    'logging.default' => 'null', 'hashing.bcrypt.rounds' => 4, 'inertia.ssr.enabled' => false,
]);
DB::purge('sqlite');
if ($console->call('migrate', ['--force' => true]) !== 0) {
    throw new RuntimeException('La migration de la base SQLite en mémoire a échoué.');
}

$fixture = new class
{
    use CreatesStudentContext {
        studentContext as public;
    }
};
$student = $fixture->studentContext();
$entry = $student->studentProfile->enrollments()->sole();
$entry->update(['matricule' => 'BENCH-SYNTHETIQUE']);
$entry->obligations()->create(['kind' => 'tuition', 'title' => 'Frais synthétiques', 'installment' => 1, 'amount_cents' => 10000]);
$entry->payments()->create([
    'uuid' => (string) Str::uuid(), 'kind' => 'tuition', 'amount_cents' => 10000, 'currency' => 'USD',
    'status' => 'confirmed', 'method' => 'cash', 'reference' => 'BENCH-PAYMENT', 'recorded_by' => $student->id,
]);
foreach (['courses_view', 'materials_download', 'assignments_submit', 'evaluations_participate', 'results_view', 'documents_request', 'schedule_view'] as $feature) {
    AccessRule::create(['feature' => $feature, 'fee_kind' => 'tuition', 'mode' => 'full', 'is_active' => true]);
}
for ($i = 1; $i <= 12; $i++) {
    $course = (new Courses)->forceFill(['level_id' => $entry->level_id, 'title' => 'Matière synthétique '.$i, 'semester' => 1]);
    $course->save();
    $offering = AcademicOffering::create([
        'course_id' => $course->id, 'level_id' => $entry->level_id, 'academic_year_id' => $entry->academic_year_id,
        'semester' => '1', 'is_optional' => false, 'is_published' => true,
    ]);
    for ($j = 1; $j <= 3; $j++) {
        AcademicResource::create(['academic_offering_id' => $offering->id, 'kind' => 'material', 'title' => 'Support synthétique '.$j, 'is_published' => true]);
    }
}

$queries = 0;
DB::listen(function () use (&$queries) {
    $queries++;
});
$http = $app->make(Http::class);
$iterations = max(1, min(200, (int) ($argv[1] ?? 30)));
$results = [];
foreach (['overview', 'courses', 'schedule', 'profile', 'documents', 'results'] as $section) {
    $times = $queryCounts = [];
    $bytes = 0;
    for ($i = -3; $i < $iterations; $i++) {
        $app['auth']->guard()->setUser($student);
        $queries = 0;
        $request = Request::create('/dashboard/student/'.$section.'?academic='.$entry->id);
        $start = hrtime(true);
        $response = $http->handle($request);
        $http->terminate($request, $response);
        $elapsed = (hrtime(true) - $start) / 1_000_000;
        if ($response->getStatusCode() !== 200) {
            throw new RuntimeException(sprintf('Réponse %d sur %s.', $response->getStatusCode(), $section));
        }
        if ($i >= 0) {
            $times[] = $elapsed;
            $queryCounts[] = $queries;
            $bytes = strlen($response->getContent());
        }
    }
    sort($times);
    $percentile = fn (float $p) => round($times[(int) ceil(count($times) * $p) - 1], 2);
    $results[$section] = ['queries_min' => min($queryCounts), 'queries_max' => max($queryCounts), 'p50_ms' => $percentile(.50),
        'p95_ms' => $percentile(.95), 'p99_ms' => $percentile(.99), 'html_bytes' => $bytes];
}

echo json_encode(['php' => PHP_VERSION, 'iterations_per_route' => $iterations, 'engine' => 'SQLite in-memory',
    'mode' => 'Laravel HTTP kernel, sequential, no network', 'routes' => $results], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT).PHP_EOL;
