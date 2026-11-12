<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_unit_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('curriculum_unit_id')->constrained()->restrictOnDelete();
            $table->decimal('score', 4, 2);
            $table->boolean('validated');
            $table->timestamps();
            $table->unique(['academic_enrollment_id', 'curriculum_unit_id'], 'academic_unit_result_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_unit_results');
    }
};
