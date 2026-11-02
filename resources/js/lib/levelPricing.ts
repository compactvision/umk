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
export function paymentTotal(first: PricingValue, second: PricingValue, previous?: PricingValue): number | null {
    if (hasPrice(first) || hasPrice(second))
        return hasPrice(first) && hasPrice(second) ? (Math.round(Number(first) * 100) + Math.round(Number(second) * 100)) / 100 : null;
    return hasPrice(previous) && Number(previous) > 0 ? Number(previous) : null;
}
export function formatPrice(value: PricingValue) {
    return hasPrice(value) ? `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $` : 'À confirmer';
}
