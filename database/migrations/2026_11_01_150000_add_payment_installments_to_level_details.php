<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('level_details', function (Blueprint $table) {
            foreach (['price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second'] as $field) {
                $table->decimal($field, 10, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('level_details', fn (Blueprint $table) => $table->dropColumn(['price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second']));
    }
};
