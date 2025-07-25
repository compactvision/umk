<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')
                ->constrained('levels')
                ->onDelete('cascade');

            $table->string('title');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('credits')->default(0);
            $table->string('language', 50)->nullable();
            $table->string('teacher')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
