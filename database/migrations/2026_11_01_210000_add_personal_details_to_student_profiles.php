<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->json('personal_details')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('photo_mime', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['personal_details', 'photo_path', 'photo_mime']);
        });
    }
};
