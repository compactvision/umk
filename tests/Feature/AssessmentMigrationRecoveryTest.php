<?php

namespace Tests\Feature;

use Illuminate\Database\MySqlConnection;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AssessmentMigrationRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_resumes_after_mysql_created_records_without_all_constraints(): void
    {
        Schema::table('academic_assessment_records', function (Blueprint $table) {
            $table->dropForeign(['academic_assessment_group_id']);
            $table->dropForeign(['academic_course_registration_id']);
            $table->dropForeign(['corrected_by']);
            $table->dropUnique('assessment_participant_unique');
            $table->dropIndex('assessment_correction_state_idx');
        });

        $migration = require database_path('migrations/2026_11_10_130000_add_assessment_workflows.php');
        $migration->up();
        $migration->up();

        $foreign = collect(Schema::getForeignKeys('academic_assessment_records'));
        $this->assertCount(5, $foreign);
        $this->assertSame('academic_course_registrations',
            $foreign->firstWhere('columns', ['academic_course_registration_id'])['foreign_table']);
        $this->assertTrue(Schema::hasIndex('academic_assessment_records', 'assessment_participant_unique', 'unique'));
        $this->assertTrue(Schema::hasIndex('academic_assessment_records', 'assessment_correction_state_idx'));
        foreach (['academic_assessments', 'academic_assessment_groups', 'academic_assessment_records',
            'academic_submission_versions', 'academic_correction_revisions', 'academic_assessment_handoffs'] as $name) {
            foreach (Schema::getForeignKeys($name) as $key) {
                $this->assertLessThanOrEqual(64, strlen((string) $key['name']));
            }
        }
    }

    public function test_mysql_identifiers_generated_by_the_migration_fit_its_limit(): void
    {
        $original = Schema::getFacadeRoot();
        $connection = new MySqlConnection(fn () => throw new \RuntimeException('This test must not connect to MySQL.'), 'migration_test');
        try {
            Schema::swap($connection->getSchemaBuilder());
            $queries = $connection->pretend(function () {
                (require database_path('migrations/2026_11_10_130000_add_assessment_workflows.php'))->up();
            });
        } finally {
            Schema::swap($original);
        }

        $constraints = [];
        foreach ($queries as $query) {
            preg_match_all('/(?:constraint|add unique|add index) `([^`]+)`/i', $query['query'], $matches);
            array_push($constraints, ...$matches[1]);
        }
        $this->assertContains('assessment_record_registration_fk', $constraints);
        $this->assertContains('correction_record_fk', $constraints);
        $this->assertContains('handoff_record_fk', $constraints);
        foreach ($constraints as $name) {
            $this->assertLessThanOrEqual(64, strlen($name), $name);
        }
    }
}
