export const zone = 'Africa/Kinshasa';
export const localParts = (value: string) =>
    Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: zone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(new Date(value))
            .map((part) => [part.type, part.value]),
    );
export const localDate = (value: string) => {
    const p = localParts(value);
    return `${p.year}-${p.month}-${p.day}`;
};
export const localInput = (value: string) => {
    const p = localParts(value);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
export const time = (value: string) => new Date(value).toLocaleTimeString('fr-FR', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
export const addDays = (value: string, days: number) => {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};
export const dateLabel = (value: string) =>
    new Date(`${value}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
