const LOCALE = 'en-US';

export const format = new Intl.NumberFormat(LOCALE, {
	style: 'currency',
	currency: 'USD',

	// https://stackoverflow.com/questions/41045270/range-error-with-tolocalestring-with-maximumnumber-of-digits-0
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
	return format.format(value);
}
