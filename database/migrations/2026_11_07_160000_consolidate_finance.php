<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_tariffs', function (Blueprint $t) {
            $t->id();
            $t->string('scope_key', 64);
            $t->unsignedInteger('version');
            $t->foreignId('academic_year_id')->constrained()->restrictOnDelete();
            $t->foreignId('academic_program_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('academic_cycle_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('level_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('category', 50);
            $t->string('kind', 50);
            $t->string('title', 180);
            $t->string('currency', 3);
            $t->date('valid_from');
            $t->date('valid_until')->nullable();
            $t->string('status', 20)->default('draft');
            $t->json('schedule');
            $t->text('reason');
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
            $t->unique(['scope_key', 'version']);
            $t->index(['academic_year_id', 'status']);
        });
        Schema::table('student_obligations', function (Blueprint $t) {
            $t->foreignId('finance_tariff_id')->nullable()->constrained('finance_tariffs')->restrictOnDelete();
            $t->string('currency', 3)->nullable();
            $t->json('source_snapshot')->nullable();
            $t->index(['academic_enrollment_id', 'kind', 'due_at'], 'finance_obligation_schedule_index');
        });
        Schema::table('student_payments', function (Blueprint $t) {
            $t->json('receipt_snapshot')->nullable();
        });
        Schema::table('student_financial_adjustments', function (Blueprint $t) {
            $t->unsignedInteger('percentage_basis_points')->nullable();
            $t->string('funding_source', 20)->default('institution');
            $t->boolean('stackable')->default(true);
            $t->uuid('operation_key')->nullable();
            $t->string('request_hash', 64)->nullable();
            $t->index(['academic_enrollment_id', 'fee_kind', 'is_active'], 'finance_active_adjustment_index');
            $t->unique(['academic_enrollment_id', 'operation_key'], 'financial_adjustment_operation_unique');
        });
        Schema::create('student_payment_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_payment_id')->constrained()->restrictOnDelete();
            $t->foreignId('student_obligation_id')->constrained()->restrictOnDelete();
            $t->unsignedBigInteger('amount_cents');
            $t->foreignId('allocated_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('created_at');
            $t->index('student_obligation_id', 'finance_allocation_obligation_index');
            $t->unique(['student_payment_id', 'student_obligation_id'], 'payment_obligation_allocation_unique');
        });
        Schema::create('student_payment_refunds', function (Blueprint $t) {
            $t->id();
            $t->uuid('uuid')->unique();
            $t->foreignId('student_payment_id')->constrained()->restrictOnDelete();
            $t->uuid('operation_key')->unique();
            $t->unsignedBigInteger('amount_cents');
            $t->string('status', 20)->default('requested');
            $t->text('reason');
            $t->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $t->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->foreignId('executed_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->string('method', 30)->nullable();
            $t->string('execution_reference', 180)->nullable()->unique();
            $t->index(['student_payment_id', 'status'], 'finance_payment_refund_status_index');
            $t->timestamp('approved_at')->nullable();
            $t->timestamp('executed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('student_refund_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_payment_refund_id')->constrained()->restrictOnDelete();
            $t->foreignId('student_payment_allocation_id')->constrained()->restrictOnDelete();
            $t->unsignedBigInteger('amount_cents');
            $t->unique(['student_payment_refund_id', 'student_payment_allocation_id'], 'refund_allocation_unique');
        });
        Schema::create('finance_bank_lines', function (Blueprint $t) {
            $t->id();
            $t->string('account', 100);
            $t->string('bank_reference', 180);
            $t->string('payment_reference', 180);
            $t->unsignedBigInteger('amount_cents');
            $t->string('currency', 3);
            $t->date('operation_date');
            $t->foreignId('student_payment_id')->nullable()->constrained()->restrictOnDelete();
            $t->foreignId('reconciled_by')->constrained('users')->restrictOnDelete();
            $t->timestamp('created_at');
            $t->unique(['account', 'bank_reference'], 'bank_operation_unique');
        });
    }

    public function down(): void
    {
        throw new RuntimeException('Le retrait du schéma financier exige un plan de conservation explicite. Aucun historique ne sera supprimé automatiquement.');
    }
};
