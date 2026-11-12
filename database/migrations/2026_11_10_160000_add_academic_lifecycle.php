<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_progressions', function (Blueprint $table) {
            $table->string('kind', 24)->nullable();
            $table->json('decision_snapshot')->nullable();
            $table->foreignId('target_curriculum_version_id')->nullable()->constrained('curriculum_versions')->restrictOnDelete();
            $table->index(['kind', 'academic_year_id']);
        });

        Schema::create('academic_retake_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_progression_id')->constrained()->restrictOnDelete();
            $table->foreignId('source_item_id')->constrained('curriculum_items')->restrictOnDelete();
            $table->foreignId('course_registration_id')->unique()->constrained('academic_course_registrations')->restrictOnDelete();
            $table->timestamps();
            $table->index(['academic_progression_id', 'source_item_id'], 'retakes_progression_item_idx');
        });

        Schema::create('academic_lifecycle_cases', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference')->unique();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_official_result_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('decided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('academic_progression_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('target_enrollment_id')->nullable()->constrained('academic_enrollments')->restrictOnDelete();
            $table->string('kind', 24);
            $table->string('status', 16)->default('open');
            $table->unsignedInteger('revision')->default(1);
            $table->uuid('operation_key');
            $table->string('pending_key', 80)->nullable()->unique();
            $table->unsignedBigInteger('completion_key')->nullable()->unique();
            $table->text('reason');
            $table->text('response')->nullable();
            $table->json('context');
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->unique(['academic_enrollment_id', 'operation_key'], 'lifecycle_operation_unique');
            $table->index(['academic_enrollment_id', 'kind', 'status'], 'lifecycle_enrollment_kind_idx');
            $table->index(['kind', 'status', 'id'], 'lifecycle_work_queue_idx');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Archivez les décisions de parcours avant tout retrait du schéma.');
    }
};
