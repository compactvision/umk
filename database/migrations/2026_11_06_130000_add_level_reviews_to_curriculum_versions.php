<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('curriculum_versions', function (Blueprint $table) {
            $table->json('level_reviews')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('curriculum_versions', function (Blueprint $table) {
            $table->dropColumn('level_reviews');
        });
    }
};
