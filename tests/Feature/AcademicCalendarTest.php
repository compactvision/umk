<?php

namespace Tests\Feature;

use App\Models\AcademicCalendarEvent;
use App\Models\AcademicYear;
use App\Models\Student\AcademicSemester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_saves_and_exports_only_events_from_the_selected_year(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $this->actingAs($admin);
        $year = AcademicYear::create(['title' => '2026–2027', 'start_date' => '2026-10-15', 'end_date' => '2027-09-20', 'status' => 'open']);
        $other = AcademicYear::create(['title' => '2027–2028', 'start_date' => '2027-10-15', 'end_date' => '2028-09-20', 'status' => 'draft']);
        AcademicSemester::create(['academic_year_id' => $year->id, 'number' => 1, 'start_date' => '2026-10-15', 'end_date' => '2027-03-31']);
        AcademicSemester::create(['academic_year_id' => $other->id, 'number' => 1, 'start_date' => '2027-10-15', 'end_date' => '2028-03-31']);
        $prefix = 'dashboard.admin.academic-years.calendar.';
        $payload = ['title' => 'Examens, première session', 'category' => 'exam', 'start_date' => '2027-01-11', 'end_date' => '2027-01-15'];

        $this->post(route($prefix.'store', $year), array_replace($payload, ['start_date' => '2026-10-14']))
            ->assertSessionHasErrors('start_date');
        $this->post(route($prefix.'store', $year), $payload)->assertSessionHasNoErrors();
        $event = AcademicCalendarEvent::sole();
        $this->put(route($prefix.'update', [$other, $event]), array_replace($payload, ['start_date' => '2028-01-10', 'end_date' => '2028-01-14']))
            ->assertNotFound();
        $this->put(route($prefix.'update', [$year, $event]), array_replace($payload, ['end_date' => '2027-01-16']))
            ->assertSessionHasNoErrors();
        $this->post(route($prefix.'store', $other), ['title' => 'Rattrapages', 'category' => 'resit', 'start_date' => '2028-07-10', 'end_date' => '2028-07-10'])
            ->assertSessionHasNoErrors();

        $this->get(route($prefix.'index', ['academic_year_id' => $year->id]))
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/academicYear/Calendar')
                ->where('year.id', $year->id)->has('events', 1)->where('events.0.end_date', '2027-01-16')
                ->has('semesters', 1)->where('semesters.0.start_date', '2026-10-15'));
        $this->get(route($prefix.'export', $year))
            ->assertOk()->assertHeader('Content-Type', 'text/calendar; charset=UTF-8')
            ->assertDownload('calendrier-academique-'.$year->id.'.ics')
            ->assertSee('DTSTART;VALUE=DATE:20270111', false)
            ->assertSee('DTEND;VALUE=DATE:20270117', false)
            ->assertSee('SUMMARY:Examens\, première session', false)
            ->assertSee('SUMMARY:Période de cours · Semestre 1', false)
            ->assertSee('DTEND;VALUE=DATE:20270401', false)
            ->assertDontSee('DTSTART;VALUE=DATE:20271015', false)
            ->assertDontSee('Rattrapages');
    }
}
