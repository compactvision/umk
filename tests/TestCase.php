<?php

namespace Tests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        $driver = $app['config']->get('database.default');
        $database = $app['config']->get('database.connections.'.$driver.'.database');
        if (! (($driver === 'sqlite' && $database === ':memory:') || ($driver === 'pgsql' && $database === 'umk_test'))) {
            throw new \RuntimeException('Tests must use SQLite :memory: or the disposable PostgreSQL database umk_test.');
        }

        return $app;
    }

    // actingAs simulates a fresh authentication, including the session fingerprint.
    public function actingAs(Authenticatable $user, $guard = null)
    {
        parent::actingAs($user, $guard);
        $this->app['session']->put('password_hash_'.($guard ?? config('auth.defaults.guard')), $user->getAuthPassword());

        return $this;
    }
}
