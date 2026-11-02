<?php

namespace Tests\Feature;

use App\Mail\EnrollmentSubmitted;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class ProfessionalEmailsTest extends TestCase
{
    use RefreshDatabase;

    private function student(): User
    {
        $user = new User;
        $user->forceFill(['first_name' => 'Alice', 'last_name' => 'Mukendi', 'email' => 'alice@example.test', 'password' => 'password'])->save();

        return $user;
    }

    public function test_verification_and_password_reset_emails_have_french_html_plain_text_and_working_urls(): void
    {
        config(['mail.default' => 'array', 'auth.verification.expire' => 45]);
        $user = $this->student();
        $verification = (new VerifyEmail)->toMail($user);
        $url = $verification->viewData['actionUrl'];
        $this->assertTrue(URL::hasValidSignature(\Illuminate\Http\Request::create($url)));
        $this->assertStringContainsString('45 minutes', $verification->viewData['notice']);
        $user->notify(new VerifyEmail);
        $user->notify(new ResetPassword('test-reset-token'));
        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(2, $messages);
        foreach ($messages as $sent) {
            $email = $sent->getOriginalMessage();
            $this->assertStringStartsWith('USK — ', $email->getSubject());
            $this->assertStringContainsString('Université Simon Kimbangu', $email->getHtmlBody());
            $this->assertStringContainsString('Bonjour Alice Mukendi', $email->getHtmlBody());
            $this->assertStringContainsString('contact@universitesk.net', $email->getHtmlBody());
            $this->assertStringContainsString('Alice Mukendi', $email->getTextBody());
            $this->assertStringNotContainsString('<table', $email->getTextBody());
            $this->assertSame('Université Simon Kimbangu', $email->getFrom()[0]->getName());
        }
        $reset = $messages->last()->getOriginalMessage();
        $this->assertStringContainsString('test-reset-token', $reset->getTextBody());
        $this->assertStringContainsString('email=alice%40example.test', $reset->getTextBody());
        $this->assertStringNotContainsString('&amp;', $reset->getTextBody());
    }

    public function test_enrollment_confirmation_uses_real_name_programme_and_dossier_link(): void
    {
        config(['mail.default' => 'array']);
        $user = $this->student();
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR']);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence en droit', 'code' => 'L1']);
        $year = DB::table('academic_years')->insertGetId(['title' => '2026-2027', 'start_date' => '2026-10-01', 'end_date' => '2027-09-30']);
        $enrollment = Enrollment::create(['student_id' => $user->id, 'level_id' => $level, 'academic_year_id' => $year, 'status' => 'submitted']);
        Mail::to($user->email)->send(new EnrollmentSubmitted($enrollment));
        $email = Mail::mailer('array')->getSymfonyTransport()->messages()->last()->getOriginalMessage();
        $this->assertStringContainsString('Alice Mukendi', $email->getHtmlBody());
        $this->assertStringContainsString('Licence en droit', $email->getHtmlBody());
        $this->assertStringContainsString('2026-2027', $email->getHtmlBody());
        $this->assertStringContainsString('/dashboard/enrollments/'.$enrollment->uuid, $email->getHtmlBody());
        $this->assertStringContainsString('ne vaut pas confirmation d’admission', $email->getTextBody());
        $this->assertStringContainsString('Kinshasa', $email->getTextBody());
    }

    public function test_html_escapes_recipient_names_and_does_not_load_external_images(): void
    {
        $user = $this->student();
        $user->first_name = '<script>alert(1)</script>';
        $message = (new VerifyEmail)->toMail($user);
        $html = view('emails.transactional', $message->viewData)->render();
        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringNotContainsString('<img', $html);
    }
}
