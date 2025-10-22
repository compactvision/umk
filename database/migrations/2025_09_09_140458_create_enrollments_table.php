<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
// NB: tes enums ne sont pas utilisés ici : supprime-les de l'import si inutiles
// use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
// use App\Modules\Enrollment\Domain\Enums\PaymentStatus;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Si la table n'existe pas, on la crée au complet
        if (!Schema::hasTable('enrollments')) {
            Schema::create('enrollments', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique()->index();
                $table->foreignId('student_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
                $table->foreignId('level_id')->constrained('levels')->cascadeOnUpdate()->restrictOnDelete()->nullable();

                // Laisse tes valeurs par défaut réelles ici si tu utilises des enums PHP:
                $table->string('status', 40)->default('draft')->index();
                $table->string('payment_status', 20)->default('unpaid')->index();

                $table->date('enrolled_at')->nullable();
                $table->string('matricule')->nullable()->unique();
                $table->text('notes')->nullable();
                $table->json('meta')->nullable();

                // 🔹 Ajouts “draft/autosave” et année académique directement à la création :
                $table->foreignId('academic_year_id')->nullable()
                      ->constrained('academic_years')->nullOnDelete()->cascadeOnUpdate();
                $table->unsignedTinyInteger('last_step')->default(1);
                $table->json('form_snapshot')->nullable();
                $table->timestamp('draft_expires_at')->nullable()->index();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['level_id', 'status']);
                $table->index(['student_id', 'status']);
                $table->index(['academic_year_id']);
            });

            return; // on sort, pas besoin d'altérer
        }

        // 2) Sinon, la table existe : on ajoute juste ce qui manque
        Schema::table('enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('enrollments', 'academic_year_id')) {
                $table->foreignId('academic_year_id')->nullable()
                      ->constrained('academic_years')->nullOnDelete()->cascadeOnUpdate();
                $table->index(['academic_year_id']);
            }
            if (!Schema::hasColumn('enrollments', 'last_step')) {
                $table->unsignedTinyInteger('last_step')->default(1);
            }
            if (!Schema::hasColumn('enrollments', 'form_snapshot')) {
                $table->json('form_snapshot')->nullable();
            }
            if (!Schema::hasColumn('enrollments', 'draft_expires_at')) {
                $table->timestamp('draft_expires_at')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('enrollments')) {
            return;
        }

        Schema::table('enrollments', function (Blueprint $table) {
            if (Schema::hasColumn('enrollments', 'draft_expires_at')) {
                $table->dropColumn('draft_expires_at');
            }
            if (Schema::hasColumn('enrollments', 'form_snapshot')) {
                $table->dropColumn('form_snapshot');
            }
            if (Schema::hasColumn('enrollments', 'last_step')) {
                $table->dropColumn('last_step');
            }
            if (Schema::hasColumn('enrollments', 'academic_year_id')) {
                // supprime la FK + la colonne
                $table->dropConstrainedForeignId('academic_year_id');
            }
        });
    }
};
