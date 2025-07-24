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
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')
                ->constrained('faculties')
                ->onDelete('cascade');
            $table->string('level_code', 10);
            $table->string('level_name', 100);
            $table->string('tag');
            $table->text('description')->nullable();
            $table->integer('student_number');
            $table->integer('credit_required');
            $table->integer('courses_number');
            $table->unsignedTinyInteger('duration_years')->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('image')->nullable();

            $table->timestamps();

            // Index unique pour éviter les doublons de niveau par faculté
            $table->unique(['faculty_id', 'level_code'], 'unique_level_per_faculty');

            // Index pour améliorer les performances des requêtes
            $table->index('faculty_id');
            $table->index('level_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};
