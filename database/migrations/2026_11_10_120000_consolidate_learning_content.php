<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_content_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_offering_id')->constrained()->restrictOnDelete();
            $table->string('title', 180);
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
            $table->index(['academic_offering_id', 'position']);
        });
        Schema::table('academic_resources', function (Blueprint $table) {
            $table->foreignId('academic_content_section_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('academic_session_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('supplementary_for_id')->nullable()->constrained('academic_resources')->restrictOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('revision')->default(0);
            $table->unsignedInteger('current_version')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->unsignedBigInteger('download_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->uuid('operation_key')->nullable()->unique();
            $table->string('operation_hash', 64)->nullable();
            $table->index(['academic_offering_id', 'archived_at', 'position'], 'learning_resource_order_idx');
            $table->index('academic_session_id');
            $table->index('supplementary_for_id');
        });
        Schema::create('academic_resource_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_resource_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('number');
            $table->json('snapshot');
            $table->foreignId('author_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->unique(['academic_resource_id', 'number'], 'learning_resource_version_unique');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Préservez les versions et références pédagogiques avant tout retrait de schéma.');
    }
};
