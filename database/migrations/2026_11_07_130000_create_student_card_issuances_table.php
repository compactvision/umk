<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_card_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_enrollment_id')->unique()->constrained()->restrictOnDelete();
            $table->string('student_name');
            $table->string('matricule');
            $table->string('academic_year');
            $table->string('template_name');
            $table->timestamp('printed_at');
            $table->foreignId('printed_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('collected_at')->nullable();
            $table->foreignId('collected_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->index(['collected_at', 'printed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_card_issuances');
    }
};
