<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\Student\AcademicEnrollment;
use App\Models\Student\StudentPayment;
use App\Models\Student\StudentProfile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use SimpleXMLElement;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;
use ZipArchive;

final class FinanceWorkbookTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_download_contains_typed_amounts_and_dated_flows_in_their_own_currency(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-08 12:00:00', 'UTC'));
        $student = $this->studentContext();
        $usd = $student->studentProfile->enrollments()->firstOrFail();
        $admin = $this->administrator();
        $usd->level->faculty()->update(['name' => '=Économie & gestion']);
        $cdf = $this->otherEnrollment($usd);

        $this->bill($usd, 12345);
        $this->bill($cdf, 250001);
        $payment = $this->pay($usd, $admin, 4001, '2026-10-01 12:00:00');
        $this->pay($cdf, $admin, 150020, '2026-11-03 12:00:00');
        $payment->refunds()->create([
            'uuid' => (string) Str::uuid(), 'operation_key' => (string) Str::uuid(),
            'amount_cents' => 1000, 'status' => 'executed', 'requested_by' => $admin->id,
            'reason' => 'Exécution contrôlée du remboursement.', 'executed_at' => '2026-11-01 12:00:00',
        ]);

        $download = $this->actingAs($admin)->get(route('dashboard.admin.finance.export-xlsx', ['year' => $usd->academic_year_id]))
            ->assertOk()->assertDownload('finances-usk.xlsx')
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertTrue($download->headers->hasCacheControlDirective('no-store'));
        $this->assertTrue($download->headers->hasCacheControlDirective('private'));
        [$summary, $monthly, $faculties, $fees] = $this->sheets($download);

        $this->assertSame('CDF', $this->value($summary, 'A7'));
        $this->assertSame('2500.01', $this->value($summary, 'B7'));
        $this->assertSame('1500.20', $this->value($summary, 'L7'));
        $this->assertSame('USD', $this->value($summary, 'A8'));
        $this->assertSame('123.45', $this->value($summary, 'B8'));
        $this->assertSame('30.01', $this->value($summary, 'L8'));
        $this->assertSame('93.44', $this->value($summary, 'F8'));
        $this->assertStringContainsString('2026-2027', $this->value($summary, 'A3'));
        $this->assertFalse(isset($this->cell($summary, 'L8')['t']));

        $this->assertSame('C7', (string) $monthly->sheetViews->sheetView->pane['topLeftCell']);
        $this->assertSame('A6:E30', (string) $monthly->autoFilter['ref']);
        $this->assertSame('C7:C18', (string) $monthly->conditionalFormatting[0]['sqref']);
        $this->assertSame('C19:C30', (string) $monthly->conditionalFormatting[1]['sqref']);
        $this->assertSame('USD', $this->value($monthly, 'A30'));
        $this->assertSame('46327', $this->value($monthly, 'B30'));
        $this->assertSame('-10.00', $this->value($monthly, 'E30'));

        $this->assertSame('=Économie & gestion', $this->value($faculties, 'A8'));
        $this->assertSame('inlineStr', (string) $this->cell($faculties, 'A8')['t']);
        $this->assertSame('93.44', $this->value($faculties, 'G8'));
        $this->assertSame('tuition', $this->value($fees, 'A8'));
        $this->assertSame('93.44', $this->value($fees, 'G8'));
    }

    public function test_faculty_scope_and_query_filters_apply_to_every_sheet(): void
    {
        $student = $this->studentContext();
        $usd = $student->studentProfile->enrollments()->firstOrFail();
        $cdf = $this->otherEnrollment($usd);
        $admin = $this->administrator();
        $admin->academicFaculties()->attach($usd->level->faculty_id);
        $this->bill($usd, 10000);
        $this->bill($cdf, 250000);
        $this->pay($usd, $admin, 3500, '2026-11-01 12:00:00');
        $this->pay($cdf, $admin, 170000, '2026-11-02 12:00:00');

        $this->actingAs($student)->get(route('dashboard.admin.finance.export-xlsx'))->assertForbidden();
        $route = route('dashboard.admin.finance.export-xlsx', ['year' => $usd->academic_year_id, 'level' => $usd->level_id, 'q' => $student->email]);
        [$summary, $monthly, $faculties, $fees] = $this->sheets($this->actingAs($admin)->get($route)->assertOk());
        $this->assertSame('USD', $this->value($summary, 'A7'));
        $this->assertSame('USD', $this->value($monthly, 'A18'));
        $this->assertSame('USD', $this->value($faculties, 'B7'));
        $this->assertSame('USD', $this->value($fees, 'B7'));
        foreach ([$summary, $monthly, $faculties, $fees] as $sheet) {
            $this->assertStringNotContainsString('CDF', $sheet->asXML());
            $this->assertStringNotContainsString($student->email, $sheet->asXML());
        }
        $this->assertStringContainsString('Recherche appliquée', $this->value($summary, 'A3'));

        $outside = route('dashboard.admin.finance.export-xlsx', ['faculty' => $cdf->level->faculty_id]);
        foreach ($this->sheets($this->get($outside)->assertOk()) as $sheet) {
            $this->assertSame('Aucune donnée pour ce périmètre.', $this->value($sheet, 'A7'));
            $this->assertStringNotContainsString('Faculté externe', $sheet->asXML());
        }
    }

    private function administrator(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage academic finance', 'web'));

        return $admin;
    }

    private function otherEnrollment(AcademicEnrollment $entry): AcademicEnrollment
    {
        $student = User::factory()->create();
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Faculté externe', 'code' => 'EXT']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Niveau externe', 'code' => 'E1']);
        $application = Enrollment::create([
            'student_id' => $student->id, 'level_id' => $level,
            'academic_year_id' => $entry->academic_year_id, 'status' => 'validated',
        ]);
        $profile = StudentProfile::create(['user_id' => $student->id, 'student_status' => 'active']);

        return AcademicEnrollment::create([
            'student_profile_id' => $profile->id, 'application_id' => $application->id,
            'level_id' => $level, 'academic_year_id' => $entry->academic_year_id,
            'enrollment_status' => 'confirmed', 'currency' => 'CDF',
        ]);
    }

    private function bill(AcademicEnrollment $entry, int $amount): void
    {
        $entry->obligations()->create([
            'kind' => 'tuition', 'title' => 'Frais de scolarité', 'installment' => 1,
            'amount_cents' => $amount, 'currency' => $entry->currency, 'due_at' => '2026-10-31',
        ]);
    }

    private function pay(AcademicEnrollment $entry, User $admin, int $amount, string $date): StudentPayment
    {
        return $entry->payments()->create([
            'uuid' => (string) Str::uuid(), 'reference' => (string) Str::uuid(), 'kind' => 'tuition',
            'amount_cents' => $amount, 'currency' => $entry->currency, 'method' => 'cash',
            'status' => 'confirmed', 'recorded_by' => $admin->id, 'confirmed_by' => $admin->id, 'confirmed_at' => $date,
        ]);
    }

    private function sheets(TestResponse $response): array
    {
        $filename = tempnam(sys_get_temp_dir(), 'umk-test-xlsx-');
        file_put_contents($filename, $response->getContent());
        $zip = new ZipArchive;
        $opened = $zip->open($filename, ZipArchive::RDONLY);
        try {
            $this->assertTrue($opened);
            $book = new SimpleXMLElement($zip->getFromName('xl/workbook.xml'));
            $this->assertSame(['Synthèse', 'Flux mensuels', 'Par faculté', 'Par type de frais'], array_map(
                static fn (SimpleXMLElement $sheet): string => (string) $sheet['name'],
                iterator_to_array($book->sheets->sheet, false),
            ));

            return array_map(static fn (int $index): SimpleXMLElement => new SimpleXMLElement(
                $zip->getFromName('xl/worksheets/sheet'.$index.'.xml'),
            ), range(1, 4));
        } finally {
            if ($opened === true) {
                $zip->close();
            }
            unlink($filename);
        }
    }

    private function cell(SimpleXMLElement $sheet, string $reference): SimpleXMLElement
    {
        $sheet->registerXPathNamespace('sheet', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $cells = $sheet->xpath('//sheet:c[@r="'.$reference.'"]');
        $this->assertCount(1, $cells, 'Cellule '.$reference);

        return $cells[0];
    }

    private function value(SimpleXMLElement $sheet, string $reference): string
    {
        $cell = $this->cell($sheet, $reference);

        return (string) ((string) $cell['t'] === 'inlineStr' ? $cell->is->t : $cell->v);
    }
}
