<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_settings', function (Blueprint $t) {
            $t->id();
            $t->json('values');
            $t->timestamps();
        });
        Schema::create('seo_pages', function (Blueprint $t) {
            $t->id();
            $t->string('path')->unique();
            $t->string('title')->nullable();
            $t->string('description', 320)->nullable();
            $t->string('image')->nullable();
            $t->string('canonical_path')->nullable();
            $t->boolean('indexable')->default(true);
            $t->timestamps();
        });
        Schema::create('legal_pages', function (Blueprint $t) {
            $t->id();
            $t->string('key')->unique();
            $t->string('title');
            $t->longText('content');
            $t->string('status')->default('draft');
            $t->timestamp('approved_at')->nullable();
            $t->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamps();
        });
        Schema::create('seo_event_counts', function (Blueprint $t) {
            $t->id();
            $t->date('day');
            $t->string('event', 40);
            $t->string('path', 200);
            $t->unsignedBigInteger('total')->default(0);
            $t->unique(['day', 'event', 'path']);
        });
    }

    public function down(): void
    {
        foreach (['seo_event_counts', 'legal_pages', 'seo_pages', 'seo_settings'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
