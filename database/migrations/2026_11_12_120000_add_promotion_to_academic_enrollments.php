<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->foreignId('academic_promotion_id')->nullable()->constrained()->restrictOnDelete();
            $table->index('academic_promotion_id', 'academic_enrollments_promotion_index');
        });
    }

    public function down(): void
    {
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->dropIndex('academic_enrollments_promotion_index');
            $table->dropConstrainedForeignId('academic_promotion_id');
        });
    }
};
