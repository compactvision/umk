<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $t) {
            $t->unsignedSmallInteger('cmi_hours')->nullable();
            $t->unsignedSmallInteger('td_hours')->nullable();
            $t->unsignedSmallInteger('tp_hours')->nullable();
            $t->text('pedagogical_content')->nullable();
        });
        Schema::table('academic_offerings', function (Blueprint $t) {
            $t->foreignId('assistant_professor_id')->nullable()->constrained('professors')->restrictOnDelete();
            $t->string('group_leader_name', 180)->nullable();
            $t->string('delivery_mode', 20)->default('in_person');
        });
        Schema::table('academic_resources', function (Blueprint $t) { $t->text('url')->nullable(); });
        Schema::create('academic_attendances', function (Blueprint $t) {
            $t->id();
            $t->foreignId('academic_session_id')->constrained()->cascadeOnDelete();
            $t->foreignId('academic_enrollment_id')->constrained()->cascadeOnDelete();
            $t->string('status', 15);
            $t->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
            $t->unique(['academic_session_id', 'academic_enrollment_id'], 'academic_attendance_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_attendances');
        Schema::table('academic_resources', fn (Blueprint $t) => $t->dropColumn('url'));
        Schema::table('academic_offerings', function (Blueprint $t) { $t->dropConstrainedForeignId('assistant_professor_id'); $t->dropColumn(['group_leader_name', 'delivery_mode']); });
        Schema::table('courses', fn (Blueprint $t) => $t->dropColumn(['cmi_hours', 'td_hours', 'tp_hours', 'pedagogical_content']));
    }
};
