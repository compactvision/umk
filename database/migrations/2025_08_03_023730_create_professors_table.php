<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('professors', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->enum('gender', ['M', 'F'])->nullable();
            $table->date('birth_date')->nullable();
            $table->string('photo')->nullable();

            // ✅ Relations
            $table->foreignId('faculty_id')
                  ->constrained('faculties')
                  ->onDelete('cascade');

            $table->foreignId('level_id')
                  ->constrained('levels')
                  ->onDelete('cascade');

            $table->string('speciality')->nullable();
            $table->text('biography')->nullable();
            $table->date('hire_date')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });

        // ✅ Table pivot pour lier professeurs et cours (many-to-many)
        Schema::create('course_professor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->foreignId('professor_id')->constrained('professors')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professors');
        Schema::dropIfExists('course_professor');
    }
};
