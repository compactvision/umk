<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\Interfaces\EncoderInterface;

class ImageService
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    protected function getEncoder(string $extension, int $quality): EncoderInterface
    {
        return match (strtolower($extension)) {
            'webp' => new WebpEncoder(quality: $quality),
            'jpeg', 'jpg' => new JpegEncoder(quality: $quality),
            'png' => new PngEncoder(), // PNG ne prend pas la qualité en paramètre
            default => throw new \InvalidArgumentException("Format $extension non supporté."),
        };
    }

    public function resizeAndStore(
        UploadedFile $image,
        string $path,
        int $width,
        int $height,
        int $quality = 85
    ): string {
        $extension = $image->getClientOriginalExtension();
        $filename = uniqid() . '.' . $extension;

        $resized = $this->imageManager
            ->read($image->getRealPath())
            ->cover($width, $height)
            ->encode($this->getEncoder($extension, $quality));

//        Storage::put("public/{$path}/{$filename}", $resized->toString());
        Storage::disk('public')->put("{$path}/{$filename}", $resized->toString());


        return "{$path}/{$filename}";
    }

    
}
