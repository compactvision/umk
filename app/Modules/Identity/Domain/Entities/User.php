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
        private string $passwordHash,
        private ?\DateTimeImmutable $verifiedAt = null
    ) {}

    public static function register(string $lastName, string $firstName, ?string $postName, ?string $gender, string $email, string $passwordHash): self
    {
        return new self(null, $lastName, $firstName, $postName, $gender, $email, $passwordHash);
    }

    public function verifiedAt(): ?\DateTimeImmutable { return $this->verifiedAt; }

    // Getters
    public function id(): ?int { return $this->id; }
    public function lastName(): string { return $this->lastName; }
    public function firstName(): string { return $this->firstName; }
    public function postName(): ?string { return $this->postName; }
    public function gender(): ?string { return $this->gender; }
    public function email(): string { return $this->email; }
    public function passwordHash(): string { return $this->passwordHash; }
    
    public function isVerified(): bool
    {
        return $this->verifiedAt !== null;
    }

    public function markEmailAsVerified(): void
    {
        $this->verifiedAt = new \DateTimeImmutable();
    }
}
