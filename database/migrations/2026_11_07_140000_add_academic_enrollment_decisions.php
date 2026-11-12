<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_enrollment_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('target_enrollment_id')->nullable()->constrained('academic_enrollments')->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->uuid('operation_key');
            $table->string('request_hash', 64);
            $table->string('action', 40);
            $table->json('before');
            $table->json('after');
            $table->text('reason');
            $table->timestamp('effective_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('created_at');
            $table->unique(['academic_enrollment_id', 'operation_key'], 'enrollment_operation_unique');
            $table->index(['academic_enrollment_id', 'id'], 'enrollment_change_history_idx');
        });
        Schema::create('academic_staff_faculties', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('faculty_id')->constrained('faculties')->restrictOnDelete();
            $table->primary(['user_id', 'faculty_id']);
        });
        Schema::table('classes', fn (Blueprint $table) => $table->unsignedInteger('capacity')->nullable());
        Schema::table('academic_enrollments', fn (Blueprint $table) => $table->index(['academic_year_id', 'enrollment_status', 'id'], 'enrollment_year_status_idx'));
        Schema::table('student_service_requests', fn (Blueprint $table) => $table->index(['academic_enrollment_id', 'id'], 'student_request_history_idx'));
    }

    public function down(): void
    {
        // Decisions are durable records: rollback requires an explicit archival procedure.
        if (DB::table('academic_enrollment_changes')->exists()
            || DB::table('academic_staff_faculties')->exists()) {
            throw new RuntimeException('Archivez les décisions et périmètres avant tout retrait de ces tables.');
        }
        Schema::table('classes', fn (Blueprint $table) => $table->dropColumn('capacity'));
        Schema::table('student_service_requests', fn (Blueprint $table) => $table->dropIndex('student_request_history_idx'));
        Schema::table('academic_enrollments', fn (Blueprint $table) => $table->dropIndex('enrollment_year_status_idx'));
        Schema::dropIfExists('academic_staff_faculties');
        Schema::dropIfExists('academic_enrollment_changes');
    }
};
