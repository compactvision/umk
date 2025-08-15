<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create professors table first
        Schema::create('professors', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->enum('gender', ['M', 'F'])->nullable();
            $table->date('birth_date')->nullable();
            $table->string('photo')->nullable();
            $table->string('speciality')->nullable();
            $table->text('biography')->nullable();
            $table->date('hire_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create level_codes table for predefined levels
        Schema::create('level_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // L1, L2, L3, M1, M2, D1, D2
            $table->string('name', 100); // Première Licence, etc.
            $table->integer('order')->default(0); // Pour l'ordre d'affichage
            $table->timestamps();
        });

        // Create professor assignments table (relation ternaire)
        Schema::create('professor_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('professor_id');
            $table->unsignedBigInteger('faculty_id');
            $table->unsignedBigInteger('level_code_id');
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('professor_id')->references('id')->on('professors')->onDelete('cascade');
            $table->foreign('faculty_id')->references('id')->on('faculties')->onDelete('cascade');
            $table->foreign('level_code_id')->references('id')->on('level_codes')->onDelete('cascade');
            
            // Un professeur ne peut avoir qu'une seule affectation par faculté-niveau
            $table->unique(['professor_id', 'faculty_id', 'level_code_id'], 'prof_faculty_level_unique');
        });

        // Create assignment courses pivot table
        Schema::create('assignment_courses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('course_id');
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('assignment_id')->references('id')->on('professor_assignments')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            
            // Un cours ne peut être assigné qu'une fois par affectation
            $table->unique(['assignment_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_courses');
        Schema::dropIfExists('professor_assignments');
        Schema::dropIfExists('level_codes');
        Schema::dropIfExists('professors');
    }
};