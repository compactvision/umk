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
        //
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->string('excerpt', 300)->nullable();
            $table->longText('content')->nullable();

            // ✅ 2 images principales
            $table->string('main_image_1')->nullable();
            $table->string('main_image_2')->nullable();

            // ✅ autres images descriptives (chemins + metadonnées)
            // format: [{ "path": "...", "alt": "...", "caption": "..." }, ...]
            $table->json('gallery')->nullable();

            // UI/meta
            $table->string('read_time', 50)->nullable();
            $table->string('gradient')->nullable();
            $table->boolean('featured')->default(false);

            // Stats
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('likes')->default(0);
            $table->unsignedInteger('comments_count')->default(0);

            $table->string('status', 20)->default('draft'); // draft|published|archived
            $table->timestamp('published_at')->nullable();

            // SEO optionnels
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('posts');
    }
};
