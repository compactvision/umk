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
        Schema::create('level_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')
                ->constrained('levels')
                ->onDelete('cascade');

            $table->decimal('price', 10, 2)->nullable();     // Prix du niveau
            $table->boolean('has_certificate')->default(false); // Offre une certification ?
            $table->string('language', 50)->nullable();      // Langue d'enseignement
            $table->unsignedTinyInteger('duration_months')->nullable(); // Durée en mois

            $table->integer('courses_number')->nullable();   // Nombre de cours
            $table->string('illustration_image')->nullable(); // Image explicative

            $table->text('course_objective')->nullable();    // Objectif du cours
            $table->json('options')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('level_details');
    }
};
