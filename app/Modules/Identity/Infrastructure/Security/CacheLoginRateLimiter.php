<?php

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Domain\Exceptions\TooManyLoginAttemptsException;
use App\Modules\Identity\Domain\Services\LoginRateLimiter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

final class CacheLoginRateLimiter implements LoginRateLimiter
{
    private int $firstThreshold = 5;

    private int $firstDelay = 15; // minutes

    private int $secondThreshold = 3;

    private int $secondDelay = 30; // minutes

    public function ensureIsNotLimited(string $email): void
    {
        $key = $this->getKey($email);

        $data = Cache::get($key, ['attempts' => 0, 'locked_until' => null]);

        if ($data['locked_until'] && Carbon::now()->lessThan($data['locked_until'])) {
            $minutes = Carbon::now()->diffInMinutes($data['locked_until']);
            throw new TooManyLoginAttemptsException("Trop de tentatives. Réessayez dans {$minutes} minutes.");
        }
    }

    public function hit(string $email): void
    {
        $key = $this->getKey($email);
        Cache::lock($key.':lock', 5)->block(3, function () use ($key) {
            $data = Cache::get($key, ['attempts' => 0, 'locked_until' => null]);

            $data['attempts']++;

            // 1ère série (5 tentatives → 15min)
            if ($data['attempts'] >= $this->firstThreshold && ! $data['locked_until']) {
                $data['locked_until'] = Carbon::now()->addMinutes($this->firstDelay);
            }
            // 2ème série (3 tentatives → 30min)
            elseif ($data['locked_until'] && $data['attempts'] >= $this->firstThreshold + $this->secondThreshold) {
                $data['locked_until'] = Carbon::now()->addMinutes($this->secondDelay);
            }

            Cache::put($key, $data, now()->addHour());
        });
    }

    public function clear(string $email): void
    {
        $key = $this->getKey($email);
        Cache::lock($key.':lock', 5)->block(3, fn () => Cache::forget($key));
    }

    private function getKey(string $email): string
    {
        return 'login:attempts:'.sha1(mb_strtolower(trim($email)));
    }
}
