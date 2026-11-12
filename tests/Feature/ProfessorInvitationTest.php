<?php

namespace Tests\Feature;

use App\Models\Professor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfessorInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_invite_and_professor_can_activate_and_sign_in_once(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage users', 'web'));
        $email = 'enseignant@example.test';
        $this->actingAs($admin)->post(route('dashboard.admin.professors.store'), [
            'first_name' => 'Aline', 'last_name' => 'Test', 'email' => $email, 'is_active' => true, 'send_invitation' => true,
        ])->assertSessionHasNoErrors()->assertRedirect();
        $professor = Professor::where('email', $email)->sole();
        $this->assertDatabaseMissing('users', ['email' => $email]);

        $message = Mail::getSymfonyTransport()->messages()->sole()->getOriginalMessage();
        $this->assertSame($email, $message->getTo()[0]->getAddress());
        $this->assertMatchesRegularExpression('~https?://\S+/invitation-enseignant/\d+/[A-Za-z0-9]{64}~', $message->getTextBody());
        preg_match('~https?://\S+/invitation-enseignant/\d+/[A-Za-z0-9]{64}~', $message->getTextBody(), $matches);
        $url = $matches[0];
        $this->assertSame(hash('sha256', basename($url)), $professor->invitation_hash);

        Auth::logout();
        $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('invitation.email', $email));
        $password = 'Essai-Enseignant-2026!';
        $credentials = ['password' => $password, 'password_confirmation' => $password];
        $this->post($url, $credentials)->assertSessionHasNoErrors()->assertRedirect(route('login'));
        $user = User::where('email', $email)->sole();
        $this->assertTrue($user->hasRole('professor'));
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertTrue(Hash::check($password, $user->password));
        $this->assertSame($user->id, $professor->fresh()->user_id);
        $this->get($url)->assertInertia(fn (Assert $page) => $page->where('invitation', null));
        $this->from($url)->post($url, $credentials)->assertSessionHasErrors('invitation');
        $this->post(route('login'), ['email' => $email, 'password' => $password])->assertSessionHasNoErrors();
        $profile = route('dashboard.teaching.profile');
        $workspace = route('dashboard.teaching.index');
        $upload = route('dashboard.teaching.profile.photo');
        $this->get($workspace)->assertRedirect($profile);
        $this->get('/dashboard/teacher/resources')->assertRedirect($profile);
        $this->get('/dashboard/teacher/assessments')->assertRedirect($profile);
        $this->get($profile)->assertInertia(fn (Assert $page) => $page->component('dashboard/teaching/Profile')->where('photoUrl', null));

        Storage::fake('local');
        $this->from($profile)->post($upload, ['photo' => UploadedFile::fake()->create('document.pdf')])->assertSessionHasErrors('photo');
        $this->post($upload, ['photo' => UploadedFile::fake()->image('portrait.png')])->assertRedirect($workspace);
        $professor->refresh();
        Storage::disk('local')->assertExists($professor->photo);
        $this->get($workspace)->assertOk();
        $this->get($professor->portraitUrl())->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs(User::factory()->create())->get($professor->portraitUrl())->assertForbidden();
        $this->actingAs($admin)->get(route('dashboard.admin.professors.show', $professor))->assertInertia(
            fn (Assert $page) => $page->where('professor.photo_url', $professor->portraitUrl())
        );
    }

    public function test_invitation_cannot_take_over_an_existing_account(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage users', 'web'));
        $existing = User::factory()->create();
        $professor = Professor::create(['first_name' => 'Aline', 'last_name' => 'Test', 'email' => $existing->email, 'is_active' => true]);

        $this->actingAs($admin)->post(route('dashboard.admin.professors.invitation', $professor))->assertSessionHasErrors('invitation');
        $this->assertNull($professor->fresh()->invitation_hash);
        $this->assertFalse($existing->fresh()->hasRole('professor'));
    }
}
