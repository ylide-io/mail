export function truncateInMiddle(string: string, maxLength: number, separator?: string) {
	if (maxLength >= string.length) return string;

	const targetLength = Math.max(maxLength, separator ? 2 : 1);
	const leftSize = Math.ceil(targetLength / 2);
	const rightSize = targetLength - leftSize;

	if (rightSize) {
		const parts = [string.slice(0, leftSize), string.slice(-rightSize)];
		return parts.join(separator || '');
	} else {
		return string.slice(0, leftSize);
	}
}

export function htmlSelfClosingTagsToXHtml(html: string) {
	return html.replace(
		/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|command|keygen|menuitem|frame)\b(.*?)[ /]*>/,
		'<$1$2 />',
	);
}

export function transformMatches<T>(
	input: string,
	regex: RegExp,
	transform: (item: string, index: number) => T,
): Array<T | string> {
	const res = [];
	const matches = [...input.matchAll(regex)];

	if (matches.length) {
		matches.forEach((m, i) => {
			const value = m[0];

			if (i === 0 && m.index! > 0) {
				res.push(input.slice(0, m.index));
			}

			res.push(transform(value, m.index!));

			if (i === matches.length - 1) {
				const s = input.slice(m.index! + value.length);
				if (s) {
					res.push(s);
				}
			}
		});
	} else {
		res.push(input);
	}

	return res;
}
