<?php
// app/Modules/Enrollment/Domain/ValueObjects/DocumentHash.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class DocumentHash
{
    private function __construct(private string $value)
    {
        if (!preg_match('/^[a-f0-9]{64}$/', $value)) {
            throw new InvalidArgumentException("Hash SHA-256 invalide");
        }
    }

    public static function fromString(string $hash): self
    {
        return new self(strtolower($hash));
    }

    public static function fromFile(string $filePath): self
    {
        if (!file_exists($filePath)) {
            throw new InvalidArgumentException("Fichier introuvable: {$filePath}");
        }
        
        $hash = hash_file('sha256', $filePath);
        if ($hash === false) {
            throw new InvalidArgumentException("Impossible de calculer le hash du fichier");
        }
        
        return new self($hash);
    }

    public static function fromContent(string $content): self
    {
        return new self(hash('sha256', $content));
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}