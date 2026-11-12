<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('code', 60)->unique();
            $table->string('name', 180);
            $table->string('campus', 120);
            $table->string('building', 120);
            $table->unsignedInteger('capacity');
            $table->string('type', 80);
            $table->text('equipment')->nullable();
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('academic_resource_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_room_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('professor_id')->nullable()->constrained()->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('reason', 500);
            $table->timestamp('released_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['academic_room_id', 'released_at', 'starts_at'], 'room_blocks_interval_idx');
            $table->index(['professor_id', 'released_at', 'starts_at'], 'teacher_blocks_interval_idx');
        });
        Schema::table('academic_sessions', function (Blueprint $table) {
            $table->foreignId('academic_room_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('activity_type', 80)->nullable();
            $table->uuid('recurrence_id')->nullable()->index();
            $table->string('generation_key', 64)->nullable()->unique();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('change_reason', 1000)->nullable();
            $table->foreignId('replaces_session_id')->nullable()->unique()->constrained('academic_sessions')->restrictOnDelete();
            $table->timestamp('attendance_closed_at')->nullable();
            $table->unsignedInteger('attendance_revision')->default(0);
            $table->index(['academic_room_id', 'cancelled_at', 'starts_at'], 'room_session_interval_idx');
            $table->index(['academic_offering_id', 'starts_at'], 'offering_session_interval_idx');
        });
        Schema::table('academic_attendances', function (Blueprint $table) {
            $table->foreignId('academic_course_registration_id')->nullable()->constrained()->restrictOnDelete();
            $table->index(['academic_enrollment_id', 'academic_session_id'], 'student_session_attendance_idx');
        });
        Schema::create('academic_absence_justifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_attendance_id')->unique()->constrained()->restrictOnDelete();
            $table->string('status', 30);
            $table->text('reason');
            $table->string('path')->nullable();
            $table->json('submission_history')->nullable();
            $table->text('decision_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
            $table->index(['status', 'id']);
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Préservez les historiques de planification et de présence avant tout retrait de schéma.');
    }
};
