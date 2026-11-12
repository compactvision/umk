<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->createOrResume('academic_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_resource_id')->unique()->constrained()->restrictOnDelete();
            $table->string('category', 60);
            $table->string('session_code', 60);
            $table->string('modality', 20);
            $table->string('state', 16)->default('draft')->index();
            $table->string('feedback_policy', 16)->default('validated');
            $table->unsignedInteger('maximum_points')->nullable();
            $table->decimal('weight', 7, 2)->nullable();
            $table->json('rubric')->nullable();
            $table->text('objectives')->nullable();
            $table->unsignedSmallInteger('attempt_limit');
            $table->unsignedInteger('late_minutes')->default(0);
            $table->boolean('group_work')->default(false);
            $table->unsignedInteger('revision')->default(1);
            $table->timestamp('accepts_until')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
        $this->createOrResume('academic_assessment_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_assessment_id')->constrained()->restrictOnDelete();
            $table->foreignId('leader_enrollment_id')->constrained('academic_enrollments')->restrictOnDelete();
            $table->string('label', 120);
            $table->unsignedInteger('shared_points')->nullable();
            $table->text('feedback')->nullable();
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
            $table->unique(['academic_assessment_id', 'label'], 'assessment_group_label_unique');
        });
        $this->createOrResume('academic_assessment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_assessment_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_course_registration_id')->nullable()->constrained(indexName: 'assessment_record_registration_fk')->restrictOnDelete();
            $table->foreignId('academic_assessment_group_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('participation', 24)->default('unassessed');
            $table->string('correction_state', 16)->default('draft');
            $table->unsignedInteger('revision')->default(1);
            $table->unsignedInteger('points')->nullable();
            $table->integer('adjustment')->nullable();
            $table->json('criterion_points')->nullable();
            $table->text('feedback')->nullable();
            $table->string('feedback_path')->nullable();
            $table->string('feedback_filename')->nullable();
            $table->foreignId('corrected_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('released_at')->nullable();
            $table->unsignedInteger('review_requested_revision')->nullable();
            $table->timestamps();
            $table->unique(['academic_assessment_id', 'academic_enrollment_id'], 'assessment_participant_unique');
            $table->index(['academic_assessment_id', 'correction_state'], 'assessment_correction_state_idx');
        });
        $this->createOrResume('academic_submission_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_submission_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('number');
            $table->text('body')->nullable();
            $table->text('path')->nullable();
            $table->string('filename')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->uuid('operation_key')->nullable();
            $table->string('operation_hash', 64)->nullable();
            $table->timestamp('received_at')->nullable();
            $table->boolean('late')->default(false);
            $table->timestamps();
            $table->unique(['academic_submission_id', 'number'], 'work_version_number_unique');
            $table->unique(['academic_submission_id', 'operation_key'], 'work_version_operation_unique');
        });
        $this->createOrResume('academic_correction_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_assessment_record_id')->constrained(indexName: 'correction_record_fk')->restrictOnDelete();
            $table->unsignedInteger('revision');
            $table->json('snapshot');
            $table->timestamps();
            $table->unique(['academic_assessment_record_id', 'revision'], 'correction_revision_unique');
        });
        $this->createOrResume('academic_assessment_handoffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_assessment_record_id')->constrained(indexName: 'handoff_record_fk')->restrictOnDelete();
            $table->unsignedInteger('revision');
            $table->json('payload');
            $table->timestamps();
            $table->unique(['academic_assessment_record_id', 'revision'], 'assessment_handoff_revision_unique');
        });
    }

    private function createOrResume(string $name, Closure $definition): void
    {
        if (! Schema::hasTable($name)) {
            Schema::create($name, $definition);

            return;
        }

        // MySQL commits CREATE TABLE before adding its foreign keys and indexes.
        $blueprint = new Blueprint(Schema::getConnection(), $name);
        $definition($blueprint);
        foreach ($blueprint->getColumns() as $column) {
            if ($column->unique) {
                $blueprint->unique($column->name);
            }
        }
        $expectedColumns = array_map(fn ($column) => $column->name, $blueprint->getColumns());
        if (array_diff($expectedColumns, Schema::getColumnListing($name))) {
            throw new RuntimeException("La table {$name} est incomplète. Faites vérifier son schéma avant de poursuivre.");
        }

        $foreignKeys = Schema::getForeignKeys($name);
        foreach ($blueprint->getCommands() as $command) {
            if ($command->name === 'foreign') {
                $existing = collect($foreignKeys)->firstWhere('columns', $command->columns);
                if ($existing) {
                    if ($existing['foreign_table'] !== (string) $command->on || $existing['foreign_columns'] !== (array) $command->references) {
                        throw new RuntimeException("La clé étrangère de {$name} nécessite une vérification.");
                    }

                    continue;
                }
                Schema::table($name, function (Blueprint $table) use ($command) {
                    $table->foreign($command->columns, $command->index)
                        ->references($command->references)->on($command->on)->restrictOnDelete();
                });
            } elseif (in_array($command->name, ['index', 'unique'], true) && ! Schema::hasIndex($name, $command->index)) {
                Schema::table($name, function (Blueprint $table) use ($command) {
                    $table->{$command->name}($command->columns, $command->index);
                });
            }
        }
    }

    public function down(): void
    {
        throw new RuntimeException('Exportez les tentatives, corrections et transmissions avant tout retrait de schéma.');
    }
};
