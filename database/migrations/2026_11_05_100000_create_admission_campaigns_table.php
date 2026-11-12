<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_program_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('level_id')->constrained()->restrictOnDelete();
            $table->boolean('is_open')->default(true);
            $table->date('opens_on')->nullable();
            $table->date('closes_on')->nullable();
            $table->json('additional_documents')->nullable();
            $table->timestamps();
            $table->unique(['academic_program_id', 'academic_year_id', 'level_id'], 'admission_campaign_context_unique');
        });
    }

    public function down(): void
    {
        if (DB::table('admission_campaigns')->exists()) {
            throw new RuntimeException('Les campagnes configurées doivent être conservées.');
        }

        Schema::dropIfExists('admission_campaigns');
    }
};
