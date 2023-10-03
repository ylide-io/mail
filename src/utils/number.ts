const LOCALE = 'en-US';

export function constrain(num: number, min?: number | null, max?: number | null) {
	return min != null && num < min ? min : max != null && num > max ? max : num;
}

export function randomInt(min: number, max: number) {
	return Math.round(min + (max - min) * Math.random());
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

//

const counterFormat = new Intl.NumberFormat(LOCALE, {
	style: 'decimal',
	minimumFractionDigits: 0,
	maximumFractionDigits: 1,
});

export function formatCounter(value: number) {
	return value >= 1e6
		? `${counterFormat.format(value / 1e6)}M`
		: value >= 1e3
		? `${counterFormat.format(value / 1e3)}k`
		: value;
}
