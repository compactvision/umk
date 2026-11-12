<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('institution', 100);
            $table->string('heading', 60);
            $table->string('color', 7);
            $table->string('back_text', 220)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_card_templates');
    }
};
