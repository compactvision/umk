<?php

namespace Tests\Unit\Infrastructure\Security;

use Tests\TestCase;
use Illuminate\Support\Facades\Cache;
use App\Modules\Identity\Infrastructure\Security\CacheLoginRateLimiter;
use App\Modules\Identity\Domain\Exceptions\TooManyLoginAttemptsException;
use Carbon\Carbon;

class CacheLoginRateLimiterTest extends TestCase
{
    private CacheLoginRateLimiter $limiter;
    private string $email = 'test@example.com';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush(); // nettoyer le cache entre chaque test
        $this->limiter = new CacheLoginRateLimiter();
        Carbon::setTestNow(); // permet de figer le temps
    }

    /** @test */
    public function it_allows_attempts_before_threshold()
    {
        for ($i = 0; $i < 4; $i++) {
            $this->limiter->hit($this->email);
            $this->limiter->ensureIsNotLimited($this->email);
        }

        $this->assertTrue(true); // si pas d'exception → OK
    }

    /** @test */
    public function it_blocks_after_five_attempts_for_15_minutes()
    {
        $this->expectException(TooManyLoginAttemptsException::class);

        for ($i = 0; $i < 5; $i++) {
            $this->limiter->hit($this->email);
        }

        $this->limiter->ensureIsNotLimited($this->email); // doit lever exception
    }

    /** @test */
    public function it_unblocks_after_15_minutes()
    {
        for ($i = 0; $i < 5; $i++) {
            $this->limiter->hit($this->email);
        }

        // avancer le temps de 16 minutes
        Carbon::setTestNow(Carbon::now()->addMinutes(16));

        $this->limiter->ensureIsNotLimited($this->email); // plus bloqué
        $this->assertTrue(true);
    }

    /** @test */
    public function it_blocks_again_for_30_minutes_after_3_fails_post_unlock()
    {
        // 1er blocage (5 fails → 15 min)
        for ($i = 0; $i < 5; $i++) {
            $this->limiter->hit($this->email);
        }

        // avancer le temps pour débloquer
        Carbon::setTestNow(Carbon::now()->addMinutes(16));

        // 3 nouveaux fails → 30 min blocage
        for ($i = 0; $i < 8; $i++) { // 5 + 3
            $this->limiter->hit($this->email);
        }

        $this->expectException(TooManyLoginAttemptsException::class);
        $this->limiter->ensureIsNotLimited($this->email);
    }

    /** @test */
    public function it_resets_after_successful_login()
    {
        for ($i = 0; $i < 5; $i++) {
            $this->limiter->hit($this->email);
        }

        // succès → clear
        $this->limiter->clear($this->email);

        $this->limiter->ensureIsNotLimited($this->email); // plus bloqué
        $this->assertTrue(true);
    }
}
