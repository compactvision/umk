<?php

namespace Tests\Feature\Settings;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Support\CreatesStudentContext;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use CreatesStudentContext, RefreshDatabase;

    public function test_student_profile_page_is_displayed(): void
    {
        $this->actingAs($this->studentContext())->get('/dashboard/student/profile')->assertOk();
    }

    public function test_verified_email_change_requires_password_and_new_verification(): void
    {
        Notification::fake();
        $user = $this->studentContext();
        $this->actingAs($user)->post('/dashboard/student/profile', ['first_name' => 'Test', 'last_name' => 'User', 'email' => 'updated@example.test', 'email_current_password' => 'password'])
            ->assertSessionHasNoErrors()->assertRedirect(route('verification.notice'));
        $this->assertSame('updated@example.test', $user->fresh()->email);
        $this->assertNull($user->fresh()->email_verified_at);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_identity_change_preserves_verification_when_email_is_unchanged(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->from('/dashboard/student/profile')->post('/dashboard/student/profile', ['first_name' => 'Updated', 'last_name' => $user->last_name, 'email' => $user->email])
            ->assertSessionHasNoErrors()->assertRedirect('/dashboard/student/profile');
        $this->assertSame('Updated', $user->fresh()->first_name);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_academic_identity_cannot_be_changed_by_profile_payload(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->post('/dashboard/student/profile', ['first_name' => $user->first_name, 'last_name' => $user->last_name, 'email' => $user->email, 'student_status' => 'graduated', 'matricule' => 'FORGED'])
            ->assertSessionHasErrors(['student_status', 'matricule']);
        $this->assertSame('active', $user->fresh()->studentProfile->student_status);
        $this->assertNull($user->fresh()->studentProfile->matricule);
    }

    public function test_profile_email_change_with_wrong_password_preserves_identity(): void
    {
        $user = $this->studentContext();
        $this->actingAs($user)->post('/dashboard/student/profile', ['first_name' => 'Changed', 'last_name' => $user->last_name, 'email' => 'forged@example.test', 'email_current_password' => 'wrong'])
            ->assertSessionHasErrors('email_current_password');
        $this->assertSame($user->email, $user->fresh()->email);
        $this->assertSame($user->first_name, $user->fresh()->first_name);
        $this->assertDatabaseCount('academic_enrollments', 1);
    }
}
