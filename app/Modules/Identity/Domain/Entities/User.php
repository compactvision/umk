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
        private ?\DateTimeImmutable $verifiedAt = null,
        private string $role = 'user'
    ) {}

    public static function register(string $lastName, string $firstName, ?string $postName, ?string $gender, string $email, string $passwordHash): self
    {
        return new self(null, $lastName, $firstName, $postName, $gender, $email, $passwordHash, null, 'user');
    }

    public static function registerFromSocial(
        string $provider,
        string $providerId,
        string $lastName,
        string $firstName,
        string $email
    ): self {
        return new self(
            null,
            $lastName,
            $firstName,
            null,
            null,
            $email,
            '', // pas de password (social login)
            new \DateTimeImmutable(),
            'user'
        );
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
    public function role(): string { return $this->role; }
    public function assignRole(string $role): void { $this->role = $role; }
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }
    
    public function isVerified(): bool
    {
        return $this->verifiedAt !== null;
    }

    public function markEmailAsVerified(): void
    {
        $this->verifiedAt = new \DateTimeImmutable();
    }
}
