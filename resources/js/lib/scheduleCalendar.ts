export type TimedSession = { id: number; starts_at: string; ends_at: string };
export type CalendarSegment<T> = { session: T; start: number; end: number; lane: number; lanes: number };

/** Clip a UTC session to one Kinshasa calendar day, returning local minutes. */
export function daySegment<T extends TimedSession>(session: T, day: string): CalendarSegment<T> | null {
    const midnight = new Date(`${day}T00:00:00+01:00`).getTime();
    const start = Math.max(0, (new Date(session.starts_at).getTime() - midnight) / 60000);
    const end = Math.min(1440, (new Date(session.ends_at).getTime() - midnight) / 60000);
    return end > start ? { session, start, end, lane: 0, lanes: 1 } : null;
}

/** Place simultaneous sessions side by side; adjacent sessions reuse the same lane. */
export function layoutDay<T extends TimedSession>(sessions: T[], day: string): CalendarSegment<T>[] {
    const segments = sessions
        .map((session) => daySegment(session, day))
        .filter((item): item is CalendarSegment<T> => item !== null)
        .sort((a, b) => a.start - b.start || b.end - a.end || a.session.id - b.session.id);
    let group: CalendarSegment<T>[] = [];
    let groupEnd = -1;
    let laneEnds: number[] = [];
    const finish = () => {
        for (const item of group) item.lanes = laneEnds.length;
    };
    for (const segment of segments) {
        if (segment.start >= groupEnd) {
            finish();
            group = [];
            laneEnds = [];
        }
        let lane = laneEnds.findIndex((end) => end <= segment.start);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = segment.end;
        segment.lane = lane;
        group.push(segment);
        groupEnd = Math.max(segment.end, group.length === 1 ? segment.end : groupEnd);
    }
    finish();
    return segments;
}

/** Generate datetime-local values without using the browser's timezone. */
export function slotRange(day: string, minute: number, duration = 60) {
    const midnight = new Date(`${day}T00:00:00Z`).getTime();
    return {
        starts_at: new Date(midnight + minute * 60000).toISOString().slice(0, 16),
        ends_at: new Date(midnight + (minute + duration) * 60000).toISOString().slice(0, 16),
    };
}

/** Enumerate weekly occurrences inclusively within a user-defined semester period. */
export function recurringDates(start: string, end: string, weekdays: number[]): string[] {
    const first = new Date(`${start}T12:00:00Z`);
    const last = new Date(`${end}T12:00:00Z`);
    if (!Number.isFinite(first.getTime()) || !Number.isFinite(last.getTime()) || last < first || (last.getTime() - first.getTime()) / 86400000 > 366)
        return [];
    const result: string[] = [];
    for (const day = new Date(first); day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
        if (weekdays.includes(day.getUTCDay() || 7)) result.push(day.toISOString().slice(0, 10));
    }
    return result;
}
