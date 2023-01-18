import { useMemo } from 'react';

import { DateFormatStyle, formatDate, UnixTime } from '../../utils/date';
import { PropsWithClassName } from '../propsWithClassName';

interface ReadableDateProps extends PropsWithClassName {
	style?: DateFormatStyle;
	value: Date | UnixTime;
}

export function ReadableDate({ className, style, value }: ReadableDateProps) {
	const date = useMemo(() => (typeof value === 'number' ? new Date(value) : value), [value]);

	return (
		<span className={className} title={date.toISOString()}>
			{formatDate(date, style)}
		</span>
	);
}
