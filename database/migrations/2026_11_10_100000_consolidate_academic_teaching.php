<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('catalog_status', 20)->default('active');
            $table->string('catalog_code_key', 64)->nullable()->unique();
            $table->string('discipline', 120)->nullable();
        });
        Schema::table('curriculum_items', fn (Blueprint $table) => $table->boolean('is_optional')->default(false));
        Schema::table('curriculum_units', fn (Blueprint $table) => $table->string('credit_rule', 20)->default('sum'));
        Schema::table('professors', fn (Blueprint $table) => $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete());
        Schema::table('academic_offerings', function (Blueprint $table) {
            $table->foreignId('curriculum_item_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('academic_semester_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('required_unit_id')->nullable()->constrained('curriculum_units')->restrictOnDelete();
            $table->string('teaching_key', 64)->nullable()->unique();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->index(['academic_year_id', 'curriculum_item_id'], 'teaching_year_item_index');
        });
        Schema::create('academic_teaching_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_offering_id')->constrained()->restrictOnDelete();
            $table->foreignId('professor_id')->constrained()->restrictOnDelete();
            $table->string('role', 20);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('active_key', 80)->nullable()->unique();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['professor_id', 'ends_at']);
            $table->index(['academic_offering_id', 'ends_at'], 'teaching_assignment_offering_idx');
        });
        Schema::create('academic_course_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_offering_id')->constrained()->restrictOnDelete();
            $table->string('mode', 20);
            $table->timestamp('registered_at');
            $table->timestamp('withdrawn_at')->nullable();
            $table->string('withdrawal_kind', 20)->nullable();
            $table->string('active_key', 80)->nullable()->unique();
            $table->foreignId('registered_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['academic_offering_id', 'academic_enrollment_id', 'withdrawn_at'], 'course_registration_roster_idx');
            $table->index(['academic_enrollment_id', 'withdrawn_at'], 'course_registration_student_idx');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Conservez les historiques pédagogiques avant tout retrait de schéma.');
    }
};
