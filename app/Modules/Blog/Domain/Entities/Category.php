<?php

namespace App\Modules\Blog\Domain\Entities;

final class Category
{
    public function __construct(
        public ?int $id,
        public string $name,
        public string $slug,
        public ?string $color,
        public ?string $description,
    ) {}
}
