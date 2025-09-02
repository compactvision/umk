<?php

namespace App\Modules\Identity\Domain\Entities;

final class User
{
    public function __construct(
        private ?int $id,
        private string $lastName,
        private string $firstName,
        private ?string $postName,
        private ?string $gender,
        private string $email,
        private string $password,
        private ?\DateTimeImmutable $verifiedAt = null
    ) {}

    public static function register(string $lastName, string $firstName, ?string $postName, ?string $gender, string $email, string $hashedPassword): self
    {
        return new self(null, $lastName, $firstName, $postName, $gender, $email, $hashedPassword, null);
    }

    public function verifiedAt(): ?\DateTimeImmutable { return $this->verifiedAt; }

    // Getters
    public function id(): ?int { return $this->id; }
    public function lastName(): string { return $this->lastName; }
    public function firstName(): string { return $this->firstName; }
    public function postName(): ?string { return $this->postName; }
    public function gender(): ?string { return $this->gender; }
    public function email(): string { return $this->email; }
    public function password(): string { return $this->password; }
    
    public function isVerified(): bool
    {
        return $this->verifiedAt !== null;
    }

    public function markEmailAsVerified(): void
    {
        $this->verifiedAt = new \DateTimeImmutable();
    }
}
