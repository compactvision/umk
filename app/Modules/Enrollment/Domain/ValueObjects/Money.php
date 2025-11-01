<?php
// app/Modules/Enrollment/Domain/ValueObjects/Money.php

namespace App\Modules\Enrollment\Domain\ValueObjects;

use InvalidArgumentException;

final readonly class Money
{
    private function __construct(
        private int $amount, // Montant en centimes pour éviter les problèmes de précision
        private string $currency
    ) {
        if ($amount < 0) {
            throw new InvalidArgumentException("Le montant ne peut pas être négatif");
        }

        if (strlen($currency) !== 3) {
            throw new InvalidArgumentException("Code devise invalide (doit être ISO 4217)");
        }
    }

    public static function fromAmount(float $amount, string $currency): self
    {
        return new self((int) round($amount * 100), strtoupper($currency));
    }

    public static function fromCents(int $cents, string $currency): self
    {
        return new self($cents, strtoupper($currency));
    }

    public function getAmount(): float
    {
        return $this->amount / 100;
    }

    public function getCents(): int
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount - $other->amount, $this->currency);
    }

    public function multiply(float $multiplier): self
    {
        return new self((int) round($this->amount * $multiplier), $this->currency);
    }

    public function isZero(): bool
    {
        return $this->amount === 0;
    }

    public function isGreaterThan(self $other): bool
    {
        $this->assertSameCurrency($other);
        return $this->amount > $other->amount;
    }

    public function isLessThan(self $other): bool
    {
        $this->assertSameCurrency($other);
        return $this->amount < $other->amount;
    }

    public function equals(self $other): bool
    {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    public function format(): string
    {
        $formatted = number_format($this->getAmount(), 2, ',', ' ');
        return "{$formatted} {$this->currency}";
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Impossible d'opérer sur des devises différentes: {$this->currency} vs {$other->currency}"
            );
        }
    }

    public function __toString(): string
    {
        return $this->format();
    }
}