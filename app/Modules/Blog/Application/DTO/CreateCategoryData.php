<?php

namespace App\Modules\Blog\Application\DTO;

final class CreateCategoryData
{
    public function __construct(
        public string $name,
        public ?string $color,
        public ?string $description,
    ) {}
}
