<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('universities', function (Blueprint $t) {
            $t->id();
            $t->string('context_key')->nullable()->unique();
            $t->string('code', 60)->unique();
            $t->string('name');
            $t->string('acronym', 60)->nullable();
            $t->foreignId('site_id')->nullable()->unique()->constrained('sites')->restrictOnDelete();
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
        });
        Schema::table('faculties', function (Blueprint $t) {
            $t->foreignId('university_id')->nullable()->constrained()->restrictOnDelete();
            $t->index('university_id');
        });
        Schema::table('academic_years', function (Blueprint $t) {
            $t->foreignId('university_id')->nullable()->constrained()->restrictOnDelete();
            $t->index('university_id');
        });
        Schema::create('academic_departments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('faculty_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
            $t->unique(['faculty_id', 'code']);
        });
        Schema::create('academic_cycles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('university_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->unsignedInteger('normal_duration');
            $t->string('progression_mode', 30);
            $t->string('weighting_mode', 30);
            $t->json('periods');
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
            $t->unique(['university_id', 'code']);
        });
        Schema::create('academic_programs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('faculty_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_department_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('academic_cycle_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->string('degree')->nullable();
            $t->unsignedInteger('normal_duration')->nullable();
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
            $t->unique(['faculty_id', 'code']);
        });
        Schema::create('academic_program_levels', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_program_id')->constrained()->restrictOnDelete();
            $t->foreignId('level_id')->constrained()->restrictOnDelete();
            $t->unsignedInteger('position');
            $t->unique(['academic_program_id', 'level_id']);
        });
        Schema::create('admission_cohorts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_program_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
            $t->unique(['academic_program_id', 'code']);
        });
        Schema::create('academic_promotions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_program_id')->constrained()->restrictOnDelete();
            $t->foreignId('level_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('revision')->default(0);
            $t->timestamps();
            $t->unique(['academic_program_id', 'code']);
            $t->unique(['academic_program_id', 'level_id', 'academic_year_id'], 'academic_promotion_context_unique');
        });
        Schema::table('classes', fn (Blueprint $t) => $t->foreignId('academic_promotion_id')->nullable()->constrained()->restrictOnDelete());
        Schema::create('curriculum_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_program_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_year_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('admission_cohort_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->string('name');
            $t->string('status', 30)->default('draft');
            $t->string('publication_key')->nullable()->unique();
            $t->string('weighting_mode', 30);
            $t->json('program_snapshot');
            $t->json('periods');
            $t->unsignedInteger('revision')->default(0);
            $t->foreignId('validated_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->foreignId('published_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('validated_at')->nullable();
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
            $t->unique(['academic_program_id', 'code']);
            $t->index(['academic_program_id', 'status']);
            $t->index(['academic_year_id', 'status'], 'curriculum_year_status_idx');
            $t->index('admission_cohort_id');
        });
        Schema::create('curriculum_units', function (Blueprint $t) {
            $t->id();
            $t->foreignId('curriculum_version_id')->constrained()->restrictOnDelete();
            $t->foreignId('level_id')->constrained()->restrictOnDelete();
            $t->string('level_code', 60);
            $t->string('level_title');
            $t->string('period_code', 60);
            $t->string('period_name');
            $t->string('code', 60);
            $t->string('name');
            $t->decimal('expected_credits', 8, 2)->nullable();
            $t->unsignedInteger('position')->default(1);
            $t->timestamps();
            $t->unique(['curriculum_version_id', 'level_id', 'period_code', 'code'], 'curriculum_unit_context_unique');
            $t->unique(['id', 'curriculum_version_id'], 'curriculum_unit_owner_unique');
        });
        Schema::create('curriculum_items', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('curriculum_unit_id');
            $t->foreignId('curriculum_version_id')->constrained()->restrictOnDelete();
            $t->foreign(['curriculum_unit_id', 'curriculum_version_id'], 'curriculum_item_owner_fk')->references(['id', 'curriculum_version_id'])->on('curriculum_units')->restrictOnDelete();
            $t->foreignId('source_course_id')->constrained('courses')->restrictOnDelete();
            $t->string('code', 60)->nullable();
            $t->string('name');
            $t->text('description')->nullable();
            $t->json('pedagogical_content')->nullable();
            $t->decimal('credits', 8, 2)->nullable();
            $t->decimal('coefficient', 8, 3)->nullable();
            $t->unsignedInteger('cmi_hours')->default(0);
            $t->unsignedInteger('td_hours')->default(0);
            $t->unsignedInteger('tp_hours')->default(0);
            $t->timestamps();
            $t->unique(['curriculum_version_id', 'source_course_id'], 'curriculum_source_unique');
            $t->index(['curriculum_unit_id', 'curriculum_version_id']);
            $t->index('source_course_id');
        });
        Schema::table('academic_enrollments', function (Blueprint $t) {
            $t->foreignId('curriculum_version_id')->nullable()->constrained()->restrictOnDelete();
            $t->index(['curriculum_version_id', 'id'], 'enrollment_curriculum_idx');
            $t->foreignId('admission_cohort_id')->nullable()->constrained()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        // Never erase institution/curriculum records as an automatic release rollback.
        if (DB::table('universities')->exists()) {
            throw new RuntimeException('Academic structure contains data; use an approved forward migration, not a destructive rollback.');
        }
        Schema::table('academic_enrollments', function (Blueprint $t) {
            $t->dropIndex('enrollment_curriculum_idx');
            $t->dropConstrainedForeignId('curriculum_version_id');
            $t->dropConstrainedForeignId('admission_cohort_id');
        });
        Schema::table('classes', fn (Blueprint $t) => $t->dropConstrainedForeignId('academic_promotion_id'));
        foreach (['curriculum_items', 'curriculum_units', 'curriculum_versions', 'academic_promotions', 'admission_cohorts', 'academic_program_levels', 'academic_programs', 'academic_cycles', 'academic_departments'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('academic_years', function (Blueprint $t) {
            $t->dropIndex(['university_id']);
            $t->dropConstrainedForeignId('university_id');
        });
        Schema::table('faculties', function (Blueprint $t) {
            $t->dropIndex(['university_id']);
            $t->dropConstrainedForeignId('university_id');
        });
        Schema::dropIfExists('universities');
    }
};
