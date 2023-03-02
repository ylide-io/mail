const LOCALE = 'en-US';

export function constrain(num: number, min?: number | null, max?: number | null) {
	return min != null && num < min ? min : max != null && num > max ? max : num;
}

//

export function formatNumber(value: number, opts: Intl.NumberFormatOptions = {}) {
	return new Intl.NumberFormat(LOCALE, {
		style: 'decimal',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		...opts,
	}).format(value);
}
