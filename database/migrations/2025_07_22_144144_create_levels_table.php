<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained()->onDelete('cascade');
            $table->string('title'); // Exemple : "Licence 1"
            $table->string('code', 10); // Exemple : "L1"
            $table->string('image')->nullable();
            $table->string('tag')->nullable(); 
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['faculty_id', 'code']); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};
