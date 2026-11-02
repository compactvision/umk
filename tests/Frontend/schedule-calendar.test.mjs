import assert from 'node:assert/strict';
import test from 'node:test';
import { daySegment, layoutDay, slotRange, recurringDates } from '../../resources/js/lib/scheduleCalendar.ts';

const session = (id, start, end) => ({ id, starts_at: `2026-11-02T${start}:00Z`, ends_at: `2026-11-02T${end}:00Z` });

test('UTC sessions occupy the correct Kinshasa hours', () => {
    const item = daySegment(session(1, '07:00', '09:30'), '2026-11-02');
    assert.equal(item.start, 480);
    assert.equal(item.end, 630);
});
test('overnight sessions are clipped at midnight without an extra day at an exact boundary', () => {
    const overnight = { id: 1, starts_at: '2026-11-02T22:00:00Z', ends_at: '2026-11-03T01:00:00Z' };
    assert.equal(daySegment(overnight, '2026-11-02').end, 1440);
    assert.equal(daySegment(overnight, '2026-11-03').start, 0);
    assert.equal(daySegment(overnight, '2026-11-03').end, 120);
    assert.equal(daySegment({ ...overnight, ends_at: '2026-11-02T23:00:00Z' }, '2026-11-03'), null);
});
test('simultaneous sessions get distinct lanes and isolated sessions fill the width', () => {
    const events = layoutDay([session(1, '07:00', '10:00'), session(2, '08:00', '09:00'), session(3, '08:30', '09:30'), session(4, '11:00', '12:00')], '2026-11-02');
    assert.deepEqual(events.slice(0, 3).map((event) => event.lane), [0, 1, 2]);
    assert.ok(events.slice(0, 3).every((event) => event.lanes === 3));
    assert.equal(events[3].lanes, 1);
});
test('adjacent sessions reuse lanes and another day is excluded', () => {
    const events = layoutDay([session(1, '07:00', '08:00'), session(2, '08:00', '09:00')], '2026-11-02');
    assert.ok(events.every((event) => event.lane === 0 && event.lanes === 1));
    assert.deepEqual(layoutDay([session(1, '07:00', '08:00')], '2026-11-03'), []);
});

test('clicking late slots pre-fills a one-hour session across midnight', () => {
    assert.deepEqual(slotRange('2026-11-02', 1410), { starts_at: '2026-11-02T23:30', ends_at: '2026-11-03T00:30' });
    assert.deepEqual(slotRange('2026-11-02', 480), { starts_at: '2026-11-02T08:00', ends_at: '2026-11-02T09:00' });
});

test('semester recurrence counts selected weekdays inclusively', () => {
    assert.deepEqual(recurringDates('2026-11-01', '2026-11-16', [1, 3]), ['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16']);
    assert.deepEqual(recurringDates('2026-11-03', '2026-11-04', [1]), []);
    assert.deepEqual(recurringDates('2026-11-16', '2026-11-01', [1]), []);
});
