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
        Schema::create('admission_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('level_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('title'); // ex: "Avoir un diplôme d'Etat"
            $table->text('description')->nullable(); // détails supplémentaires
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admission_conditions');
    }
};
