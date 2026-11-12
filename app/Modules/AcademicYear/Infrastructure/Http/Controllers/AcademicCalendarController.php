<?php

namespace App\Modules\AcademicYear\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AcademicCalendarEvent;
use App\Models\AcademicYear;
use App\Models\Student\AcademicSemester;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AcademicCalendarController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['academic_year_id' => 'nullable|integer|exists:academic_years,id']);
        $years = AcademicYear::orderByDesc('start_date')->orderByDesc('id')->get(['id', 'title', 'start_date', 'end_date']);
        $today = now('Africa/Kinshasa')->toDateString();
        $year = isset($filters['academic_year_id'])
            ? $years->find($filters['academic_year_id'])
            : ($years->first(fn (AcademicYear $year) => $year->start_date <= $today && $year->end_date >= $today) ?? $years->first());

        return Inertia::render('dashboard/academicYear/Calendar', [
            'years' => $years,
            'year' => $year,
            'events' => $year ? $this->events($year->id)->get() : [],
            'semesters' => $year ? $this->semesters($year->id)->get(['id', 'number', 'start_date', 'end_date']) : [],
            'categories' => AcademicCalendarEvent::CATEGORIES,
        ]);
    }

    public function save(Request $request, AcademicYear $year, ?int $event = null)
    {
        $data = $request->validate([
            'title' => 'required|string|max:160',
            'category' => ['required', Rule::in(array_keys(AcademicCalendarEvent::CATEGORIES))],
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        DB::transaction(function () use ($year, $event, $data) {
            $lockedYear = AcademicYear::whereKey($year->id)->lockForUpdate()->firstOrFail();
            if ($data['start_date'] < $lockedYear->start_date || $data['end_date'] > $lockedYear->end_date) {
                throw ValidationException::withMessages(['start_date' => 'Les dates doivent être comprises dans l’année académique.']);
            }

            $entry = $event ? $this->events($lockedYear->id)->findOrFail($event) : new AcademicCalendarEvent(['academic_year_id' => $lockedYear->id]);
            $entry->fill($data)->save();
        }, 3);

        return back()->with('success', 'Événement enregistré.');
    }

    public function export(AcademicYear $year)
    {
        $lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//USK//Calendrier academique//FR', 'CALSCALE:GREGORIAN'];
        $host = parse_url(config('app.url'), PHP_URL_HOST) ?: 'usk';
        foreach ($this->semesters($year->id)->get() as $semester) {
            array_push($lines,
                'BEGIN:VEVENT',
                "UID:academic-semester-{$semester->id}@{$host}",
                'DTSTAMP:'.$semester->updated_at->utc()->format('Ymd\THis\Z'),
                'DTSTART;VALUE=DATE:'.$semester->start_date->format('Ymd'),
                'DTEND;VALUE=DATE:'.$semester->end_date->addDay()->format('Ymd'),
                "SUMMARY:Période de cours · Semestre {$semester->number}",
                'CATEGORIES:Cours',
                'END:VEVENT',
            );
        }
        foreach ($this->events($year->id)->get() as $event) {
            array_push($lines,
                'BEGIN:VEVENT',
                "UID:academic-event-{$event->id}@{$host}",
                'DTSTAMP:'.$event->updated_at->utc()->format('Ymd\THis\Z'),
                'DTSTART;VALUE=DATE:'.$event->start_date->format('Ymd'),
                'DTEND;VALUE=DATE:'.$event->end_date->addDay()->format('Ymd'),
                'SUMMARY:'.$this->calendarText($event->title),
                'CATEGORIES:'.$this->calendarText(AcademicCalendarEvent::CATEGORIES[$event->category]),
                'END:VEVENT',
            );
        }
        $lines[] = 'END:VCALENDAR';

        return response(implode("\r\n", $lines)."\r\n", 200, [
            'Content-Type' => 'text/calendar; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="calendrier-academique-'.$year->id.'.ics"',
        ]);
    }

    private function events(int $yearId): Builder
    {
        return AcademicCalendarEvent::where('academic_year_id', $yearId)->orderBy('start_date')->orderBy('id');
    }

    private function semesters(int $yearId): Builder
    {
        return AcademicSemester::where('academic_year_id', $yearId)->orderBy('number');
    }

    private function calendarText(string $value): string
    {
        $value = str_replace(["\\", "\r\n", "\r", "\n", ';', ','], ["\\\\", '\n', '\n', '\n', '\;', '\,'], $value);
        // A continuation begins with one space, leaving 74 bytes for UTF-8 text.
        $parts = [];
        while ($value !== '') {
            $part = mb_strcut($value, 0, 60, 'UTF-8');
            $parts[] = $part;
            $value = substr($value, strlen($part));
        }

        return implode("\r\n ", $parts);
    }
}
