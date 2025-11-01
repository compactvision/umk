<?php

namespace App\Modules\Blog\Domain\ValueObjects;

final class ImageSet
{
    public function __construct(
        public readonly ?string $main1,
        public readonly ?string $main2,
        /** @var array<int, array{path:string, alt?:string, caption?:string}> */
        public readonly array $gallery = [],
    ) {}

    public function toArray(): array
    {
        return [
            'main_image_1' => $this->main1,
            'main_image_2' => $this->main2,
            'gallery'      => $this->gallery,
        ];
    }
}
