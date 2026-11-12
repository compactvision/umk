<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->string('category', 24);
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
            $table->index(['academic_year_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_calendar_events');
    }
};
