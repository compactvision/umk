<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_result_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curriculum_version_id')->constrained()->restrictOnDelete();
            $table->foreignId('level_id')->constrained()->restrictOnDelete();
            $table->string('session_code', 60);
            $table->string('code', 60);
            $table->date('effective_on');
            $table->string('reference', 255);
            $table->json('configuration');
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['curriculum_version_id', 'level_id', 'session_code', 'code'], 'result_rule_version_unique');
        });
        Schema::create('academic_deliberations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_result_rule_id')->constrained()->restrictOnDelete();
            $table->foreignId('previous_id')->nullable()->constrained('academic_deliberations')->restrictOnDelete();
            $table->string('scope_key', 190);
            $table->unsignedInteger('edition');
            $table->unsignedInteger('revision')->default(1);
            $table->string('state', 16)->default('prepared')->index();
            $table->uuid('reference')->unique();
            $table->json('context');
            $table->json('jury');
            $table->json('attendance')->nullable();
            $table->dateTime('meeting_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['scope_key', 'edition']);
        });
        Schema::create('academic_official_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_deliberation_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->uuid('reference')->unique();
            $table->json('snapshot');
            $table->string('decision', 60)->nullable();
            $table->text('decision_reason')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['academic_deliberation_id', 'academic_enrollment_id'], 'official_result_student_unique');
            $table->index(['academic_enrollment_id', 'academic_deliberation_id'], 'official_result_history_idx');
        });
        Schema::create('academic_result_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_deliberation_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_official_result_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('document_key', 80)->unique();
            $table->uuid('reference')->unique();
            $table->string('sha256', 64);
            $table->timestamps();
        });
        Schema::table('academic_progressions', function (Blueprint $table) {
            $table->foreignId('academic_official_result_id')->nullable()->constrained()->restrictOnDelete();
        });
        Schema::table('student_service_requests', function (Blueprint $table) {
            $table->foreignId('academic_official_result_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('result_target', 80)->nullable();
            $table->string('result_attachment')->nullable();
            $table->unsignedInteger('result_revision')->default(1);
            $table->foreignId('assigned_to')->nullable()->constrained('users')->restrictOnDelete();
            $table->unique(['academic_official_result_id', 'result_target'], 'official_result_appeal_unique');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Exportez les résultats et décisions officiels avant tout retrait de schéma.');
    }
};
