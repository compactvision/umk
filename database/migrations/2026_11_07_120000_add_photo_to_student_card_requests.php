<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_card_requests', function (Blueprint $table) {
            $table->string('photo_version', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('student_card_requests', function (Blueprint $table) {
            $table->dropColumn('photo_version');
        });
    }
};
