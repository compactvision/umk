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
        
            // Informations financières et académiques
            $table->decimal('price', 10, 2)->nullable();       // Prix du niveau
            $table->boolean('has_certificate')->default(false); // Offre une certification ?
            $table->string('language', 50)->nullable();        // Langue d'enseignement
            $table->unsignedTinyInteger('duration_years')->default(1); // Durée en années
            $table->integer('student_number')->nullable();     // Nombre d'étudiants
            $table->integer('credit_required')->nullable();    // Crédits requis
        
            // Cursus
            $table->integer('courses_number')->nullable();     // Nombre de cours
            $table->string('illustration_image')->nullable();  // Illustration du programme
            $table->text('course_objective')->nullable();      // Objectif du programme
        
            // Divers
            $table->integer('fees')->nullable()->default(0);   // Frais supplémentaires
            $table->json('options')->nullable();               // Options flexibles (JSON : "evening_class", "online", etc.)
        
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
