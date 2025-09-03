<?php
namespace App\Modules\Identity\Domain\Services;

interface LoginRateLimiter
{
    public function ensureIsNotLimited(string $email): void;
    public function hit(string $email): void;
    public function clear(string $email): void;
}
