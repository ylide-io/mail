const LOCALE = 'en-US';

export type UnixTime = number;

//

const sameDayFormat = new Intl.DateTimeFormat(LOCALE, {
	hour12: false,
	hour: 'numeric',
	minute: 'numeric',
});

const sameYearFormat = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'short',
});

const anotherYearFormat = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'short',
	year: '2-digit',
});

const longFormat = new Intl.DateTimeFormat(LOCALE, {
	hour12: false,
	hour: 'numeric',
	minute: 'numeric',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
});

export enum DateFormatStyle {
	SHORT,
	LONG,
}

export function formatDate(date: Date | UnixTime, style: DateFormatStyle = DateFormatStyle.SHORT) {
	date = typeof date === 'number' ? new Date(date) : date;
	const now = new Date();

	const isSameYear = now.getFullYear() === date.getFullYear();
	const isSameDay = isSameYear && now.getMonth() === date.getMonth() && now.getDate() === date.getDate();

	const format =
		style === DateFormatStyle.LONG
			? longFormat
			: isSameDay
			? sameDayFormat
			: isSameYear
			? sameYearFormat
			: anotherYearFormat;

	return format.format(date);
}
