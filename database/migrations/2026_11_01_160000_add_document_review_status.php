<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollment_documents', function (Blueprint $table) {
            $table->string('review_status', 30)->default('pending');
        });
        \Illuminate\Support\Facades\DB::table('enrollment_documents')->where('verified', true)->update(['review_status' => 'accepted']);
    }

    public function down(): void
    {
        Schema::table('enrollment_documents', fn (Blueprint $table) => $table->dropColumn('review_status'));
    }
};
