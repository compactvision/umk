<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $t->string('matricule')->nullable()->unique();
            $t->string('student_status')->default('active');
            $t->timestamps();
        });
        Schema::create('academic_enrollments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_profile_id')->constrained()->restrictOnDelete();
            $t->foreignId('application_id')->unique()->constrained('enrollments')->restrictOnDelete();
            $t->foreignId('level_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete();
            $t->string('matricule')->nullable();
            $t->string('enrollment_status')->default('confirmed');
            $t->string('fee_category')->nullable();
            $t->string('currency', 3)->default('USD');
            $t->timestamps();
            $t->unique(['student_profile_id', 'level_id', 'academic_year_id'], 'academic_context_unique');
        });
        Schema::create('academic_audits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $t->string('action');
            $t->string('entity_type');
            $t->unsignedBigInteger('entity_id');
            $t->text('reason')->nullable();
            $t->json('data')->nullable();
            $t->timestamps();
            $t->index(['entity_type', 'entity_id']);
        });
        Schema::create('student_obligations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $t->string('kind')->default('tuition');
            $t->string('title');
            $t->unsignedTinyInteger('installment');
            $t->unsignedBigInteger('amount_cents');
            $t->date('due_at')->nullable();
            $t->timestamps();
            $t->unique(['academic_enrollment_id', 'kind', 'installment'], 'student_obligation_unique');
        });
        Schema::create('student_payments', function (Blueprint $t) {
            $t->id();
            $t->uuid('uuid')->unique();
            $t->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $t->string('kind')->default('tuition');
            $t->unsignedBigInteger('amount_cents');
            $t->string('currency', 3);
            $t->string('status')->default('pending');
            $t->string('method');
            $t->string('reference')->unique();
            $t->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $t->foreignId('confirmed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('confirmed_at')->nullable();
            $t->text('note')->nullable();
            $t->timestamps();
            $t->index(['academic_enrollment_id', 'status']);
        });
        Schema::create('academic_access_rules', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('level_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('feature');
            $t->string('fee_kind')->default('tuition');
            $t->string('mode');
            $t->unsignedBigInteger('minimum_cents')->nullable();
            $t->boolean('allow_plan')->default(false);
            $t->boolean('allow_exemption')->default(true);
            $t->boolean('is_active')->default(true);
            $t->text('regulation_reference')->nullable();
            $t->timestamps();
            $t->index(['feature', 'is_active']);
        });
        Schema::create('student_financial_adjustments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $t->string('type');
            $t->string('fee_kind')->default('tuition');
            $t->string('feature')->nullable();
            $t->unsignedBigInteger('amount_cents')->nullable();
            $t->date('starts_at')->nullable();
            $t->date('expires_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->text('reason');
            $t->foreignId('authorized_by')->constrained('users')->restrictOnDelete();
            $t->json('schedule')->nullable();
            $t->timestamps();
        });
        Schema::create('academic_offerings', function (Blueprint $t) {
            $t->id();
            $t->foreignId('course_id')->constrained('courses')->restrictOnDelete();
            $t->foreignId('level_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->foreignId('class_id')->nullable()->constrained('classes')->restrictOnDelete();
            $t->foreignId('professor_id')->nullable()->constrained('professors')->restrictOnDelete();
            $t->string('semester')->nullable();
            $t->boolean('is_optional')->default(false);
            $t->boolean('is_published')->default(false);
            $t->timestamps();
            $t->index(['level_id', 'academic_year_id', 'is_published']);
        });
        Schema::create('academic_course_exceptions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_enrollment_id')->constrained()->cascadeOnDelete();
            $t->foreignId('academic_offering_id')->constrained()->cascadeOnDelete();
            $t->string('action');
            $t->text('reason');
            $t->foreignId('authorized_by')->constrained('users');
            $t->timestamps();
            $t->unique(['academic_enrollment_id', 'academic_offering_id'], 'academic_course_exception_unique');
        });
        Schema::create('academic_sessions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_offering_id')->constrained()->cascadeOnDelete();
            $t->dateTime('starts_at');
            $t->dateTime('ends_at');
            $t->string('room');
            $t->boolean('is_published')->default(false);
            $t->timestamps();
            $t->index('starts_at');
        });
        Schema::create('academic_resources', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_offering_id')->constrained()->cascadeOnDelete();
            $t->string('kind');
            $t->foreignId('student_profile_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('title');
            $t->text('body')->nullable();
            $t->string('disk')->default('local');
            $t->text('path')->nullable();
            $t->string('filename')->nullable();
            $t->string('mime')->nullable();
            $t->dateTime('opens_at')->nullable();
            $t->dateTime('closes_at')->nullable();
            $t->boolean('is_published')->default(false);
            $t->timestamps();
            $t->index(['academic_offering_id', 'kind', 'is_published']);
        });
        Schema::create('academic_submissions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_resource_id')->constrained()->restrictOnDelete();
            $t->text('body')->nullable();
            $t->text('path')->nullable();
            $t->string('filename')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->timestamps();
            $t->unique(['academic_enrollment_id', 'academic_resource_id'], 'academic_submission_unique');
        });
        Schema::create('student_service_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $t->string('category');
            $t->string('subject');
            $t->text('body');
            $t->string('status')->default('open');
            $t->text('response')->nullable();
            $t->foreignId('responded_by')->nullable()->constrained('users');
            $t->timestamps();
        });
        foreach (['manage academic access', 'manage academic finance', 'publish academic content'] as $name) {
            $permission = \Spatie\Permission\Models\Permission::findOrCreate($name, 'web');
            \Spatie\Permission\Models\Role::findOrCreate('admin', 'web')->givePermissionTo($permission);
        }
        \Spatie\Permission\Models\Role::findOrCreate('student', 'web');
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        foreach (['student_service_requests', 'academic_submissions', 'academic_resources', 'academic_sessions', 'academic_course_exceptions', 'academic_offerings', 'student_financial_adjustments', 'academic_access_rules', 'student_payments', 'student_obligations', 'academic_audits', 'academic_enrollments', 'student_profiles'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
