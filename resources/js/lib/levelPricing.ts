export type PricingValue = string | number | null | undefined;
export type LevelPricing = {
    price?: PricingValue;
    price_foreign?: PricingValue;
    price_national_first?: PricingValue;
    price_national_second?: PricingValue;
    price_foreign_first?: PricingValue;
    price_foreign_second?: PricingValue;
};
export const paymentCategories = [
    { label: 'Nationaux', total: 'price', first: 'price_national_first', second: 'price_national_second' },
    { label: 'Étrangers', total: 'price_foreign', first: 'price_foreign_first', second: 'price_foreign_second' },
] as const;
export function hasPrice(value: PricingValue) {
    return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}
function minorUnits(value: PricingValue): number | null {
    const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(String(value ?? '').trim());
    return match ? Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')) : null;
}
export function paymentTotal(first: PricingValue, second: PricingValue, previous?: PricingValue): number | null {
    if (hasPrice(first) || hasPrice(second)) {
        const firstCents = minorUnits(first);
        const secondCents = minorUnits(second);
        return firstCents !== null && secondCents !== null ? (firstCents + secondCents) / 100 : null;
    }
    const previousCents = minorUnits(previous);
    return previousCents !== null && previousCents > 0 ? previousCents / 100 : null;
}
export function formatPrice(value: PricingValue) {
    return hasPrice(value) ? `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $` : 'À confirmer';
}
