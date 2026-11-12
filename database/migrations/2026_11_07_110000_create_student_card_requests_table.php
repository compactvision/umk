<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_card_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_enrollment_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('pending');
            $table->string('decision_note', 500)->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_card_requests');
    }
};
