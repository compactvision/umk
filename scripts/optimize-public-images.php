<?php
// Reproducible public-image derivatives. Originals are retained.
$root = dirname(__DIR__);
$manifest = [];
foreach (glob($root.'/public/assets/usk/*.{jpg,jpeg,png}', GLOB_BRACE) as $file) {
    [$width, $height, $type] = getimagesize($file);
    $source = match ($type) { IMAGETYPE_JPEG => imagecreatefromjpeg($file), IMAGETYPE_PNG => imagecreatefrompng($file), default => null };
    if (!$source || $width < 400) continue;
    $variants = [];
    foreach (array_unique([min(480, $width), min(800, $width), min(1200, $width)]) as $targetWidth) {
        $targetHeight = (int) round($height * $targetWidth / $width);
        $image = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($image, false); imagesavealpha($image, true);
        imagecopyresampled($image, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
        $name = pathinfo($file, PATHINFO_FILENAME).'-'.$targetWidth.'.webp';
        imagewebp($image, dirname($file).'/'.$name, 78);
        $variants[] = ['src' => '/assets/usk/'.$name, 'width' => $targetWidth, 'bytes' => filesize(dirname($file).'/'.$name)];
        imagedestroy($image);
    }
    $manifest['/assets/usk/'.basename($file)] = ['width' => $width, 'height' => $height, 'originalBytes' => filesize($file), 'variants' => $variants];
    imagedestroy($source);
}
file_put_contents($root.'/resources/js/lib/public-images.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
echo count($manifest)." images optimisées\n";
