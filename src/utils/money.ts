const LOCALE = 'en-US';

export const format = new Intl.NumberFormat(LOCALE, {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
	return format.format(value);
}
