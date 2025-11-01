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
        Schema::create('enrollment_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnUpdate()->cascadeOnDelete();

            $table->uuid('uuid')->unique()->index();

            // type fonctionnel ex: 'diplome', 'releve_notes', 'id_card', 'photo'
            $table->string('type', 80)->index();

            // stockage privé (Storage::disk('private')) — chemin interne
            $table->string('disk', 50)->default('private');
            $table->string('path');      // 'enrollments/2025/123/uuid.pdf'
            $table->string('filename');  // nom original
            $table->string('mime', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->boolean('is_temp')->default(true)->index();
            $table->string('key', 120);

            // intégrité et anti-fraude
            $table->string('sha256', 64)->index();

            // workflow de vérification
            $table->boolean('verified')->default(false)->index();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('comment')->nullable();

            // versionnage simple: incrément si ré-upload demandé
            $table->unsignedInteger('version')->default(1);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['enrollment_id','key','is_temp'], 'enroll_docs_unique_by_state');
            $table->index(['enrollment_id', 'type', 'version', 'verified_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_documents');
    }
};
