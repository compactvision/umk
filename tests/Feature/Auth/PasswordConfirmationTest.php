<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

// The active product confirms the current password inside sensitive student forms.
class PasswordConfirmationTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_password_change_requires_matching_confirmation(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->post('/dashboard/student/profile/password', ['current_password' => 'password', 'password' => 'New-password-123', 'password_confirmation' => 'different'])
            ->assertSessionHasErrorsIn('studentPassword', 'password');
        $this->assertSame($user->password, $user->fresh()->password);
    }

    public function test_password_change_requires_current_password(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->post('/dashboard/student/profile/password', ['password' => 'New-password-123', 'password_confirmation' => 'New-password-123'])
            ->assertSessionHasErrorsIn('studentPassword', 'current_password');
        $this->assertSame($user->password, $user->fresh()->password);
    }

    public function test_account_without_academic_profile_cannot_use_student_password_form(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/dashboard/student/profile/password', ['current_password' => 'password', 'password' => 'New-password-123', 'password_confirmation' => 'New-password-123'])->assertForbidden();
        $this->assertSame($user->password, $user->fresh()->password);
    }
}
