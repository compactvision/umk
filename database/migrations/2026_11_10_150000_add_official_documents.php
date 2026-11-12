<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('official_document_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->constrained()->restrictOnDelete();
            $table->foreignId('faculty_id')->constrained()->restrictOnDelete();
            $table->string('code', 25);
            $table->string('name', 140);
            $table->string('kind', 20);
            $table->json('policy');
            $table->boolean('active')->default(false);
            $table->timestamps();
            $table->unique(['faculty_id', 'code']);
        });
        Schema::create('official_document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('official_document_type_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('version');
            $table->string('title', 140);
            $table->text('body');
            $table->json('layout');
            $table->foreignId('signer_id')->constrained('users')->restrictOnDelete();
            $table->string('capacity', 140);
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();
            $table->unique(['official_document_type_id', 'version'], 'official_template_version_unique');
        });
        Schema::create('official_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_service_request_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('official_document_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('official_document_template_id')->constrained()->restrictOnDelete();
            $table->foreignId('academic_enrollment_id')->constrained()->restrictOnDelete();
            $table->foreignId('previous_id')->nullable()->constrained('official_documents')->restrictOnDelete();
            $table->uuid('reference')->unique();
            $table->string('number', 100)->nullable()->unique();
            $table->json('snapshot');
            $table->string('status', 16)->default('issued');
            $table->string('sha256', 64)->nullable();
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('issued_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['academic_enrollment_id', 'official_document_type_id', 'status'], 'official_doc_owner_type_idx');
        });
        Schema::table('student_service_requests', function (Blueprint $table) {
            $table->foreignId('official_document_type_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('official_document_template_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('document_source_result_id')->nullable()->constrained('academic_official_results')->restrictOnDelete();
            $table->foreignId('document_previous_id')->nullable()->constrained('official_documents')->restrictOnDelete();
            $table->foreignId('document_approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('document_action', 16)->nullable();
            $table->string('document_pending_key', 100)->nullable()->unique();
            $table->uuid('document_operation_key')->nullable();
            $table->unsignedInteger('document_revision')->default(1);
            $table->string('document_fingerprint', 64)->nullable();
            $table->text('document_mandate')->nullable();
            $table->unique(['academic_enrollment_id', 'document_operation_key'], 'official_request_operation_unique');
            $table->index(['official_document_type_id', 'status'], 'official_request_type_status_idx');
        });
        Schema::table('student_card_issuances', function (Blueprint $table) {
            $table->foreignId('replaced_by_official_id')->nullable()->constrained('official_documents')->restrictOnDelete();
        });
        Schema::table('academic_result_documents', function (Blueprint $table) {
            $table->timestamp('document_revoked_at')->nullable();
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Exportez les références et archives officielles avant toute dépose du schéma.');
    }
};
