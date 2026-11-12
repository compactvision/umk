<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->index('application_id');
        });
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->dropUnique(['application_id']);
        });
        Schema::create('academic_progressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_enrollment_id')->unique()->constrained('academic_enrollments')->restrictOnDelete();
            $table->foreignId('target_enrollment_id')->nullable()->unique()->constrained('academic_enrollments')->restrictOnDelete();
            $table->foreignId('level_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('decided_by')->constrained('users')->restrictOnDelete();
            $table->string('reason', 1000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->unique('application_id');
        });
        Schema::dropIfExists('academic_progressions');
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->dropIndex(['application_id']);
        });
    }
};
