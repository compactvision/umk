<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_department_level', function (Blueprint $table) {
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_department_id')->constrained()->restrictOnDelete();
            $table->primary(['level_id', 'academic_department_id']);
        });

        foreach (['academic_enrollments', 'academic_offerings'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->foreignId('academic_department_id')->nullable()->constrained()->restrictOnDelete();
                $table->index(['level_id', 'academic_department_id']);
            });
        }
    }

    public function down(): void
    {
        foreach (['academic_enrollments', 'academic_offerings'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropIndex(['level_id', 'academic_department_id']);
                $table->dropConstrainedForeignId('academic_department_id');
            });
        }

        Schema::dropIfExists('academic_department_level');
    }
};
