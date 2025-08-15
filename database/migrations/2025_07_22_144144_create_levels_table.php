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
            $table->foreignId('faculty_id')
                ->constrained('faculties')
                ->onDelete('cascade');

            $table->foreignId('level_code_id')
                ->constrained('level_codes')
                ->onDelete('cascade');

            $table->string('level_name', 100);
            $table->string('tag');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('image')->nullable();

            $table->timestamps();

            // ✅ Utilise bien level_code_id
            $table->unique(['faculty_id', 'level_code_id'], 'unique_level_per_faculty');

            $table->index('faculty_id');
            $table->index('level_code_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};
