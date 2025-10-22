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
        Schema::create('enrollment_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnUpdate()->cascadeOnDelete();

            $table->string('code', 80)->index(); // ex: 'diplome', 'photo_id', 'preuve_paiement'
            $table->text('message');             // consigne envoyée à l’étudiant
            $table->timestamp('deadline_at')->nullable();
            $table->boolean('fulfilled')->default(false)->index();
            $table->timestamp('fulfilled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['enrollment_id', 'code', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_requirements');
    }
};
