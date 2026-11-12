<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_student_password_can_be_updated(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->from('/dashboard/student/profile')
            ->post('/dashboard/student/profile/password', ['current_password' => 'password', 'password' => 'New-password-123', 'password_confirmation' => 'New-password-123'])
            ->assertSessionHasNoErrors()->assertRedirect('/dashboard/student/profile');
        $this->assertTrue(Hash::check('New-password-123', $user->fresh()->password));
        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_incorrect_current_password_does_not_mutate_credentials(): void
    {
        $user = $this->studentContext();
        $before = $user->password;
        $this->actingAs($user)->from('/dashboard/student/profile')
            ->post('/dashboard/student/profile/password', ['current_password' => 'wrong', 'password' => 'New-password-123', 'password_confirmation' => 'New-password-123'])
            ->assertSessionHasErrorsIn('studentPassword', 'current_password');
        $this->assertSame($before, $user->fresh()->password);
    }
}
