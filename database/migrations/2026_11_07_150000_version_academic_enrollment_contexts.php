<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Existing contexts keep their reservation. Only an authorized transfer releases it.
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->unsignedTinyInteger('context_slot')->nullable()->default(1);
            $table->unique(['student_profile_id', 'level_id', 'academic_year_id', 'context_slot'], 'academic_reserved_context_unique');
        });
        // Derive only new metadata from an existing, auditable transfer decision.
        DB::table('academic_enrollments')->where('enrollment_status', 'transferred')
            ->whereExists(fn ($query) => $query->selectRaw('1')->from('academic_enrollment_changes')
                ->whereColumn('academic_enrollment_changes.academic_enrollment_id', 'academic_enrollments.id')
                ->where('action', 'transfer')->whereNotNull('target_enrollment_id'))
            ->update(['context_slot' => null]);
        Schema::table('academic_enrollments', fn (Blueprint $table) => $table->dropUnique('academic_context_unique'));
        Schema::table('academic_enrollment_changes', fn (Blueprint $table) => $table->index(['target_enrollment_id', 'effective_at'], 'enrollment_transfer_target_idx'));
    }

    public function down(): void
    {
        if (DB::table('academic_enrollments')->whereNull('context_slot')->exists()) {
            throw new RuntimeException('Des contextes versionnés existent. Conservez leur historique ; le retour à l’ancienne unicité exige une procédure dédiée.');
        }
        Schema::table('academic_enrollment_changes', fn (Blueprint $table) => $table->dropIndex('enrollment_transfer_target_idx'));
        Schema::table('academic_enrollments', fn (Blueprint $table) => $table->unique(['student_profile_id', 'level_id', 'academic_year_id'], 'academic_context_unique'));
        Schema::table('academic_enrollments', function (Blueprint $table) {
            $table->dropUnique('academic_reserved_context_unique');
            $table->dropColumn('context_slot');
        });
    }
};
